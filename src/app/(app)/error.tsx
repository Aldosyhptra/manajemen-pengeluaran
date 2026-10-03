"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="py-8">
      <h1 className="font-heading text-xl font-bold text-tinta">Tidak bisa mengambil data</h1>
      <p className="mt-2 text-sm text-tinta-redup">
        Periksa koneksi, lalu coba lagi.
      </p>
      {error.message && (
        <p className="mt-2 text-xs text-tinta-redup">{error.message}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-biru-nota px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 min-h-11"
      >
        Coba lagi
      </button>
    </main>
  );
}
