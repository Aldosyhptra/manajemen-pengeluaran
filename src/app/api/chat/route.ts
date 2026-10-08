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

  const text = parsed.data.text;

  const count = await countAktivitasChat1Jam(user.id);
  if (count >= 30) {
    return errorResponse("RATE_LIMITED", "Terlalu sering mengirim. Coba lagi nanti.", 429);
  }

  await insertAktivitasChat(user.id);
  await insertChatPesan(user.id, "user", text);

  const chatFake = process.env.CHAT_FAKE === "true";
  const isProd = process.env.NODE_ENV === "production";

  if (chatFake && !isProd) {
    const reply = `Tercatat: ${text}`;
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

  // Retry 1x: first 14s, jika timeout/network atau 502 cepat (<5s) tunggu 3s lalu retry 13s.
  // Total ~30s masih dalam maxDuration:30. Meniru Telegram yang hold lebih lama.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const timeoutMs = attempt === 1 ? 14_000 : 13_000;
    const start = Date.now();
    try {
      const res = await callN8n(timeoutMs);
      const data = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && (data as { error: { message?: string } }).error?.message
            ? (data as { error: { message: string } }).error.message
            : "Server n8n sedang bermasalah. Coba lagi.";
        const elapsed = Date.now() - start;
        if (attempt === 1 && elapsed < 5000) {
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
