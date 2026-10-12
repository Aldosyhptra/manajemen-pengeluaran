"use client";
import { useState } from "react";

export function PasangCard() {
  const [openA, setOpenA] = useState(false);
  const [openI, setOpenI] = useState(false);
  return (
    <section className="rounded border border-garis bg-struk p-4 sm:p-5" aria-labelledby="pasang-judul">
      <h2 id="pasang-judul" className="font-heading text-base font-bold text-tinta">Pasang di layar utama</h2>
      <p className="mt-1 text-sm text-tinta-redup">Buka aplikasi seperti aplikasi HP tanpa install dari toko.</p>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => setOpenA((v) => !v)}
          aria-expanded={openA}
          className="flex w-full items-center justify-between rounded-lg border border-garis bg-kertas px-4 py-3 text-left text-sm font-semibold text-tinta"
        >
          <span>Android (Chrome)</span>
          <span aria-hidden className="text-tinta-redup">{openA ? "−" : "+"}</span>
        </button>
        {openA && (
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-tinta">
            <li>Buka aplikasi di Chrome.</li>
            <li>Sentuh menu titik tiga di kanan atas.</li>
            <li>Pilih Tambahkan ke layar utama atau Instal aplikasi.</li>
            <li>Sentuh Tambahkan.</li>
          </ol>
        )}

        <button
          type="button"
          onClick={() => setOpenI((v) => !v)}
          aria-expanded={openI}
          className="flex w-full items-center justify-between rounded-lg border border-garis bg-kertas px-4 py-3 text-left text-sm font-semibold text-tinta"
        >
          <span>iPhone (Safari)</span>
          <span aria-hidden className="text-tinta-redup">{openI ? "−" : "+"}</span>
        </button>
        {openI && (
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-tinta">
            <li>Buka aplikasi di Safari.</li>
            <li>Sentuh tombol bagikan.</li>
            <li>Pilih Tambahkan ke Layar Utama.</li>
            <li>Sentuh Tambah.</li>
          </ol>
        )}
      </div>

      <p className="mt-3 text-xs text-tinta-redup">Nama menu bisa sedikit berbeda di HP Anda.</p>
      <p className="mt-1 text-xs text-tinta-redup">Catatan: aplikasi di layar utama bisa minta login lagi (cookie terpisah, terutama di iPhone).</p>
    </section>
  );
}
