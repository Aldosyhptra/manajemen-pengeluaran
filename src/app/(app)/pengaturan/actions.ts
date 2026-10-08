"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { pengaturanInputSchema } from "@/lib/schemas";
import { upsertPengaturan } from "@/lib/data/queries";

export type PengaturanState = {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function cleanNumber(v: FormDataEntryValue | null): string {
  return String(v ?? "")
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();
}

export async function simpanPengaturan(
  _prev: PengaturanState,
  formData: FormData
): Promise<PengaturanState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi tidak valid. Silakan masuk lagi." };
  }
  const raw = {
    calorieTarget: cleanNumber(formData.get("calorieTarget")),
    budgetTarget: cleanNumber(formData.get("budgetTarget")),
  };

  const parsed = pengaturanInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    if (fieldErrors.calorieTarget?.includes("expected number")) {
      fieldErrors.calorieTarget = "Target kalori harus angka 500–10000";
    }
    if (fieldErrors.budgetTarget?.includes("expected number")) {
      fieldErrors.budgetTarget = "Budget harus angka 1–50.000.000";
    }
    return { error: "Periksa kembali isian form.", fieldErrors };
  }

  try {
    await upsertPengaturan(user.chatId, parsed.data.calorieTarget, parsed.data.budgetTarget);
  } catch {
    return { error: "Tidak bisa menyimpan target. Periksa koneksi, lalu coba lagi." };
  }

  revalidatePath("/pengaturan");
  revalidatePath("/");
  return { ok: "Target tersimpan" };
}
