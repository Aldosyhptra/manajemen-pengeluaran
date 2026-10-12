"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { pengeluaranEditSchema, kaloriEditSchema, idCatatanSchema } from "@/lib/schemas";
import {
  updatePengeluaran,
  updateKalori,
  deletePengeluaran,
  deleteKalori,
} from "@/lib/data/catatan";

export type CatatanActionResult = { ok?: string; error?: string; code?: string; fieldErrors?: Record<string, string> };

function mapZodErrors(err: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const m: Record<string, string> = {};
  for (const iss of err.issues) {
    const k = String(iss.path[0] ?? "form");
    if (!m[k]) m[k] = iss.message;
  }
  return m;
}

export async function updatePengeluaranAction(_prev: CatatanActionResult, formData: FormData): Promise<CatatanActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi tidak valid. Silakan masuk lagi.", code: "UNAUTHORIZED" };
  }
  const raw = {
    id: String(formData.get("id") ?? ""),
    kategori: String(formData.get("kategori") ?? ""),
    deskripsi: String(formData.get("deskripsi") ?? ""),
    nominal: String(formData.get("nominal") ?? "").replace(/\./g, "").replace(/,/g, "").trim(),
  };
  const parsed = pengeluaranEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Periksa kembali isian form.", fieldErrors: mapZodErrors(parsed.error), code: "VALIDATION_ERROR" };
  }
  try {
    const n = await updatePengeluaran(user.chatId, parsed.data.id, {
      kategori: parsed.data.kategori,
      deskripsi: parsed.data.deskripsi,
      nominal: parsed.data.nominal,
    });
    if (n === 0) return { error: "Catatan tidak ditemukan.", code: "TIDAK_DITEMUKAN" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("violates check") || msg.includes("invalid input syntax")) {
      return { error: "Data tidak valid.", code: "VALIDATION_ERROR" };
    }
    return { error: "Gagal menyimpan perubahan. Coba lagi.", code: "INTERNAL" };
  }
  revalidatePath("/");
  revalidatePath("/riwayat");
  return { ok: "Catatan diperbarui" };
}

export async function updateKaloriAction(_prev: CatatanActionResult, formData: FormData): Promise<CatatanActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi tidak valid. Silakan masuk lagi.", code: "UNAUTHORIZED" };
  }
  const raw = {
    id: String(formData.get("id") ?? ""),
    nama_makanan: String(formData.get("nama_makanan") ?? ""),
    estimasi_kalori: String(formData.get("estimasi_kalori") ?? "").trim(),
  };
  const parsed = kaloriEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Periksa kembali isian form.", fieldErrors: mapZodErrors(parsed.error), code: "VALIDATION_ERROR" };
  }
  try {
    const n = await updateKalori(user.chatId, parsed.data.id, {
      nama_makanan: parsed.data.nama_makanan,
      estimasi_kalori: parsed.data.estimasi_kalori,
    });
    if (n === 0) return { error: "Catatan tidak ditemukan.", code: "TIDAK_DITEMUKAN" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("violates check") || msg.includes("invalid input")) {
      return { error: "Data tidak valid.", code: "VALIDATION_ERROR" };
    }
    return { error: "Gagal menyimpan perubahan. Coba lagi.", code: "INTERNAL" };
  }
  revalidatePath("/");
  revalidatePath("/riwayat");
  return { ok: "Catatan diperbarui" };
}

export async function hapusPengeluaranAction(formData: FormData): Promise<CatatanActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi tidak valid.", code: "UNAUTHORIZED" };
  }
  const id = String(formData.get("id") ?? "");
  const parsed = idCatatanSchema.safeParse(id);
  if (!parsed.success) return { error: "ID tidak valid.", code: "VALIDATION_ERROR" };
  try {
    const n = await deletePengeluaran(user.chatId, parsed.data);
    if (n === 0) return { error: "Catatan tidak ditemukan.", code: "TIDAK_DITEMUKAN" };
  } catch {
    return { error: "Gagal menghapus. Coba lagi.", code: "INTERNAL" };
  }
  revalidatePath("/");
  revalidatePath("/riwayat");
  return { ok: "Catatan dihapus" };
}

export async function hapusKaloriAction(formData: FormData): Promise<CatatanActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi tidak valid.", code: "UNAUTHORIZED" };
  }
  const id = String(formData.get("id") ?? "");
  const parsed = idCatatanSchema.safeParse(id);
  if (!parsed.success) return { error: "ID tidak valid.", code: "VALIDATION_ERROR" };
  try {
    const n = await deleteKalori(user.chatId, parsed.data);
    if (n === 0) return { error: "Catatan tidak ditemukan.", code: "TIDAK_DITEMUKAN" };
  } catch {
    return { error: "Gagal menghapus. Coba lagi.", code: "INTERNAL" };
  }
  revalidatePath("/");
  revalidatePath("/riwayat");
  return { ok: "Catatan dihapus" };
}
