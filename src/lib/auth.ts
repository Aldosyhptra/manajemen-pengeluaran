import * as jose from "jose";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diatur atau terlalu pendek (min 32 karakter)");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(): Promise<string> {
  const secret = getSecretKey();
  const now = Math.floor(Date.now() / 1000);
  return await new jose.SignJWT({ iat: now })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    await jose.jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
