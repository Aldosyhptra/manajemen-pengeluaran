import { cn } from "@/lib/utils";

type LeaderRowProps = {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
};

export function LeaderRow({ label, value, className, valueClassName }: LeaderRowProps) {
  return (
    <div className={cn("flex items-baseline gap-2 text-sm", className)}>
      <span className="shrink-0 text-tinta">{label}</span>
      <span
        aria-hidden
        className="min-w-4 flex-1 border-b-2 border-dotted border-garis self-end mb-1"
      />
      <span
        className={cn(
          "shrink-0 text-right font-medium tabular-nums text-tinta",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}
