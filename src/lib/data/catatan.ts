import { pool } from "@/lib/db";

function toISO(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

export type PengeluaranRow = {
  id: string;
  chat_id: string;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  nominal: number;
};

export type KaloriRow = {
  id: string;
  chat_id: string;
  tanggal: string;
  nama_makanan: string;
  estimasi_kalori: number;
};

export async function getPengeluaranById(chatId: string, id: string): Promise<PengeluaranRow | null> {
  const r = await pool.query(
    `SELECT id::text AS id, chat_id, tanggal, kategori, deskripsi, nominal::int AS nominal
     FROM pengeluaran WHERE id = $1::bigint AND chat_id = $2`,
    [id, chatId],
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: String(row.id),
    chat_id: String(row.chat_id),
    tanggal: toISO(row.tanggal as Date),
    kategori: String(row.kategori),
    deskripsi: String(row.deskripsi),
    nominal: Number(row.nominal),
  };
}

export async function getKaloriById(chatId: string, id: string): Promise<KaloriRow | null> {
  const r = await pool.query(
    `SELECT id::text AS id, chat_id, tanggal, nama_makanan, estimasi_kalori::int AS estimasi_kalori
     FROM kalori WHERE id = $1::bigint AND chat_id = $2`,
    [id, chatId],
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: String(row.id),
    chat_id: String(row.chat_id),
    tanggal: toISO(row.tanggal as Date),
    nama_makanan: String(row.nama_makanan),
    estimasi_kalori: Number(row.estimasi_kalori),
  };
}

export async function updatePengeluaran(
  chatId: string,
  id: string,
  data: { kategori: string; deskripsi: string; nominal: number },
): Promise<number> {
  const deskripsiLower = data.deskripsi.trim().toLowerCase();
  const r = await pool.query(
    `UPDATE pengeluaran SET kategori = $3, deskripsi = $4, nominal = $5 WHERE id = $1::bigint AND chat_id = $2`,
    [id, chatId, data.kategori, deskripsiLower, data.nominal],
  );
  return r.rowCount ?? 0;
}

export async function updateKalori(
  chatId: string,
  id: string,
  data: { nama_makanan: string; estimasi_kalori: number },
): Promise<number> {
  const namaLower = data.nama_makanan.trim().toLowerCase();
  const r = await pool.query(
    `UPDATE kalori SET nama_makanan = $3, estimasi_kalori = $4 WHERE id = $1::bigint AND chat_id = $2`,
    [id, chatId, namaLower, data.estimasi_kalori],
  );
  return r.rowCount ?? 0;
}

export async function deletePengeluaran(chatId: string, id: string): Promise<number> {
  const r = await pool.query(
    `WITH d AS (DELETE FROM pengeluaran WHERE id = $1::bigint AND chat_id = $2 RETURNING *)
     INSERT INTO catatan_dihapus (chat_id, jenis, data) SELECT chat_id, 'pengeluaran', to_jsonb(d) FROM d`,
    [id, chatId],
  );
  return r.rowCount ?? 0;
}

export async function deleteKalori(chatId: string, id: string): Promise<number> {
  const r = await pool.query(
    `WITH d AS (DELETE FROM kalori WHERE id = $1::bigint AND chat_id = $2 RETURNING *)
     INSERT INTO catatan_dihapus (chat_id, jenis, data) SELECT chat_id, 'kalori', to_jsonb(d) FROM d`,
    [id, chatId],
  );
  return r.rowCount ?? 0;
}
