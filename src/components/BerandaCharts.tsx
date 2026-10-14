"use client";

import dynamic from "next/dynamic";
import { formatRupiah } from "@/lib/format";

const TrendChart = dynamic(() => import("./TrendChart").then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded border border-garis bg-struk" aria-label="Memuat grafik tren" />,
});
const CategoryDonut = dynamic(() => import("./CategoryDonut").then((m) => m.CategoryDonut), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded border border-garis bg-struk" aria-label="Memuat kategori" />,
});

type Props = {
  trend7d: { date: string; calories: number; spending: number }[];
  category: { category: string; total: number }[];
  terlaris7d: { nama: string; jumlah: number; total: number }[];
};

export function BerandaCharts({ trend7d, category, terlaris7d }: Props) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <TrendChart data={trend7d} />
        {terlaris7d.length > 0 && (
          <section className="rounded border border-garis bg-struk p-4">
            <h2 className="font-heading text-base font-bold text-tinta">Sering dibeli 7 hari ini</h2>
            <ul className="mt-3 space-y-2">
              {terlaris7d.map((item, i) => (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 capitalize text-tinta">{item.nama}</span>
                  <span
                    aria-hidden
                    className="min-w-4 flex-1 border-b-2 border-dotted border-garis mb-1"
                  />
                  <span className="shrink-0 tabular-nums text-tinta-redup">
                    {item.jumlah}x {formatRupiah(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="capitalize">
        <CategoryDonut data={category} />
      </div>
    </div>
  );
}
