import pg from "pg";
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config({ path: ".env.local" });
const { Pool } = pg;
const chatSeed = "1000000001";
const chatOwner = process.env.OWNER_CHAT_ID;
console.log("OWNER", chatOwner, "seed", chatSeed);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
console.log("todayWIB", today);
const cal = await pool.query("SELECT COALESCE(SUM(estimasi_kalori),0)::int AS calories FROM kalori WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = $2::date", [chatSeed, today]);
const spend = await pool.query("SELECT COALESCE(SUM(nominal),0)::int AS spending FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = $2::date", [chatSeed, today]);
console.log("today seed", cal.rows[0], spend.rows[0]);
const cal2 = await pool.query("SELECT COALESCE(SUM(estimasi_kalori),0)::int AS calories FROM kalori WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = $2::date", [chatOwner, today]);
const spend2 = await pool.query("SELECT COALESCE(SUM(nominal),0)::int AS spending FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = $2::date", [chatOwner, today]);
console.log("today owner (expect 0)", cal2.rows[0], spend2.rows[0]);
const trend = await pool.query("WITH days AS (SELECT generate_series($2::date - 6, $2::date, interval '1 day')::date AS d) SELECT days.d::text AS date, COALESCE((SELECT SUM(estimasi_kalori) FROM kalori WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = days.d), 0)::int AS calories, COALESCE((SELECT SUM(nominal) FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = days.d), 0)::int AS spending FROM days ORDER BY days.d", [chatSeed, today]);
console.log("trend7d", trend.rows);
const kat = await pool.query("SELECT kategori AS category, SUM(nominal)::int AS total FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $2::date - 6 AND $2::date GROUP BY kategori ORDER BY total DESC", [chatSeed, today]);
console.log("kategori", kat.rows);
const rec = await pool.query('SELECT id::text AS id, tanggal AS "at", deskripsi AS description, nominal AS amount FROM pengeluaran WHERE chat_id = $1 ORDER BY tanggal DESC, id DESC LIMIT 5', [chatSeed]);
console.log("recent", rec.rows.length, rec.rows.map(r => r.description));
const peng = await pool.query("SELECT target_kalori, budget_harian FROM pengaturan WHERE chat_id = $1", [chatSeed]);
console.log("pengaturan", peng.rows);
// Zod + history
const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
const exp = await pool.query('SELECT id::text AS id, tanggal AS "at", kategori AS category, deskripsi AS description, nominal AS amount FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE \'Asia/Jakarta\')::date BETWEEN $2::date AND $3::date AND ($4::text IS NULL OR kategori = $4) ORDER BY tanggal DESC, id DESC LIMIT 200', [chatSeed, from, today, null]);
console.log("history expenses", exp.rowCount);
const meals = await pool.query('SELECT id::text AS id, tanggal AS "at", nama_makanan AS name, estimasi_kalori AS calories FROM kalori WHERE chat_id = $1 AND (tanggal AT TIME ZONE \'Asia/Jakarta\')::date BETWEEN $2::date AND $3::date ORDER BY tanggal DESC, id DESC LIMIT 200', [chatSeed, from, today]);
console.log("history meals", meals.rowCount);
// Zod validation
try {
  const dashboardTodaySchema = z.object({ calories: z.number().int().min(0), spending: z.number().int().min(0) });
  dashboardTodaySchema.parse({ calories: cal.rows[0].calories, spending: spend.rows[0].spending });
  console.log("Zod today OK");
  const trendSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), calories: z.number().int(), spending: z.number().int() });
  trend.rows.forEach(r => trendSchema.parse(r));
  console.log("Zod trend OK (7 rows)", trend.rows.length === 7 ? "length 7 OK" : "FAIL length");
} catch (e) { console.log("Zod fail", e.message); }
await pool.end();
console.log("done");
