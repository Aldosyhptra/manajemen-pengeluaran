import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { DEFAULT_PERSONA } from "@/lib/persona";
import { getTargets } from "@/lib/data/queries";
import {
  countAktivitasChat1Jam,
  insertAktivitasChat,
  insertChatPesan,
  pruneKeep200,
} from "@/lib/data/chat";

const bodySchema = z.object({
  text: z.string().trim().min(1, "Tulis sesuatu dulu.").max(500, "Maksimal 500 karakter."),
});

const MAX_FOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_FOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export const maxDuration = 30;

type ErrorCode = "UNAUTHORIZED" | "VALIDATION_ERROR" | "UPSTREAM_TIMEOUT" | "UPSTREAM_ERROR" | "INTERNAL" | "RATE_LIMITED";

function errorResponse(code: ErrorCode, message: string, status: number) {
  const res = NextResponse.json({ error: { code, message } }, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: Request) {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "UNAUTHORIZED") return errorResponse("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk lagi.", 401);
    return errorResponse("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk lagi.", 401);
  }

  let text = "";
  let foto: File | null = null;

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Format tidak valid.", 400);
    }
    const rawText = form.get("text");
    text = typeof rawText === "string" ? rawText.trim() : "";
    const rawFoto = form.get("foto");
    if (rawFoto instanceof File && rawFoto.size > 0) {
      foto = rawFoto;
    }
    // validasi
    if (foto) {
      if (!ALLOWED_FOTO_TYPES.includes(foto.type)) {
        return errorResponse("VALIDATION_ERROR", "Foto harus JPG, PNG, atau WebP.", 400);
      }
      if (foto.size > MAX_FOTO_BYTES) {
        return errorResponse("VALIDATION_ERROR", "Foto maksimal 5MB.", 400);
      }
      if (text.length > 500) {
        return errorResponse("VALIDATION_ERROR", "Caption maksimal 500 karakter.", 400);
      }
      if (text.length === 0) {
        // izinkan foto tanpa caption — beri placeholder caption kosong untuk AI, tapi simpan penanda
        text = "";
      }
    } else {
      if (!text) return errorResponse("VALIDATION_ERROR", "Tulis sesuatu dulu atau pilih foto.", 400);
      if (text.length > 500) return errorResponse("VALIDATION_ERROR", "Maksimal 500 karakter.", 400);
    }
  } else {
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
    text = parsed.data.text;
  }

  const count = await countAktivitasChat1Jam(user.id);
  if (count >= 30) {
    return errorResponse("RATE_LIMITED", "Terlalu sering mengirim. Coba lagi nanti.", 429);
  }

  await insertAktivitasChat(user.id);
  // simpan pesan user: text atau penanda foto jika caption kosong
  const simpanText = text || (foto ? "(foto tanpa caption)" : "");
  await insertChatPesan(user.id, "user", simpanText || text || "(foto)");

  const chatFake = process.env.CHAT_FAKE === "true";
  const isProd = process.env.NODE_ENV === "production";

  if (chatFake && !isProd) {
    const captionNote = foto ? (text ? ` + foto (${foto.name})` : " + foto") : "";
    const reply = `Tercatat: ${text || "foto"}${captionNote}`;
    await insertChatPesan(user.id, "bot", reply);
    await pruneKeep200(user.id);
    const r = NextResponse.json({ reply });
    r.headers.set("Cache-Control", "no-store");
    return r;
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return errorResponse("INTERNAL", "Konfigurasi server belum lengkap.", 500);
  }

  let profil: { panggilan: string; persona: string; target_kalori: number };
  try {
    const targets = await getTargets(user.chatId);
    profil = {
      panggilan: user.panggilan,
      persona: user.persona ?? DEFAULT_PERSONA,
      target_kalori: targets.calorieTarget,
    };
  } catch {
    profil = {
      panggilan: user.panggilan,
      persona: user.persona ?? DEFAULT_PERSONA,
      target_kalori: 2000,
    };
  }

  async function callN8n(timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const tm = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (foto) {
        const fd = new FormData();
        fd.append("text", text);
        fd.append("chat_id", user.chatId);
        fd.append("session_id", `web-${user.chatId}`);
        fd.append("profil", JSON.stringify(profil));
        fd.append("foto", foto, foto.name);
        const res = await fetch(webhookUrl!, {
          method: "POST",
          headers: {
            "X-Webhook-Secret": webhookSecret!,
          },
          body: fd,
          signal: controller.signal,
        });
        return res;
      }
      const res = await fetch(webhookUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": webhookSecret!,
        },
        body: JSON.stringify({
          text,
          chat_id: user.chatId,
          session_id: `web-${user.chatId}`,
          profil,
        }),
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(tm);
    }
  }

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await callN8n(attempt === 1 ? 14_000 : 13_000);
      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && (data as { error: { message?: string } }).error?.message
            ? (data as { error: { message: string } }).error.message
            : "Server n8n sedang bermasalah. Coba lagi.";
        if (attempt === 1) {
          await delay(3000);
          continue;
        }
        return errorResponse("UPSTREAM_ERROR", msg, 502);
      }

      const n8nReplySchema = z.object({ reply: z.string().min(1) });
      const n8nParsed = n8nReplySchema.safeParse(data);
      if (!n8nParsed.success) {
        return errorResponse("UPSTREAM_ERROR", "Respons n8n tidak valid.", 502);
      }

      const reply = n8nParsed.data.reply;
      await insertChatPesan(user.id, "bot", reply);
      await pruneKeep200(user.id);
      const r = NextResponse.json({ reply });
      r.headers.set("Cache-Control", "no-store");
      return r;
    } catch (e) {
      const isAbort =
        (e instanceof DOMException && e.name === "AbortError") || (e instanceof Error && e.name === "AbortError");
      if (attempt === 1) {
        await delay(3000);
        continue;
      }
      if (isAbort) {
        return errorResponse(
          "UPSTREAM_TIMEOUT",
          "Sabar, AI-nya baru bangun. Server di Railway lagi dinyalakan — coba tunggu sebentar lalu kirim lagi.",
          504,
        );
      }
      return errorResponse("UPSTREAM_ERROR", "Tidak bisa menghubungi server n8n. Periksa koneksi atau coba lagi dalam beberapa saat.", 502);
    }
  }

  return errorResponse(
    "UPSTREAM_TIMEOUT",
    "Sabar, AI-nya baru bangun. Server di Railway lagi dinyalakan — coba tunggu sebentar lalu kirim lagi.",
    504,
  );
}
