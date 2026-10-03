import { formatRupiah, formatKkal } from "@/lib/format";

type Props = {
  spending: number;
  budgetTarget: number;
  calories: number;
  calorieTarget: number;
  dateLabel: string;
};

function Bar({
  value,
  target,
  color,
}: {
  value: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = value > target;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded bg-kertas">
      <div
        className="h-full rounded transition-all duration-[600ms] motion-reduce:transition-none"
        style={{
          width: `${pct}%`,
          background: over ? "var(--stempel)" : color,
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
      />
      {/* penanda target */}
      <span
        aria-hidden
        className="absolute top-0 h-full w-0.5 bg-tinta/30"
        style={{ left: "100%", transform: "translateX(-2px)" }}
      />
    </div>
  );
}

export function DailyNote({ spending, budgetTarget, calories, calorieTarget, dateLabel }: Props) {
  const overBudget = spending > budgetTarget;
  const overKalori = calories > calorieTarget;
  return (
    <section
      aria-label="Nota hari ini"
      className="relative overflow-hidden rounded-[4px] border border-garis bg-struk"
    >
      <div className="p-4 sm:p-5">
        <p className="text-sm font-medium text-tinta-redup">{dateLabel}</p>

        <div className="mt-3">
          <p className="text-sm text-tinta-redup">Pengeluaran hari ini</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="font-heading text-[40px] font-bold leading-none tabular-nums text-tinta">
              {formatRupiah(spending)}
            </p>
            <p className="shrink-0 text-sm tabular-nums text-tinta-redup">
              dari {formatRupiah(budgetTarget)}
            </p>
          </div>
          <div className="mt-2">
            <Bar
              value={spending}
              target={budgetTarget}
              color="var(--biru-nota)"
            />
          </div>
          {overBudget && (
            <span className="mt-2 inline-flex -rotate-2 rounded-full border-2 border-stempel px-2.5 py-0.5 text-xs font-bold tracking-wide text-stempel">
              Melebihi budget
            </span>
          )}
        </div>

        <div
          aria-hidden
          className="my-4 border-t-2 border-dotted border-garis"
        />

        <div>
          <p className="text-sm text-tinta-redup">Kalori hari ini</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="font-heading text-[40px] font-bold leading-none tabular-nums text-tinta">
              {formatKkal(calories)}
            </p>
            <p className="shrink-0 text-sm tabular-nums text-tinta-redup">
              dari {formatKkal(calorieTarget)}
            </p>
          </div>
          <div className="mt-2">
            <Bar
              value={calories}
              target={calorieTarget}
              color="var(--kuning-kalori)"
            />
          </div>
          {overKalori && (
            <span className="mt-2 inline-flex -rotate-2 rounded-full border-2 border-stempel px-2.5 py-0.5 text-xs font-bold tracking-wide text-stempel">
              Melebihi target
            </span>
          )}
        </div>
      </div>

      {/* tepi bergerigi */}
      <div
        aria-hidden
        className="h-3 w-full"
        style={{
          background:
            "radial-gradient(circle at 8px 0, transparent 8px, var(--struk) 8.5px) 0 0 / 16px 16px repeat-x",
          filter: "drop-shadow(0 1px 0 var(--garis))",
        }}
      />
    </section>
  );
}
