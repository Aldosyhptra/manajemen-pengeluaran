import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyPassword, verifyWithFakeIfMissing, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { countLoginGagal, insertLoginGagal, clearLoginGagal, cleanupLoginGagal } from "@/lib/data/pengguna";

export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function jsonError(code: string, message: string, status: number) {
  const res = NextResponse.json({ error: { code, message } }, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("VALIDATION_ERROR", "Format tidak valid.", 400);
  }
  const usernameRaw = typeof (body as { username?: unknown })?.username === "string" ? (body as { username: string }).username.trim() : "";
  const password = typeof (body as { password?: unknown })?.password === "string" ? (body as { password: string }).password : "";

  if (!usernameRaw || !password) {
    return jsonError("VALIDATION_ERROR", "Username dan password wajib diisi.", 400);
  }
  // normalisasi username lowercase (sesuai check a-z0-9._-)
  const username = usernameRaw.toLowerCase();
  const ip = getClientIp(req);
  const kunciUser = `u:${username}`;
  const kunciIp = `ip:${ip}`;

  // cek batas sebelum query user
  const [nUser, nIp] = await Promise.all([countLoginGagal(kunciUser, 15), countLoginGagal(kunciIp, 15)]);
  if (nUser >= 5 || nIp >= 20) {
    return jsonError("RATE_LIMITED", "Terlalu banyak percobaan. Coba lagi nanti.", 429);
  }

  // ambil akun (hanya di sini password_hash dipilih)
  const r = await pool.query(
    "SELECT id, password_hash, aktif, versi_sesi, wajib_ganti_password FROM pengguna WHERE username = $1",
    [username],
  );

  if (r.rows.length === 0) {
    // hash palsu agar timing sama, pesan generik
    verifyWithFakeIfMissing(password);
    await Promise.all([insertLoginGagal(kunciUser), insertLoginGagal(kunciIp)]);
    return jsonError("UNAUTHORIZED", "Username atau password salah.", 401);
  }

  const row = r.rows[0] as { id: string | number; password_hash: string; aktif: boolean; versi_sesi: number; wajib_ganti_password: boolean };

  // jika nonaktif tetap verifikasi dulu lalu balas generik (PRD 8.3)
  const ok = verifyPassword(password, row.password_hash);
  if (!row.aktif || !ok) {
    await Promise.all([insertLoginGagal(kunciUser), insertLoginGagal(kunciIp)]);
    return jsonError("UNAUTHORIZED", "Username atau password salah.", 401);
  }

  // sukses -> bersihkan
  await Promise.all([clearLoginGagal(kunciUser), clearLoginGagal(kunciIp), cleanupLoginGagal().catch(() => {})]);

  let token: string;
  try {
    token = await signSession({ uid: Number(row.id), v: Number(row.versi_sesi) });
  } catch {
    return jsonError("INTERNAL", "Gagal membuat sesi.", 500);
  }

  const res = NextResponse.json({ ok: true, wajibGantiPassword: row.wajib_ganti_password });
  res.headers.set("Cache-Control", "no-store");
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
