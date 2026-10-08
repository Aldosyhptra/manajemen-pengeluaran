"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useActionState, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PasswordSekaliDialog } from "@/components/PasswordSekaliDialog";
import { createAnggotaAction, type CreateAnggotaResult } from "@/app/(app)/pengaturan/pengguna/actions";

const initial: CreateAnggotaResult = {};

export function TambahPenggunaClient() {
  const [state, formAction, isPending] = useActionState(createAnggotaAction, initial);
  const [openForm, setOpenForm] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // capture temp password when action returns
  useEffect(() => {
    if (state.tempPassword) {
      setTempPw(state.tempPassword);
      setShowPw(true);
      setShowConfirm(false);
      setPendingConfirm(false);
    }
    if (state.error && pendingConfirm) setPendingConfirm(false);
  }, [state, pendingConfirm]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFormData(fd);
    setShowConfirm(true);
  }

  function onConfirm() {
    if (!formData) return;
    setPendingConfirm(true);
    // submit via hidden form to trigger server action
    const f = document.getElementById("tambah-hidden-form") as HTMLFormElement | null;
    f?.requestSubmit();
  }

  const username = formData ? String(formData.get("username") ?? "") : "";
  const nama = formData ? String(formData.get("nama") ?? "") : "";
  const panggilan = formData ? String(formData.get("panggilan") ?? "") : "";

  return (
    <div>
      {!openForm ? (
        <Button type="button" onClick={() => setOpenForm(true)}>Tambah pengguna</Button>
      ) : (
        <>
          <form onSubmit={onSubmit} className="rounded border border-garis bg-struk p-4 sm:p-5">
            <h2 className="font-heading text-base font-bold text-tinta">Tambah pengguna</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="budi" required maxLength={30} />
                <p className="text-xs text-tinta-redup">3–30, a-z 0-9 . _ -</p>
                {state.fieldErrors?.username && <p className="text-sm text-stempel">{state.fieldErrors.username}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="nama">Nama</Label>
                <Input id="nama" name="nama" placeholder="Budi" required maxLength={100} />
                {state.fieldErrors?.nama && <p className="text-sm text-stempel">{state.fieldErrors.nama}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="panggilan">Panggilan</Label>
                <Input id="panggilan" name="panggilan" placeholder="Budi" required maxLength={20} />
                <p className="text-xs text-tinta-redup">Huruf dan spasi, diawali huruf</p>
                {state.fieldErrors?.panggilan && <p className="text-sm text-stempel">{state.fieldErrors.panggilan}</p>}
              </div>
            </div>
            {state.error && !state.fieldErrors && <p role="alert" className="mt-3 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{state.error}</p>}
            <div className="mt-4 flex gap-2">
              <Button type="submit">Lanjut ke konfirmasi</Button>
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>Batal</Button>
            </div>
          </form>
          <form id="tambah-hidden-form" action={formAction} className="hidden" aria-hidden>
            <input type="hidden" name="username" value={username} />
            <input type="hidden" name="nama" value={nama} />
            <input type="hidden" name="panggilan" value={panggilan} />
          </form>
        </>
      )}

      <ConfirmDialog
        open={showConfirm}
        title={`Tambah pengguna ${username || "baru"}?`}
        changes={[
          { label: "Username", sebelum: "—", sesudah: username },
          { label: "Nama", sebelum: "—", sesudah: nama },
          { label: "Panggilan", sebelum: "—", sesudah: panggilan },
          { label: "Chat ID", sebelum: "—", sesudah: username ? `web-${username}` : "—" },
          { label: "Peran", sebelum: "—", sesudah: "anggota" },
        ]}
        akibat="Password sementara akan dibuat dan wajib diganti saat login pertama."
        confirmLabel="Ya, tambah pengguna"
        pending={isPending || pendingConfirm}
        onConfirm={onConfirm}
        onCancel={() => { setShowConfirm(false); setPendingConfirm(false); }}
      />

      <PasswordSekaliDialog open={showPw} password={tempPw ?? ""} onDone={() => { setShowPw(false); setTempPw(null); setOpenForm(false); }} />
    </div>
  );
}
