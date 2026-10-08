import { pool } from "@/lib/db";

// Daftar/detail admin - tanpa password_hash
export async function listAnggota() {
  const r = await pool.query(
    `SELECT id, username, nama, panggilan, chat_id, aktif, wajib_ganti_password,
            persona IS NOT NULL AS punya_persona, persona_diperbarui, dibuat
     FROM pengguna WHERE peran = 'anggota' ORDER BY dibuat`,
    [],
  );
  return r.rows;
}

export async function getAnggotaById(id: number) {
  const r = await pool.query(
    `SELECT id, username, nama, panggilan, chat_id, aktif, wajib_ganti_password,
            persona IS NOT NULL AS punya_persona, persona, persona_diperbarui, dibuat
     FROM pengguna WHERE id = $1 AND peran = 'anggota'`,
    [id],
  );
  return r.rows[0] ?? null;
}

// Untuk getCurrentUser sudah di auth.ts, tapi untuk keperluan admin update
export async function updateAnggotaNamaPanggilan(id: number, nama: string, panggilan: string): Promise<number> {
  const r = await pool.query(
    "UPDATE pengguna SET nama = $2, panggilan = $3 WHERE id = $1 AND peran = 'anggota'",
    [id, nama, panggilan],
  );
  return r.rowCount ?? 0;
}

export async function resetPersonaAnggota(id: number): Promise<number> {
  const r = await pool.query(
    "UPDATE pengguna SET persona = NULL, persona_diperbarui = now() WHERE id = $1 AND peran = 'anggota'",
    [id],
  );
  return r.rowCount ?? 0;
}

export async function resetPasswordAnggota(id: number, newHash: string): Promise<number> {
  const r = await pool.query(
    "UPDATE pengguna SET password_hash = $2, wajib_ganti_password = true, versi_sesi = versi_sesi + 1 WHERE id = $1 AND peran = 'anggota'",
    [id, newHash],
  );
  return r.rowCount ?? 0;
}

export async function setAktifAnggota(id: number, aktif: boolean): Promise<number> {
  const r = await pool.query(
    "UPDATE pengguna SET aktif = $2, versi_sesi = versi_sesi + 1 WHERE id = $1 AND peran = 'anggota'",
    [id, aktif],
  );
  return r.rowCount ?? 0;
}

export async function createAnggota(username: string, nama: string, panggilan: string, hash: string) {
  const r = await pool.query(
    `INSERT INTO pengguna (username, nama, panggilan, chat_id, peran, password_hash, wajib_ganti_password)
     VALUES ($1, $2, $3, 'web-' || $1, 'anggota', $4, true) RETURNING id`,
    [username, nama, panggilan, hash],
  );
  return r.rows[0] as { id: string | number };
}

// Ganti password pengguna sendiri (butuh verifikasi password lama di caller)
export async function updatePasswordSendiri(id: number, newHash: string): Promise<number> {
  const r = await pool.query(
    "UPDATE pengguna SET password_hash = $2, wajib_ganti_password = false, versi_sesi = versi_sesi + 1 WHERE id = $1 RETURNING versi_sesi",
    [id, newHash],
  );
  if (r.rows.length === 0) return 0;
  return Number(r.rows[0].versi_sesi);
}

export async function updatePanggilanSendiri(id: number, panggilan: string): Promise<number> {
  const r = await pool.query("UPDATE pengguna SET panggilan = $2 WHERE id = $1", [id, panggilan]);
  return r.rowCount ?? 0;
}

// login_gagal & aktivitas dipakai di route api
export async function countLoginGagal(kunci: string, minutes = 15): Promise<number> {
  const r = await pool.query(
    "SELECT count(*)::int AS n FROM login_gagal WHERE kunci = $1 AND waktu > now() - ($2 || ' minutes')::interval",
    [kunci, String(minutes)],
  );
  return Number(r.rows[0]?.n ?? 0);
}

export async function insertLoginGagal(kunci: string) {
  await pool.query("INSERT INTO login_gagal (kunci) VALUES ($1)", [kunci]);
}

export async function clearLoginGagal(kunci: string) {
  await pool.query("DELETE FROM login_gagal WHERE kunci = $1", [kunci]);
}

export async function countAktivitasPersona1Jam(penggunaId: number): Promise<number> {
  const r = await pool.query(
    "SELECT count(*)::int AS n FROM aktivitas WHERE pengguna_id = $1 AND jenis = 'persona' AND waktu > now() - interval '1 hour'",
    [penggunaId],
  );
  return Number(r.rows[0]?.n ?? 0);
}

export async function insertAktivitasPersona(penggunaId: number): Promise<void> {
  await pool.query("INSERT INTO aktivitas (pengguna_id, jenis) VALUES ($1, 'persona')", [penggunaId]);
}

export async function cleanupLoginGagal() {
  await pool.query("DELETE FROM login_gagal WHERE waktu < now() - interval '1 day'");
}
