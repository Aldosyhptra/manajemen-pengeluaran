import { z } from "zod";

// 8 kategori valid (DB constraint)
export const kategoriSchema = z.enum([
  "makanan",
  "minuman",
  "transportasi",
  "belanja",
  "tagihan",
  "kesehatan",
  "hiburan",
  "lainnya",
]);

// Pengaturan (PRD 6.3)
export const pengaturanInputSchema = z.object({
  calorieTarget: z.coerce.number().int().min(500).max(10000),
  budgetTarget: z.coerce.number().int().min(1).max(50_000_000),
});

// Baris pengaturan dari DB (default jika tidak ada baris)
export const pengaturanRowSchema = z.object({
  target_kalori: z.coerce.number().int(),
  budget_harian: z.coerce.number().int(),
});

// Dashboard (PRD 6.1)
export const dashboardTodaySchema = z.object({
  calories: z.number().int().min(0),
  spending: z.number().int().min(0),
});

export const dashboardTrendRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calories: z.number().int().min(0),
  spending: z.number().int().min(0),
});

export const spendingByCategoryRowSchema = z.object({
  category: z.string(),
  total: z.number().int().min(0),
});

export const recentRowSchema = z.object({
  id: z.string(),
  at: z.string(), // ISO string dari Date.toISOString() di server
  description: z.string(),
  amount: z.number().int().min(1),
});

export const dashboardDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  today: dashboardTodaySchema,
  targets: z.object({
    calorieTarget: z.number().int(),
    budgetTarget: z.number().int(),
  }),
  trend7d: z.array(dashboardTrendRowSchema).length(7),
  spendingByCategory7d: z.array(spendingByCategoryRowSchema),
  recent: z.array(recentRowSchema).max(5),
});

// Riwayat (PRD 6.2)
export const historyExpenseRowSchema = z.object({
  id: z.string(),
  at: z.string(),
  category: z.string(),
  description: z.string(),
  amount: z.number().int().min(1),
});

export const historyMealRowSchema = z.object({
  id: z.string(),
  at: z.string(),
  name: z.string(),
  calories: z.number().int().min(0),
});

export const historyDataSchema = z.object({
  expenses: z.array(historyExpenseRowSchema),
  meals: z.array(historyMealRowSchema),
});

// Filter riwayat via searchParams - pakai z.iso.date() agar 2026-13-45 ditolak
export const historyFilterSchema = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    category: kategoriSchema.optional(),
  })
  .refine(
    (v) => {
      if (v.from && v.to) {
        const d1 = new Date(v.from);
        const d2 = new Date(v.to);
        const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        if (diff < 0) return false;
        if (diff > 366) return false;
      }
      return true;
    },
    { message: "Rentang tanggal maksimal 366 hari dan from <= to", path: ["from"] }
  );

export type Kategori = z.infer<typeof kategoriSchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
export type HistoryData = z.infer<typeof historyDataSchema>;
