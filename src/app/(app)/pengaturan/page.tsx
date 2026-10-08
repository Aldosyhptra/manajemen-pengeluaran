import { redirect } from "next/navigation";
import Link from "next/link";
import { getTargets } from "@/lib/data/queries";
import { PengaturanForm } from "@/components/PengaturanForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pengaturan");
  if (user.wajibGantiPassword) redirect("/ganti-password");
  const targets = await getTargets(user.chatId);

  return (
    <main>
      <h1 className="font-heading text-2xl font-bold text-tinta">Atur</h1>
      <p className="mt-2 text-sm text-tinta-redup">Atur target, panggilan, dan password.</p>
      {user.peran === "admin" && (
        <Link
          href="/pengaturan/pengguna"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-garis bg-struk px-4 text-sm font-semibold text-tinta hover:bg-kertas"
        >
          Kelola pengguna
        </Link>
      )}
      <PengaturanForm initialCalorie={targets.calorieTarget} initialBudget={targets.budgetTarget} panggilan={user.panggilan} />
    </main>
  );
}
