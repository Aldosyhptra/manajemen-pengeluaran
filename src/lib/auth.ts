import * as jose from "jose";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SALT_BYTES = 16;
const KEYLEN = 64;

let FAKE_HASH: string | null = null;
function getFakeHash(): string {
  if (!FAKE_HASH) {
    const salt = randomBytes(SALT_BYTES);
    const derived = scryptSync("fake-password-for-timing-0123456789", salt, KEYLEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
    });
    FAKE_HASH = `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64")}$${derived.toString("base64")}`;
  }
  return FAKE_HASH;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diatur atau terlalu pendek (min 32 karakter)");
  }
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string): string {
  if (password.length < 10) throw new Error("Password minimal 10 karakter");
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false;
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    if (salt.length !== SALT_BYTES || expected.length !== KEYLEN) return false;
    const derived = scryptSync(password, salt, KEYLEN, { N: n, r, p });
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function getFakeHashForTiming(): string {
  return getFakeHash();
}

export function verifyWithFakeIfMissing(password: string): void {
  verifyPassword(password, getFakeHash());
}

export type SessionPayload = { uid: number; v: number };

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = getSecretKey();
  const now = Math.floor(Date.now() / 1000);
  return await new jose.SignJWT({ uid: payload.uid, v: payload.v })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jose.jwtVerify(token, secret);
    const uid = payload.uid as unknown;
    const v = payload.v as unknown;
    if (typeof uid !== "number" || typeof v !== "number") return null;
    return { uid, v };
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: number;
  username: string;
  nama: string;
  panggilan: string;
  chatId: string;
  peran: "admin" | "anggota";
  aktif: boolean;
  wajibGantiPassword: boolean;
  versiSesi: number;
  persona: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const r = await pool.query(
    "SELECT id, username, nama, panggilan, chat_id, peran, aktif, wajib_ganti_password, versi_sesi, persona FROM pengguna WHERE id = $1",
    [payload.uid],
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0] as {
    id: string | number;
    username: string;
    nama: string;
    panggilan: string;
    chat_id: string;
    peran: string;
    aktif: boolean;
    wajib_ganti_password: boolean;
    versi_sesi: number;
    persona: string | null;
  };
  if (!row.aktif) return null;
  if (Number(row.versi_sesi) !== payload.v) return null;
  return {
    id: Number(row.id),
    username: row.username,
    nama: row.nama,
    panggilan: row.panggilan,
    chatId: row.chat_id,
    peran: row.peran as "admin" | "anggota",
    aktif: row.aktif,
    wajibGantiPassword: row.wajib_ganti_password,
    versiSesi: Number(row.versi_sesi),
    persona: row.persona,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED") as Error & { code?: string };
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  const r = await pool.query("SELECT peran FROM pengguna WHERE id = $1", [user.id]);
  const peran = r.rows[0]?.peran as string | undefined;
  if (peran !== "admin" || user.peran !== "admin") {
    const err = new Error("FORBIDDEN") as Error & { code?: string };
    err.code = "FORBIDDEN";
    throw err;
  }
  return user;
}
