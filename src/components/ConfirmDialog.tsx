"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type Change = { label: string; sebelum: string; sesudah: string };

export function ConfirmDialog({
  open,
  title,
  changes,
  akibat,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  changes: Change[];
  akibat: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-lg border border-garis bg-struk p-5 shadow-lg"
      >
        <h2 id="confirm-title" className="font-heading text-lg font-bold text-tinta">{title}</h2>
        {changes.length > 0 && (
          <ul className="mt-4 space-y-2 rounded border border-garis bg-kertas p-3">
            {changes.map((c) => (
              <li key={c.label} className="text-sm">
                <span className="font-semibold text-tinta">{c.label}:</span>{" "}
                <span className="text-tinta-redup">{c.sebelum || "—"}</span>
                {" → "}
                <span className="font-medium text-tinta">{c.sesudah || "—"}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-tinta-redup">{akibat}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel} disabled={pending} autoFocus>
            Batal
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending}>
            {pending ? "Menyimpan…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
