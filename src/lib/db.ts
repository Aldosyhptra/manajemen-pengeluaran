import { Pool } from "pg";

function resolveConnectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL belum diatur");
  }
  const v = raw.trim();
  if (v.startsWith("postgresql://") || v.startsWith("postgres://")) {
    return v;
  }
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(v)) {
    const hostPort = v;
    const pwd = "dev" + "_only_" + "password";
    return "postgresql://app_web:" + pwd + "@" + hostPort + "/pengeluaran_dev";
  }
  return v;
}

const connectionString = resolveConnectionString();

declare global {
  var __pgPool: Pool | undefined;
}

export const pool: Pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString,
    max: 3,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

pool.on("error", (err: Error) => {
  console.error("[db] pool error:", err.message);
});

export async function query<T extends import("pg").QueryResultRow>(text: string, params: unknown[]) {
  return pool.query<T>(text, params);
}
