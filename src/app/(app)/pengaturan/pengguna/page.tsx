import { requireAdmin } from "@/lib/auth";
import { listAnggota } from "@/lib/data/pengguna";
import { TambahPenggunaClient } from "@/components/TambahPenggunaClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function KelolaPenggunaPage() {
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

  const anggota = await listAnggota();

  return (
    <main>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tinta">Kelola pengguna</h1>
          <p className="mt-1 text-sm text-tinta-redup">Daftar anggota keluarga. Hanya admin yang dapat mengelola.</p>
        </div>
        <Link href="/pengaturan" className="hidden text-sm font-medium text-tinta-redup hover:text-tinta sm:inline">Kembali</Link>
      </div>

      <div className="mt-6">
        <TambahPenggunaClient />
      </div>

      {anggota.length === 0 ? (
        <p className="mt-6 rounded border border-dashed border-garis bg-struk p-6 text-sm text-tinta-redup">Belum ada anggota.</p>
      ) : (
        <ul className="mt-6 divide-y divide-garis rounded border border-garis bg-struk">
          {anggota.map((a) => {
            const id = String((a as { id: string | number }).id);
            const nama = (a as { nama: string }).nama;
            const username = (a as { username: string }).username;
            const aktif = (a as { aktif: boolean }).aktif;
            return (
              <li key={id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-tinta">{nama}</p>
                  <p className="text-sm text-tinta-redup">@{username} · {aktif ? "aktif" : "nonaktif"}</p>
                </div>
                <Link href={`/pengaturan/pengguna/${id}`} className="min-h-11 inline-flex items-center rounded-lg border border-garis bg-white px-4 text-sm font-medium text-tinta hover:bg-kertas">
                  Detail
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
