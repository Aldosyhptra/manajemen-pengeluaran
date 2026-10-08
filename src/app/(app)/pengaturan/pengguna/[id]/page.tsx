import { requireAdmin } from "@/lib/auth";
import { getAnggotaById } from "@/lib/data/pengguna";
import { AnggotaDetailClient } from "@/components/AnggotaDetailClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnggotaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return (
      <main>
        <p className="text-sm text-tinta-redup">ID tidak valid.</p>
        <Link href="/pengaturan/pengguna" className="mt-4 inline-flex text-sm font-medium text-biru-nota hover:underline">Kembali</Link>
      </main>
    );
  }

  try {
    await requireAdmin();
  } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "FORBIDDEN") {
      return (
        <main>
          <h1 className="font-heading text-2xl font-bold text-tinta">403</h1>
          <p className="mt-2 text-sm text-tinta-redup">Akses ditolak. Hanya admin yang dapat membuka halaman ini.</p>
          <Link href="/pengaturan" className="mt-4 inline-flex text-sm font-medium text-biru-nota hover:underline">Kembali ke Atur</Link>
        </main>
      );
    }
    return (
      <main>
        <p className="text-sm text-tinta-redup">Sesi tidak valid. Silakan masuk lagi.</p>
        <Link href="/login" className="mt-4 inline-flex text-sm font-medium text-biru-nota hover:underline">Masuk</Link>
      </main>
    );
  }

  const anggota = await getAnggotaById(numericId);
  if (!anggota) {
    return (
      <main>
        <p className="text-sm text-tinta-redup">Anggota tidak ditemukan.</p>
        <Link href="/pengaturan/pengguna" className="mt-4 inline-flex text-sm font-medium text-biru-nota hover:underline">Kembali</Link>
      </main>
    );
  }

  return (
    <main>
      <Link href="/pengaturan/pengguna" className="text-sm font-medium text-biru-nota hover:underline">← Kembali ke daftar</Link>
      <AnggotaDetailClient anggota={anggota as unknown as Record<string, unknown> as never} />
    </main>
  );
}
