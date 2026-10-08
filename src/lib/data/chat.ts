import { pool } from "@/lib/db";

export type ChatRow = { id: string; role: "user" | "bot"; text: string; at: string };

function toISO(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

export async function getChatHistory(penggunaId: number): Promise<ChatRow[]> {
  const r = await pool.query(
    `SELECT id::text AS id, peran AS role, teks AS text, waktu AS "at" FROM (
       SELECT * FROM chat_pesan WHERE pengguna_id = $1 ORDER BY waktu DESC, id DESC LIMIT 50
     ) t ORDER BY waktu ASC, id ASC`,
    [penggunaId],
  );
  return r.rows.map((row) => ({
    id: String(row.id),
    role: row.role as "user" | "bot",
    text: String(row.text),
    at: toISO(row.at as Date),
  }));
}

export async function countAktivitasChat1Jam(penggunaId: number): Promise<number> {
  const r = await pool.query(
    "SELECT count(*)::int AS n FROM aktivitas WHERE pengguna_id = $1 AND jenis = 'chat' AND waktu > now() - interval '1 hour'",
    [penggunaId],
  );
  return Number(r.rows[0]?.n ?? 0);
}

export async function insertAktivitasChat(penggunaId: number): Promise<void> {
  await pool.query("INSERT INTO aktivitas (pengguna_id, jenis) VALUES ($1, 'chat')", [penggunaId]);
}

export async function insertChatPesan(penggunaId: number, peran: "user" | "bot", teks: string): Promise<void> {
  await pool.query("INSERT INTO chat_pesan (pengguna_id, peran, teks) VALUES ($1, $2, $3)", [penggunaId, peran, teks]);
}

export async function pruneKeep200(penggunaId: number): Promise<void> {
  await pool.query(
    "DELETE FROM chat_pesan WHERE pengguna_id = $1 AND id NOT IN (SELECT id FROM chat_pesan WHERE pengguna_id = $1 ORDER BY waktu DESC, id DESC LIMIT 200)",
    [penggunaId],
  );
}

export async function clearChat(penggunaId: number): Promise<void> {
  await pool.query("DELETE FROM chat_pesan WHERE pengguna_id = $1", [penggunaId]);
}
