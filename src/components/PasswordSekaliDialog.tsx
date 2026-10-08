"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PasswordSekaliDialog({
  open,
  password,
  onDone,
}: {
  open: boolean;
  password: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="pw-title" className="w-full max-w-md rounded-lg border border-garis bg-struk p-5 shadow-lg">
        <h2 id="pw-title" className="font-heading text-lg font-bold text-tinta">Password sementara</h2>
        <p className="mt-3 font-mono text-lg font-bold tracking-widest text-tinta tabular-nums">{password}</p>
        <p className="mt-2 text-sm text-stempel">Password ini tidak akan ditampilkan lagi. Berikan langsung ke orangnya.</p>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
            }}
          >
            {copied ? "Tersalin" : "Salin"}
          </Button>
          <Button type="button" onClick={onDone}>Sudah saya salin</Button>
        </div>
      </div>
    </div>
  );
}
