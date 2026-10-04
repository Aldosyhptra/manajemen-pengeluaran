"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { simpanPengaturan, type PengaturanState } from "@/app/(app)/pengaturan/actions";

type Props = {
  initialCalorie: number;
  initialBudget: number;
};

const initialState: PengaturanState = {};

function formatThousand(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export function PengaturanForm({ initialCalorie, initialBudget }: Props) {
  const [state, formAction, isPending] = useActionState(simpanPengaturan, initialState);
  const [calorieDisplay, setCalorieDisplay] = useState(() => formatThousand(String(initialCalorie)));
  const [budgetDisplay, setBudgetDisplay] = useState(() => formatThousand(String(initialBudget)));

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="rounded border border-garis bg-struk p-4 sm:p-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calorieTarget" className="text-tinta">
              Target kalori harian
            </Label>
            <Input
              id="calorieTarget"
              name="calorieTarget"
              type="text"
              inputMode="numeric"
              value={calorieDisplay}
              onChange={(e) => setCalorieDisplay(formatThousand(e.target.value))}
              placeholder="2.000"
              aria-invalid={!!state.fieldErrors?.calorieTarget}
              aria-describedby={state.fieldErrors?.calorieTarget ? "err-calorie" : undefined}
              className="tabular-nums"
              required
            />
            <p className="text-xs text-tinta-redup">500 – 10.000 kkal</p>
            {state.fieldErrors?.calorieTarget && (
              <p id="err-calorie" className="text-sm text-stempel">
                {state.fieldErrors.calorieTarget}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetTarget" className="text-tinta">
              Budget harian
            </Label>
            <Input
              id="budgetTarget"
              name="budgetTarget"
              type="text"
              inputMode="numeric"
              value={budgetDisplay}
              onChange={(e) => setBudgetDisplay(formatThousand(e.target.value))}
              placeholder="150.000"
              aria-invalid={!!state.fieldErrors?.budgetTarget}
              aria-describedby={state.fieldErrors?.budgetTarget ? "err-budget" : undefined}
              className="tabular-nums"
              required
            />
            <p className="text-xs text-tinta-redup">1 – 50.000.000 (rupiah)</p>
            {state.fieldErrors?.budgetTarget && (
              <p id="err-budget" className="text-sm text-stempel">
                {state.fieldErrors.budgetTarget}
              </p>
            )}
          </div>
        </div>

        {state.error && (
          <p role="alert" className="mt-4 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p role="status" className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.ok}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-4 w-full sm:w-auto">
          {isPending ? "Menyimpan…" : "Simpan target"}
        </Button>
      </div>
    </form>
  );
}
