import { randomInt } from "node:crypto";

// Charset tanpa 0/O/1/l/I agar tidak mudah tertukar
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function generatePasswordSementara(length = 12): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CHARSET[randomInt(CHARSET.length)];
  return out;
}

export function isPasswordSementaraValid(s: string): boolean {
  if (s.length !== 12) return false;
  for (const ch of s) if (!CHARSET.includes(ch)) return false;
  return true;
}

export const PASSWORD_TEMP_CHARSET = CHARSET;
