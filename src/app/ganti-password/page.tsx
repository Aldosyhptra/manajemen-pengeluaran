import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GantiPasswordForm } from "@/components/GantiPasswordForm";

export const dynamic = "force-dynamic";

export default async function GantiPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/ganti-password");
  // boleh dibuka kapan saja, tapi kalau wajib_ganti_password layout sudah paksa ke sini; di sini tetap tampilkan form
  return (
    <div className="flex h-full flex-1 items-center justify-center px-4 py-8">
      <main className="w-full max-w-sm -mt-8">
        <h1 className="font-heading text-2xl font-bold text-tinta">Ganti password</h1>
        <p className="mt-2 text-sm text-tinta-redup">
          {user.wajibGantiPassword
            ? "Password sementara harus diganti sebelum lanjut."
            : "Ganti password kamu. Minimal 10 karakter."}
        </p>
        <GantiPasswordForm wajib={user.wajibGantiPassword} />
      </main>
    </div>
  );
}
