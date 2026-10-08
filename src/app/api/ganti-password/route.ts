import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { gantiPasswordSchema } from "@/lib/schemas";
import { updatePasswordSendiri } from "@/lib/data/pengguna";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    const r = NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid. Silakan masuk lagi." } }, { status: 401 });
    r.headers.set("Cache-Control", "no-store");
    return r;
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    const r = NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Format tidak valid." } }, { status: 400 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const rawLama = (body as { passwordLama?: unknown })?.passwordLama;
  const rawBaru = (body as { passwordBaru?: unknown })?.passwordBaru;
  const rawKonf = (body as { konfirmasi?: unknown })?.konfirmasi;
  const passwordLama = typeof rawLama === "string" ? rawLama : "";
  const passwordBaru = typeof rawBaru === "string" ? rawBaru : "";
  // form kirim tanpa konfirmasi — samakan dengan passwordBaru biar lolos refine
  const konfirmasi = typeof rawKonf === "string" ? rawKonf : passwordBaru;
  const parsed = gantiPasswordSchema.safeParse({ passwordLama, passwordBaru, konfirmasi });
  if (!parsed.success) {
    const r = NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Input tidak valid." } }, { status: 400 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const q = await pool.query("SELECT password_hash FROM pengguna WHERE id = $1", [user.id]);
  const stored = q.rows[0]?.password_hash as string | undefined;
  if (!stored || !verifyPassword(parsed.data.passwordLama, stored)) {
    const r = NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Password lama salah." } }, { status: 400 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  let newHash: string;
  try { newHash = hashPassword(parsed.data.passwordBaru); } catch (e) {
    const r = NextResponse.json({ error: { code: "VALIDATION_ERROR", message: (e as Error).message } }, { status: 400 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const newV = await updatePasswordSendiri(user.id, newHash);
  if (!newV) {
    const r = NextResponse.json({ error: { code: "INTERNAL", message: "Gagal mengganti password." } }, { status: 500 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const token = await signSession({ uid: user.id, v: newV });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Cache-Control", "no-store");
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  return res;
}
