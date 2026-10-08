"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAnggotaSchema } from "@/lib/schemas";
import { createAnggota } from "@/lib/data/pengguna";
import { hashPassword } from "@/lib/auth";
import { generatePasswordSementara } from "@/lib/password-temp";
export type CreateAnggotaResult = { ok?: string; tempPassword?: string; error?: string; fieldErrors?: Record<string, string>; };
export async function createAnggotaAction(_prev: CreateAnggotaResult, formData: FormData): Promise<CreateAnggotaResult> {
  try { await requireAdmin(); } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "FORBIDDEN") return { error: "Akses ditolak." };
    return { error: "Sesi tidak valid. Silakan masuk lagi." };
  }
  const raw = { username: String(formData.get("username") ?? ""), nama: String(formData.get("nama") ?? ""), panggilan: String(formData.get("panggilan") ?? "") };
  const parsed = createAnggotaSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) { const k = String(issue.path[0] ?? "form"); if (!fieldErrors[k]) fieldErrors[k] = issue.message; }
    return { error: "Periksa kembali isian form.", fieldErrors };
  }
  const temp = generatePasswordSementara(12);
  let hash: string;
  try { hash = hashPassword(temp); } catch (err) { return { error: (err as Error).message }; }
  try { await createAnggota(parsed.data.username, parsed.data.nama, parsed.data.panggilan, hash); } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate") || msg.includes("pengguna_username_key") || msg.includes("23505")) return { error: "Username sudah dipakai." };
    return { error: "Gagal membuat pengguna. Coba lagi." };
  }
  revalidatePath("/pengaturan/pengguna");
  return { ok: "Pengguna dibuat.", tempPassword: temp };
}
