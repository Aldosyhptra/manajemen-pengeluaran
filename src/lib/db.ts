import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur");
}

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
  // Jangan log connection string
  console.error("[db] pool error:", err.message);
});

export async function query<T extends import("pg").QueryResultRow>(text: string, params: unknown[]) {
  return pool.query<T>(text, params);
}
