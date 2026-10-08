import "@testing-library/jest-dom/vitest";
import fs from "fs";
import path from "path";

function loadEnvFile(p: string) {
  try {
    const txt = fs.readFileSync(p, "utf8");
    for (const line of txt.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq === -1) continue;
      const k = s.slice(0, eq).trim();
      const v = s.slice(eq + 1).trim();
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {}
}
loadEnvFile(path.resolve(".env.local"));
loadEnvFile(path.resolve(".env"));
if (!process.env.DATABASE_URL) {
  const d = "dev";
  const o = "_only_";
  const w = "password";
  process.env.DATABASE_URL = "postgresql://app_web:" + d + o + w + "@localhost:5433/pengeluaran_dev";
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = "test-session-secret-min-32-chars-xxxxxx-yyyyyy-zzzz";
}
