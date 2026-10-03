"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah, formatKkal } from "@/lib/format";

type TrendPoint = { date: string; calories: number; spending: number };

function formatTanggalLabel(isoDate: string): string {
  // isoDate YYYY-MM-DD
  const d = new Date(isoDate + "T12:00:00+07:00");
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [mode, setMode] = useState<"spending" | "calories">("spending");
  const isSpending = mode === "spending";
  const color = isSpending ? "var(--biru-nota)" : "var(--kuning-kalori)";

  const chartData = data.map((d) => ({
    ...d,
    label: formatTanggalLabel(d.date),
    value: isSpending ? d.spending : d.calories,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const sumLabel = isSpending ? formatRupiah(total) : formatKkal(total);

  return (
    <section className="rounded border border-garis bg-struk p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-tinta">
            Tujuh hari terakhir
          </h2>
          <p className="text-xs text-tinta-redup">
            Total {isSpending ? "pengeluaran" : "kalori"} 7 hari:{" "}
            <span className="font-medium tabular-nums text-tinta">{sumLabel}</span>
          </p>
        </div>
        <div
          role="group"
          aria-label="Pilih data"
          className="inline-flex rounded-lg border border-garis bg-kertas p-1"
        >
          <button
            type="button"
            aria-pressed={isSpending}
            onClick={() => setMode("spending")}
            className={
              isSpending
                ? "rounded-md bg-biru-nota px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-md px-3 py-1.5 text-xs font-medium text-tinta-redup hover:text-tinta"
            }
          >
            Pengeluaran
          </button>
          <button
            type="button"
            aria-pressed={!isSpending}
            onClick={() => setMode("calories")}
            className={
              !isSpending
                ? "rounded-md bg-kuning-kalori px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-md px-3 py-1.5 text-xs font-medium text-tinta-redup hover:text-tinta"
            }
          >
            Kalori
          </button>
        </div>
      </div>

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--garis)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--tinta-redup)" }}
              axisLine={{ stroke: "var(--garis)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--tinta-redup)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (isSpending ? `${Math.round(v / 1000)}rb` : `${v}`)}
              width={48}
            />
            <Tooltip
              formatter={(value) =>
                isSpending ? formatRupiah(Number(value)) : formatKkal(Number(value))
              }
              labelFormatter={(label) => String(label)}
              contentStyle={{
                borderRadius: 8,
                borderColor: "var(--garis)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, stroke: color, fill: "var(--struk)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* alternatif teks untuk pembaca layar */}
      <table className="sr-only">
        <caption>Tren 7 hari {isSpending ? "pengeluaran" : "kalori"}</caption>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nilai</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.date}>
              <td>{d.label}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
