"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatRupiah } from "@/lib/format";
import { LeaderRow } from "@/components/LeaderRow";

type CategoryRow = { category: string; total: number };

const colorMap: Record<string, string> = {
  makanan: "var(--kategori-makanan)",
  minuman: "var(--kategori-minuman)",
  transportasi: "var(--kategori-transportasi)",
  belanja: "var(--kategori-belanja)",
  tagihan: "var(--kategori-tagihan)",
  kesehatan: "var(--kategori-kesehatan)",
  hiburan: "var(--kategori-hiburan)",
  lainnya: "var(--kategori-lainnya)",
};

function colorFor(cat: string): string {
  return colorMap[cat] ?? "var(--kategori-lainnya)";
}

export function CategoryDonut({ data }: { data: CategoryRow[] }) {
  if (data.length === 0) {
    return (
      <section className="rounded border border-garis bg-struk p-4">
        <h2 className="font-heading text-lg font-bold text-tinta">
          Pengeluaran per kategori
        </h2>
        <p className="mt-2 text-sm text-tinta-redup">Belum ada pengeluaran 7 hari terakhir.</p>
      </section>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <section className="rounded border border-garis bg-struk p-4">
      <h2 className="font-heading text-lg font-bold text-tinta">
        Pengeluaran per kategori
      </h2>

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={78}
              paddingAngle={2}
            >
              {data.map((e) => (
                <Cell key={e.category} fill={colorFor(e.category)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, props) =>
                [formatRupiah(Number(value)), (props.payload as CategoryRow).category]
              }
              contentStyle={{
                borderRadius: 8,
                borderColor: "var(--garis)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-xs text-tinta-redup">
        Total 7 hari: <span className="font-medium tabular-nums text-tinta">{formatRupiah(total)}</span>
      </p>

      <ul className="mt-4 space-y-2">
        {data.map((row) => (
          <li key={row.category} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: colorFor(row.category) }}
            />
            <div className="flex-1">
              <LeaderRow label={row.category} value={formatRupiah(row.total)} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
