import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur");
}

export const pool = new Pool({
  connectionString,
  max: 3,
});

export async function query<T extends import("pg").QueryResultRow>(text: string, params: unknown[]) {
  return pool.query<T>(text, params);
}
