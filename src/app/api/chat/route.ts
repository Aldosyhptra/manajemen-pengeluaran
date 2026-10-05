import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  text: z.string().trim().min(1, "Tulis sesuatu dulu.").max(500, "Maksimal 500 karakter."),
});

export const maxDuration = 30;

type ErrorCode = "UNAUTHORIZED" | "VALIDATION_ERROR" | "UPSTREAM_TIMEOUT" | "UPSTREAM_ERROR" | "INTERNAL";

function errorResponse(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !(await verifySession(token))) {
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

  const chatFake = process.env.CHAT_FAKE === "true";
  const isProd = process.env.NODE_ENV === "production";

  // Mode palsu lokal (PRD 6.4)
  if (chatFake && !isProd) {
    // Balasan palsu tanpa memanggil n8n
    const reply = `Tercatat: ${text}`;
    return NextResponse.json({ reply });
  }

  // Production / CHAT_FAKE != true -> forward ke n8n
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  const ownerChatId = process.env.OWNER_CHAT_ID;

  if (!webhookUrl || !webhookSecret || !ownerChatId) {
    return errorResponse("INTERNAL", "Konfigurasi server belum lengkap.", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify({
        text,
        chat_id: ownerChatId,
        session_id: "web-main",
      }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      const msg =
        data && typeof data === "object" && "error" in data && (data as { error: { message?: string } }).error?.message
          ? (data as { error: { message: string } }).error.message
          : "Server n8n sedang bermasalah. Coba lagi.";
      return errorResponse("UPSTREAM_ERROR", msg, 502);
    }

    const n8nReplySchema = z.object({ reply: z.string().min(1) });
    const n8nParsed = n8nReplySchema.safeParse(data);
    if (n8nParsed.success) {
      return NextResponse.json({ reply: n8nParsed.data.reply });
    }

    return errorResponse("UPSTREAM_ERROR", "Respons n8n tidak valid.", 502);
  } catch (e) {
    const isAbort =
      e instanceof DOMException && e.name === "AbortError" ||
      (e instanceof Error && e.name === "AbortError");
    if (isAbort) {
      return errorResponse(
        "UPSTREAM_TIMEOUT",
        "Server terlalu lama merespons. Catatanmu mungkin sudah tersimpan, jadi cek Riwayat sebelum mengirim ulang.",
        504
      );
    }
    return errorResponse("UPSTREAM_ERROR", "Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
