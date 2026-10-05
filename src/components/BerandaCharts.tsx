"use client";

import dynamic from "next/dynamic";

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
};

export function BerandaCharts({ trend7d, category }: Props) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <TrendChart data={trend7d} />
      <div className="capitalize">
        <CategoryDonut data={category} />
      </div>
    </div>
  );
}
