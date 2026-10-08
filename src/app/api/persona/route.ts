import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { validatePersona } from "@/lib/persona";
import { permintaanPersonaSchema } from "@/lib/schemas";
import {
  countAktivitasPersona1Jam,
  insertAktivitasPersona,
} from "@/lib/data/pengguna";
import { pool } from "@/lib/db";

export const maxDuration = 30;

type ErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_ERROR"
  | "PERSONA_DITOLAK"
  | "INTERNAL";

function errorResponse(code: ErrorCode, message: string, status: number) {
  const res = NextResponse.json({ error: { code, message } }, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

const bodySchema = z.object({
  permintaan: permintaanPersonaSchema,
});

export async function POST(req: Request) {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "UNAUTHORIZED")
      return errorResponse("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk lagi.", 401);
    return errorResponse("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk lagi.", 401);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Format tidak valid.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Input tidak valid.";
    return errorResponse("VALIDATION_ERROR", msg, 400);
  }

  const permintaan = parsed.data.permintaan;

  const count = await countAktivitasPersona1Jam(user.id);
  if (count >= 5) {
    return errorResponse("RATE_LIMITED", "Terlalu sering ganti persona. Coba lagi nanti.", 429);
  }
  await insertAktivitasPersona(user.id);

  const personaFake = process.env.PERSONA_FAKE === "true";
  const isProd = process.env.NODE_ENV === "production";

  if (personaFake && !isProd) {
    // buat persona palsu deterministik yang lolos validatePersona (40-1200, tanpa pola terlarang)
    let fake =
      "Gaya bicara: " + permintaan + ". Ramah, hangat, dan membantu dalam bahasa Indonesia yang sopan. " +
      "Balasan singkat, jelas, dan menenangkan untuk " + user.panggilan + ". " +
      "Jika perlu, beri saran singkat dan tetap sopan.";
    // pastikan 40-1200 dan tidak mengandung kata terlarang
    if (fake.length < 40) fake = fake.padEnd(60, " ramah.");
    if (fake.length > 1200) fake = fake.slice(0, 1200);
    const v = validatePersona(fake);
    if (!v.ok) {
      // fallback aman yang pasti lolos
      fake =
        "Gaya bicara: ramah, hangat, dan sopan dalam bahasa Indonesia. " +
        "Balasan singkat dan jelas, menenangkan, dengan saran lembut bila diperlukan.";
    } else {
      // double check setelah pad
      const v2 = validatePersona(fake);
      if (!v2.ok) {
        fake =
          "Gaya bicara: ramah, hangat, dan sopan dalam bahasa Indonesia. " +
          "Balasan singkat dan jelas, menenangkan, dengan saran lembut bila diperlukan.";
      }
    }
    await pool.query("UPDATE pengguna SET persona = $2, persona_diperbarui = now() WHERE id = $1", [
      user.id,
      fake,
    ]);
    const r = NextResponse.json({ persona: fake });
    r.headers.set("Cache-Control", "no-store");
    return r;
  }

  const personaUrl = process.env.N8N_PERSONA_URL;
  const personaSecret = process.env.N8N_PERSONA_SECRET;

  if (!personaUrl || !personaSecret) {
    return errorResponse("INTERNAL", "Konfigurasi server belum lengkap.", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(personaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": personaSecret,
      },
      body: JSON.stringify({ permintaan, panggilan: user.panggilan }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      // n8n persona menolak 422
      if (res.status === 422) {
        const msg =
          data && typeof data === "object" && "error" in data && (data as { error: { message?: string } }).error?.message
            ? (data as { error: { message: string } }).error.message
            : "Permintaan persona ditolak.";
        return errorResponse("PERSONA_DITOLAK", msg, 422);
      }
      const msg =
        data && typeof data === "object" && "error" in data && (data as { error: { message?: string } }).error?.message
          ? (data as { error: { message: string } }).error.message
          : "Server persona bermasalah. Coba lagi.";
      return errorResponse("UPSTREAM_ERROR", msg, 502);
    }

    const okSchema = z.object({ persona: z.string().min(1) });
    const okParsed = okSchema.safeParse(data);
    if (!okParsed.success) {
      return errorResponse("UPSTREAM_ERROR", "Respons persona tidak valid.", 502);
    }

    const personaText = okParsed.data.persona.trim();

    const validation = validatePersona(personaText);
    if (!validation.ok) {
      return errorResponse("PERSONA_DITOLAK", validation.alasan, 422);
    }

    await pool.query("UPDATE pengguna SET persona = $2, persona_diperbarui = now() WHERE id = $1", [
      user.id,
      personaText,
    ]);

    const r = NextResponse.json({ persona: personaText });
    r.headers.set("Cache-Control", "no-store");
    return r;
  } catch (e) {
    const isAbort =
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && e.name === "AbortError");
    if (isAbort) {
      return errorResponse(
        "UPSTREAM_TIMEOUT",
        "Server persona terlalu lama merespons. Coba lagi.",
        504,
      );
    }
    return errorResponse("UPSTREAM_ERROR", "Tidak bisa menghubungi server persona. Coba lagi.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function DELETE() {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "UNAUTHORIZED")
      return errorResponse("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk lagi.", 401);
    return errorResponse("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk lagi.", 401);
  }

  await pool.query("UPDATE pengguna SET persona = NULL, persona_diperbarui = now() WHERE id = $1", [
    user.id,
  ]);
  const r = NextResponse.json({ ok: true, persona: null as string | null });
  r.headers.set("Cache-Control", "no-store");
  return r;
}
