"use client";

import { useState, useTransition } from "react";
import { ubahUkuranHuruf } from "@/app/(app)/pengaturan/actions";

type Props = { initial: "normal" | "besar" | "sangat_besar" };

const OPTIONS: { value: Props["initial"]; label: string; aaSize: string }[] = [
  { value: "normal", label: "Normal", aaSize: "text-xl" },
  { value: "besar", label: "Besar", aaSize: "text-2xl" },
  { value: "sangat_besar", label: "Sangat besar", aaSize: "text-3xl" },
];

export function UkuranHurufForm({ initial }: Props) {
  const [val, setVal] = useState<Props["initial"]>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onPick(next: Props["initial"]) {
    setVal(next);
    setMsg(null);
    start(async () => {
      // optimistic apply tanpa kedipan
      document.documentElement.setAttribute("data-ukuran", next);
      const fd = new FormData();
      fd.set("ukuran", next);
      const res = await ubahUkuranHuruf({} as never, fd);
      if (res.error) {
        setMsg(res.error);
        document.documentElement.setAttribute("data-ukuran", val);
      } else if (res.ok) {
        setMsg(res.ok);
      }
    });
  }

  return (
    <section className="rounded border border-garis bg-struk p-4 sm:p-5" aria-labelledby="ukuran-title">
      <h2 id="ukuran-title" className="font-heading text-base font-bold text-tinta">Ukuran huruf</h2>
      <p className="mt-1 text-sm text-tinta-redup">Pilih ukuran yang nyaman dibaca. Berlaku untuk akun ini.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {OPTIONS.map((o) => {
          const active = val === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(o.value)}
              disabled={pending}
              className={
                active
                  ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border-2 border-biru-nota bg-biru-nota/10 px-2 py-3 text-tinta"
                  : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border border-garis bg-kertas px-2 py-3 text-tinta hover:bg-kertas/80"
              }
              style={{ minHeight: "56px" }}
            >
              <span className={`${o.aaSize} font-bold leading-none`} aria-hidden>
                Aa
              </span>
              <span className="text-xs font-medium">{o.label}</span>
            </button>
          );
        })}
      </div>
      {pending && <p className="mt-3 text-sm text-tinta-redup">Menyimpan…</p>}
      {msg && <p role="status" className="mt-3 text-sm text-tinta-redup">{msg}</p>}
    </section>
  );
}
