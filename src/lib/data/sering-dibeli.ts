import { pool } from "@/lib/db";

export type SeringItem = { nama: string; jumlah: number; nominal_terakhir: number };


export async function getSeringDibeli(chatId: string): Promise<SeringItem[]> {
  const r = await pool.query(
    `SELECT lower(btrim(deskripsi)) AS nama,
            count(*)::int AS jumlah,
            (array_agg(nominal ORDER BY tanggal DESC, id DESC))[1]::int AS nominal_terakhir
     FROM pengeluaran
     WHERE chat_id = $1 AND tanggal > now() - interval '90 days'
     GROUP BY lower(btrim(deskripsi))
     HAVING count(*) >= 2
     ORDER BY count(*) DESC, max(tanggal) DESC
     LIMIT 6`,
    [chatId],
  );
  return r.rows as SeringItem[];
}
