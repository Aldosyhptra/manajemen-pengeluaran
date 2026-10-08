"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useActionState, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LeaderRow } from "@/components/LeaderRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PasswordSekaliDialog } from "@/components/PasswordSekaliDialog";
import { updateAnggotaAction, resetPasswordAction, setAktifAction, resetPersonaAction, type DetailResult } from "@/app/(app)/pengaturan/pengguna/[id]/actions";

type Anggota = {
  id: number | string;
  username: string;
  nama: string;
  panggilan: string;
  chat_id: string;
  aktif: boolean;
  wajib_ganti_password: boolean;
  punya_persona: boolean;
  persona: string | null;
  persona_diperbarui: string | null;
  dibuat: string;
};

const empty: DetailResult = {};

export function AnggotaDetailClient({ anggota }: { anggota: Anggota }) {
  const idStr = String(anggota.id);
  const [editMode, setEditMode] = useState(false);
  const [nama, setNama] = useState(anggota.nama);
  const [panggilan, setPanggilan] = useState(anggota.panggilan);

  const [updateState, updateAction, isUpdating] = useActionState(updateAnggotaAction, empty);
  const [resetPwState, resetPwAction, isResettingPw] = useActionState(resetPasswordAction, empty);
  const [aktifState, aktifAction, isTogglingAktif] = useActionState(setAktifAction, empty);
  const [personaState, personaAction, isResettingPersona] = useActionState(resetPersonaAction, empty);

  const [confirmType, setConfirmType] = useState<"edit" | "resetPw" | "toggleAktif" | "resetPersona" | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (resetPwState.tempPassword) {
      setTempPw(resetPwState.tempPassword);
      setShowPw(true);
      setConfirmType(null);
      setPendingConfirm(false);
    }
    if (resetPwState.error && pendingConfirm && confirmType === "resetPw") setPendingConfirm(false);
    if (updateState.ok && pendingConfirm && confirmType === "edit") { setPendingConfirm(false); setConfirmType(null); setEditMode(false); }
    if (updateState.error && pendingConfirm && confirmType === "edit") setPendingConfirm(false);
    if (aktifState.ok && pendingConfirm && confirmType === "toggleAktif") { setPendingConfirm(false); setConfirmType(null); }
    if (aktifState.error && pendingConfirm) setPendingConfirm(false);
    if (personaState.ok && pendingConfirm && confirmType === "resetPersona") { setPendingConfirm(false); setConfirmType(null); }
    if (personaState.error && pendingConfirm) setPendingConfirm(false);
  }, [resetPwState, updateState, aktifState, personaState, pendingConfirm, confirmType]);

  const changesEdit = [
    anggota.nama !== nama ? { label: "Nama", sebelum: anggota.nama, sesudah: nama } : null,
    anggota.panggilan !== panggilan ? { label: "Panggilan", sebelum: anggota.panggilan, sesudah: panggilan } : null,
  ].filter(Boolean) as { label: string; sebelum: string; sesudah: string }[];

  function onConfirm() {
    setPendingConfirm(true);
    if (confirmType === "edit") {
      const f = document.getElementById("edit-hidden-form") as HTMLFormElement | null;
      f?.requestSubmit();
    } else if (confirmType === "resetPw") {
      const f = document.getElementById("resetpw-hidden-form") as HTMLFormElement | null;
      f?.requestSubmit();
    } else if (confirmType === "toggleAktif") {
      const f = document.getElementById("aktif-hidden-form") as HTMLFormElement | null;
      f?.requestSubmit();
    } else if (confirmType === "resetPersona") {
      const f = document.getElementById("persona-hidden-form") as HTMLFormElement | null;
      f?.requestSubmit();
    }
  }

  const aktifLabel = anggota.aktif ? "Nonaktifkan" : "Aktifkan";
  const toggleAktifTo = !anggota.aktif;

  return (
    <div className="mt-4 space-y-6">
      <div className="rounded border border-garis bg-struk p-4 sm:p-5">
        <h1 className="font-heading text-xl font-bold text-tinta">{anggota.nama}</h1>
        <p className="text-sm text-tinta-redup">@{anggota.username}</p>

        <div className="mt-4 space-y-3">
          <LeaderRow label="Username" value={anggota.username} />
          <LeaderRow label="Chat ID" value={anggota.chat_id} />
          <LeaderRow label="Peran" value="anggota" />
          <LeaderRow label="Status" value={anggota.aktif ? "aktif" : "nonaktif"} />
          <LeaderRow label="Wajib ganti password" value={anggota.wajib_ganti_password ? "ya" : "tidak"} />
          <LeaderRow label="Persona" value={anggota.punya_persona ? "buatan" : "bawaan (sopan)"} />
          <LeaderRow label="Dibuat" value={new Date(anggota.dibuat).toLocaleDateString("id-ID")} />
        </div>

        {!editMode ? (
          <Button type="button" className="mt-4" onClick={() => setEditMode(true)}>Edit</Button>
        ) : (
          <div className="mt-4 rounded border border-garis bg-kertas p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-nama">Nama</Label>
                <Input id="edit-nama" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-panggilan">Panggilan</Label>
                <Input id="edit-panggilan" value={panggilan} onChange={(e) => setPanggilan(e.target.value)} maxLength={20} />
              </div>
            </div>
            {updateState.error && <p role="alert" className="mt-3 rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">{updateState.error}</p>}
            {updateState.fieldErrors?.nama && <p className="text-sm text-stempel">{updateState.fieldErrors.nama}</p>}
            {updateState.fieldErrors?.panggilan && <p className="text-sm text-stempel">{updateState.fieldErrors.panggilan}</p>}
            {updateState.ok && <p role="status" className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{updateState.ok}</p>}
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={() => setConfirmType("edit")} disabled={changesEdit.length === 0}>Simpan</Button>
              <Button type="button" variant="outline" onClick={() => { setEditMode(false); setNama(anggota.nama); setPanggilan(anggota.panggilan); }}>Batal</Button>
            </div>
            <form id="edit-hidden-form" action={updateAction} className="hidden" aria-hidden>
              <input type="hidden" name="id" value={idStr} />
              <input type="hidden" name="nama" value={nama} />
              <input type="hidden" name="panggilan" value={panggilan} />
            </form>
          </div>
        )}
      </div>

      <div className="rounded border border-garis bg-struk p-4 sm:p-5">
        <h2 className="font-heading text-base font-bold text-tinta">Tindakan</h2>
        <p className="mt-1 text-sm text-tinta-redup">Tindakan sensitif memerlukan konfirmasi.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmType("resetPw")} disabled={isResettingPw}>Reset password</Button>
          {resetPwState.error && <p className="text-sm text-stempel">{resetPwState.error}</p>}
          <Button type="button" variant={anggota.aktif ? "destructive" : "outline"} onClick={() => setConfirmType("toggleAktif")} disabled={isTogglingAktif}>{aktifLabel}</Button>
          {aktifState.error && <p className="text-sm text-stempel">{aktifState.error}</p>}
          {aktifState.ok && <p className="text-sm text-emerald-700">{aktifState.ok}</p>}
          <Button type="button" variant="outline" onClick={() => setConfirmType("resetPersona")} disabled={isResettingPersona || !anggota.punya_persona}>Kembalikan persona ke bawaan</Button>
          {personaState.error && <p className="text-sm text-stempel">{personaState.error}</p>}
          {personaState.ok && <p className="text-sm text-emerald-700">{personaState.ok}</p>}
        </div>

        <form id="resetpw-hidden-form" action={resetPwAction} className="hidden" aria-hidden>
          <input type="hidden" name="id" value={idStr} />
        </form>
        <form id="aktif-hidden-form" action={aktifAction} className="hidden" aria-hidden>
          <input type="hidden" name="id" value={idStr} />
          <input type="hidden" name="aktif" value={String(toggleAktifTo)} />
        </form>
        <form id="persona-hidden-form" action={personaAction} className="hidden" aria-hidden>
          <input type="hidden" name="id" value={idStr} />
        </form>
      </div>

      <ConfirmDialog
        open={confirmType === "edit"}
        title={`Simpan perubahan untuk ${anggota.nama}?`}
        changes={changesEdit}
        akibat={`${anggota.nama} akan tetap masuk di perangkatnya.`}
        confirmLabel="Ya, simpan perubahan"
        pending={isUpdating || pendingConfirm}
        onConfirm={onConfirm}
        onCancel={() => { setConfirmType(null); setPendingConfirm(false); }}
      />
      <ConfirmDialog
        open={confirmType === "resetPw"}
        title={`Reset password untuk ${anggota.nama}?`}
        changes={[{ label: "Password", sebelum: "\u2022\u2022\u2022\u2022\u2022\u2022", sesudah: "password sementara baru" }]}
        akibat={`${anggota.nama} akan keluar dari semua perangkat dan wajib ganti password saat login berikutnya.`}
        confirmLabel="Ya, reset password"
        pending={isResettingPw || pendingConfirm}
        onConfirm={onConfirm}
        onCancel={() => { setConfirmType(null); setPendingConfirm(false); }}
      />
      <ConfirmDialog
        open={confirmType === "toggleAktif"}
        title={anggota.aktif ? `Nonaktifkan ${anggota.nama}?` : `Aktifkan ${anggota.nama}?`}
        changes={[{ label: "Status", sebelum: anggota.aktif ? "aktif" : "nonaktif", sesudah: toggleAktifTo ? "aktif" : "nonaktif" }]}
        akibat={anggota.aktif ? `${anggota.nama} akan keluar dari semua perangkat.` : `${anggota.nama} dapat masuk kembali.`}
        confirmLabel={anggota.aktif ? "Ya, nonaktifkan" : "Ya, aktifkan"}
        pending={isTogglingAktif || pendingConfirm}
        onConfirm={onConfirm}
        onCancel={() => { setConfirmType(null); setPendingConfirm(false); }}
      />
      <ConfirmDialog
        open={confirmType === "resetPersona"}
        title={`Kembalikan persona ${anggota.nama} ke bawaan?`}
        changes={[{ label: "Persona", sebelum: "buatan", sesudah: "bawaan (sopan)" }]}
        akibat={`Gaya bicara ${anggota.nama} kembali ke bawaan (sopan).`}
        confirmLabel="Ya, kembalikan"
        pending={isResettingPersona || pendingConfirm}
        onConfirm={onConfirm}
        onCancel={() => { setConfirmType(null); setPendingConfirm(false); }}
      />

      <PasswordSekaliDialog open={showPw} password={tempPw ?? ""} onDone={() => { setShowPw(false); setTempPw(null); }} />
    </div>
  );
}
