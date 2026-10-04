"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { pengaturanInputSchema } from "@/lib/schemas";
import { upsertPengaturan } from "@/lib/data/queries";

export type PengaturanState = {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function resolveChatId(): string {
  const SEED = "1000000001";
  return process.env.OWNER_CHAT_ID || SEED;
}

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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !(await verifySession(token))) {
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
    // pesan ramah Bahasa Indonesia untuk field umum
    if (fieldErrors.calorieTarget?.includes("expected number")) {
      fieldErrors.calorieTarget = "Target kalori harus angka 500–10000";
    }
    if (fieldErrors.budgetTarget?.includes("expected number")) {
      fieldErrors.budgetTarget = "Budget harus angka 1–50.000.000";
    }
    return { error: "Periksa kembali isian form.", fieldErrors };
  }

  const chatId = resolveChatId();
  try {
    await upsertPengaturan(chatId, parsed.data.calorieTarget, parsed.data.budgetTarget);
  } catch {
    return { error: "Tidak bisa menyimpan target. Periksa koneksi, lalu coba lagi." };
  }

  revalidatePath("/pengaturan");
  revalidatePath("/");
  return { ok: "Target tersimpan" };
}
