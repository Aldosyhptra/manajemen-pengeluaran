import { NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

// Rate limit in-memory: 5 gagal per 15 menit per IP
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: { code: "TOO_MANY_REQUESTS", message: "Terlalu banyak percobaan. Coba lagi nanti." } },
      { status: 429 }
    );
  }
  if (entry && now >= entry.resetAt) attempts.delete(ip);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Format tidak valid." } }, { status: 400 });
  }

  const password = typeof (body as { password?: unknown })?.password === "string" ? (body as { password: string }).password : "";
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Konfigurasi server belum lengkap." } },
      { status: 500 }
    );
  }

  if (password !== appPassword) {
    const cur = attempts.get(ip);
    if (cur && now < cur.resetAt) {
      cur.count += 1;
      attempts.set(ip, cur);
    } else {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Password salah. Coba lagi." } },
      { status: 401 }
    );
  }

  // sukses -> reset percobaan
  attempts.delete(ip);

  let token: string;
  try {
    token = await signSession();
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL", message: "Gagal membuat sesi." } }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
