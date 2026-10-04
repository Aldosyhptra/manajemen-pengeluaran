import { getTargets } from "@/lib/data/queries";
import { PengaturanForm } from "@/components/PengaturanForm";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const SEED_CHAT_ID = "1000000001";
  const ownerId = process.env.OWNER_CHAT_ID || SEED_CHAT_ID;
  const targets = await getTargets(ownerId);

  // fallback lokal sama seperti Beranda: jika OWNER beda tapi data kosong, tetap tampil default
  // getTargets sudah return default 2000/150000 jika baris tidak ada, jadi langsung pakai

  return (
    <main>
      <h1 className="font-heading text-2xl font-bold text-tinta">Atur</h1>
      <p className="mt-2 text-sm text-tinta-redup">Atur target kalori harian dan budget.</p>
      <PengaturanForm initialCalorie={targets.calorieTarget} initialBudget={targets.budgetTarget} />
    </main>
  );
}
