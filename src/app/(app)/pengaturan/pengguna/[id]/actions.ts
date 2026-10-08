"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateAnggotaSchema } from "@/lib/schemas";
import { updateAnggotaNamaPanggilan, resetPasswordAnggota, setAktifAnggota, resetPersonaAnggota } from "@/lib/data/pengguna";
import { hashPassword } from "@/lib/auth";
import { generatePasswordSementara } from "@/lib/password-temp";

export type DetailResult = { ok?: string; error?: string; fieldErrors?: Record<string, string>; tempPassword?: string; };

async function ensureAdmin() {
  try { await requireAdmin(); return null; } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "FORBIDDEN") return { error: "Akses ditolak." } as DetailResult;
    return { error: "Sesi tidak valid. Silakan masuk lagi." } as DetailResult;
  }
}

export async function updateAnggotaAction(_prev: DetailResult, formData: FormData): Promise<DetailResult> {
  const authErr = await ensureAdmin();
  if (authErr) return authErr;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "ID tidak valid." };
  const raw = { nama: String(formData.get("nama") ?? ""), panggilan: String(formData.get("panggilan") ?? "") };
  const parsed = updateAnggotaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const iss of parsed.error.issues) { const k = String(iss.path[0] ?? "form"); if (!fieldErrors[k]) fieldErrors[k] = iss.message; }
    return { error: "Periksa kembali isian form.", fieldErrors };
  }
  const n = await updateAnggotaNamaPanggilan(id, parsed.data.nama, parsed.data.panggilan);
  if (n === 0) return { error: "Gagal menyimpan. Pastikan anggota masih ada." };
  revalidatePath(`/pengaturan/pengguna/${id}`);
  revalidatePath("/pengaturan/pengguna");
  return { ok: "Perubahan tersimpan." };
}

export async function resetPasswordAction(_prev: DetailResult, formData: FormData): Promise<DetailResult> {
  const authErr = await ensureAdmin();
  if (authErr) return authErr;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "ID tidak valid." };
  const temp = generatePasswordSementara(12);
  const hash = hashPassword(temp);
  const n = await resetPasswordAnggota(id, hash);
  if (n === 0) return { error: "Gagal mereset password. Pastikan anggota masih ada." };
  revalidatePath(`/pengaturan/pengguna/${id}`);
  return { ok: "Password direset.", tempPassword: temp };
}

export async function setAktifAction(_prev: DetailResult, formData: FormData): Promise<DetailResult> {
  const authErr = await ensureAdmin();
  if (authErr) return authErr;
  const id = Number(formData.get("id"));
  const aktif = String(formData.get("aktif")) === "true";
  if (!Number.isFinite(id)) return { error: "ID tidak valid." };
  const n = await setAktifAnggota(id, aktif);
  if (n === 0) return { error: "Gagal mengubah status." };
  revalidatePath(`/pengaturan/pengguna/${id}`);
  revalidatePath("/pengaturan/pengguna");
  return { ok: aktif ? "Akun diaktifkan." : "Akun dinonaktifkan." };
}

export async function resetPersonaAction(_prev: DetailResult, formData: FormData): Promise<DetailResult> {
  const authErr = await ensureAdmin();
  if (authErr) return authErr;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "ID tidak valid." };
  const n = await resetPersonaAnggota(id);
  if (n === 0) return { error: "Gagal mengembalikan persona." };
  revalidatePath(`/pengaturan/pengguna/${id}`);
  return { ok: "Persona dikembalikan ke bawaan." };
}
