import { pool } from "@/lib/db";
import {
  dashboardTodaySchema,
  dashboardTrendRowSchema,
  spendingByCategoryRowSchema,
  recentRowSchema,
  historyExpenseRowSchema,
  historyMealRowSchema,
  pengaturanRowSchema,
} from "@/lib/schemas";

// Helper: Date -> ISO string untuk UI
function toISO(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

// YYYY-MM-DD WIB hari ini (PRD 6)
export function todayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

// ---- Dashboard (PRD 6.1) ----
export async function getTodayTotals(chatId: string, dateWIB: string) {
  const cal = await pool.query(
    "SELECT COALESCE(SUM(estimasi_kalori),0)::int AS calories FROM kalori WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = $2::date",
    [chatId, dateWIB]
  );
  const spend = await pool.query(
    "SELECT COALESCE(SUM(nominal),0)::int AS spending FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = $2::date",
    [chatId, dateWIB]
  );
  const parsed = dashboardTodaySchema.parse({
    calories: cal.rows[0]?.calories ?? 0,
    spending: spend.rows[0]?.spending ?? 0,
  });
  return parsed;
}

export async function getTrend7d(chatId: string, dateWIB: string) {
  const r = await pool.query(
    `WITH days AS (SELECT generate_series($2::date - 6, $2::date, interval '1 day')::date AS d)
     SELECT days.d::text AS date,
       COALESCE((SELECT SUM(estimasi_kalori) FROM kalori WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = days.d), 0)::int AS calories,
       COALESCE((SELECT SUM(nominal) FROM pengeluaran WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date = days.d), 0)::int AS spending
     FROM days ORDER BY days.d`,
    [chatId, dateWIB]
  );
  return r.rows.map((row) => dashboardTrendRowSchema.parse(row));
}

export async function getSpendingByCategory7d(chatId: string, dateWIB: string) {
  const r = await pool.query(
    `SELECT kategori AS category, SUM(nominal)::int AS total FROM pengeluaran
     WHERE chat_id = $1 AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $2::date - 6 AND $2::date
     GROUP BY kategori ORDER BY total DESC`,
    [chatId, dateWIB]
  );
  return r.rows.map((row) => spendingByCategoryRowSchema.parse(row));
}

export async function getRecent(chatId: string) {
  const r = await pool.query(
    `SELECT id::text AS id, tanggal AS "at", deskripsi AS description, nominal AS amount
     FROM pengeluaran WHERE chat_id = $1 ORDER BY tanggal DESC, id DESC LIMIT 5`,
    [chatId]
  );
  return r.rows.map((row) =>
    recentRowSchema.parse({ ...row, at: toISO(row.at as Date) })
  );
}

export async function getTargets(chatId: string) {
  const r = await pool.query(
    "SELECT target_kalori, budget_harian FROM pengaturan WHERE chat_id = $1",
    [chatId]
  );
  if (r.rows.length === 0) return { calorieTarget: 2000, budgetTarget: 150000 };
  const parsed = pengaturanRowSchema.parse(r.rows[0]);
  return {
    calorieTarget: Number(parsed.target_kalori),
    budgetTarget: Number(parsed.budget_harian),
  };
}

export async function getDashboardData(chatId: string, dateWIB = todayWIB()) {
  const [today, trend7d, spendingByCategory7d, recent, targets] = await Promise.all([
    getTodayTotals(chatId, dateWIB),
    getTrend7d(chatId, dateWIB),
    getSpendingByCategory7d(chatId, dateWIB),
    getRecent(chatId),
    getTargets(chatId),
  ]);
  return {
    date: dateWIB,
    today,
    targets,
    trend7d,
    spendingByCategory7d,
    recent,
  };
}

// ---- Riwayat (PRD 6.2) ----
export async function getHistory(
  chatId: string,
  from: string,
  to: string,
  category: string | null
) {
  const expenses = await pool.query(
    `SELECT id::text AS id, tanggal AS "at", kategori AS category, deskripsi AS description, nominal AS amount
     FROM pengeluaran
     WHERE chat_id = $1
       AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $2::date AND $3::date
       AND ($4::text IS NULL OR kategori = $4)
     ORDER BY tanggal DESC, id DESC LIMIT 200`,
    [chatId, from, to, category]
  );
  const meals = await pool.query(
    `SELECT id::text AS id, tanggal AS "at", nama_makanan AS name, estimasi_kalori AS calories
     FROM kalori
     WHERE chat_id = $1
       AND (tanggal AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $2::date AND $3::date
     ORDER BY tanggal DESC, id DESC LIMIT 200`,
    [chatId, from, to]
  );
  return {
    expenses: expenses.rows.map((row) =>
      historyExpenseRowSchema.parse({ ...row, at: toISO(row.at as Date) })
    ),
    meals: meals.rows.map((row) =>
      historyMealRowSchema.parse({ ...row, at: toISO(row.at as Date) })
    ),
  };
}

// ---- Pengaturan upsert (PRD 6.3) ----
export async function upsertPengaturan(chatId: string, calorieTarget: number, budgetTarget: number) {
  await pool.query(
    `INSERT INTO pengaturan (chat_id, target_kalori, budget_harian) VALUES ($1, $2, $3)
     ON CONFLICT (chat_id) DO UPDATE
     SET target_kalori = EXCLUDED.target_kalori, budget_harian = EXCLUDED.budget_harian, diperbarui = now()`,
    [chatId, calorieTarget, budgetTarget]
  );
}
