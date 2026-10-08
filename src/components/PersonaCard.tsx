"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DEFAULT_PERSONA } from "@/lib/persona";

type Props = {
  persona: string | null;
};

export function PersonaCard({ persona }: Props) {
  const router = useRouter();
  const isBawaan = persona === null;
  const [permintaan, setPermintaan] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  async function onGanti(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const v = permintaan.trim();
    if (!v) {
      setErr("Permintaan wajib diisi.");
      return;
    }
    if (v.length > 150) {
      setErr("Permintaan maksimal 150 karakter.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permintaan: v }),
      });
      const data = (await res.json().catch(() => null)) as {
        persona?: string;
        error?: { code?: string; message?: string };
      } | null;
      if (!res.ok) {
        setErr(data?.error?.message ?? "Gagal mengganti persona.");
        return;
      }
      setMsg("Persona tersimpan.");
      setShowInput(false);
      setPermintaan("");
      router.refresh();
    } catch {
      setErr("Tidak bisa menghubungi server.");
    } finally {
      setPending(false);
    }
  }

  async function onReset() {
    setResetPending(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/persona", { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) {
        setErr(data?.error?.message ?? "Gagal mengembalikan persona.");
        return;
      }
      setMsg("Persona dikembalikan ke bawaan.");
      setShowResetConfirm(false);
      router.refresh();
    } catch {
      setErr("Tidak bisa menghubungi server.");
    } finally {
      setResetPending(false);
    }
  }

  return (
    <div className="rounded border border-garis bg-struk p-4 sm:p-5">
      <h2 className="font-heading text-base font-bold text-tinta">Persona</h2>
      <p className="mt-1 text-sm text-tinta-redup">
        Gaya bicara asisten. Bawaan: sopan dan ramah. Tulis permintaan singkat untuk mengubahnya.
      </p>

      <div className="mt-3 rounded border border-garis bg-kertas p-3">
        {isBawaan ? (
          <>
            <p className="text-sm font-medium text-tinta">Bawaan: sopan</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-tinta-redup">{DEFAULT_PERSONA}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-tinta">Persona aktif</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-tinta">{persona}</p>
          </>
        )}
      </div>

      {!showInput ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowInput(true)} className="min-h-11">
            Ganti persona
          </Button>
          {!isBawaan && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              className="min-h-11"
            >
              Kembali ke bawaan
            </Button>
          )}
        </div>
      ) : (
        <form onSubmit={onGanti} className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="permintaan-persona" className="text-tinta">
              Permintaan persona
            </Label>
            <Input
              id="permintaan-persona"
              value={permintaan}
              onChange={(e) => setPermintaan(e.target.value)}
              placeholder='mis. "santai dan lucu" atau "sopan"'
              maxLength={150}
              required
              aria-describedby="permintaan-hint"
            />
            <p id="permintaan-hint" className="text-xs text-tinta-redup">
              1–150 karakter. Contoh: santai dan lucu, sopan, tegas singkat.
            </p>
            <p className="text-xs text-tinta-redup">{permintaan.length}/150</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="min-h-11">
              {pending ? "Menyimpan…" : "Simpan persona"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowInput(false);
                setErr(null);
              }}
              disabled={pending}
              className="min-h-11"
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {err && (
        <p role="alert" className="mt-3 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">
          {err}
        </p>
      )}
      {msg && (
        <p role="status" className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {msg}
        </p>
      )}

      <ConfirmDialog
        open={showResetConfirm}
        title="Kembalikan persona ke bawaan?"
        changes={[{ label: "Persona", sebelum: "buatan", sesudah: "bawaan: sopan" }]}
        akibat="Gaya bicara kembali ke bawaan di semua perangkat."
        confirmLabel="Ya, kembalikan ke bawaan"
        pending={resetPending}
        onConfirm={onReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
