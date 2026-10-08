-- 0002_multiuser.sql
-- Akun pengguna, persona, riwayat chat, dan tabel pembatas pemakaian.
-- Aman dijalankan berulang (IF NOT EXISTS). Tidak mengubah atau menghapus data yang ada.
-- Pemilik menjalankannya MANUAL di Railway (DBeaver/psql). Di lokal dijalankan otomatis oleh Docker.
-- Agent boleh mengubah file ini hanya sebelum pemilik menjalankannya di production; setelahnya buat 0003.

-- Satu baris per orang. chat_id adalah pemilik data di tabel pengeluaran dan kalori.
CREATE TABLE IF NOT EXISTS pengguna (
  id                   bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username             text        NOT NULL CHECK (username ~ '^[a-z0-9._-]{3,30}$'),
  nama                 text        NOT NULL CHECK (length(btrim(nama)) BETWEEN 1 AND 60),
  panggilan            text        NOT NULL CHECK (panggilan ~ '^[[:alpha:]][[:alpha:] ]{0,19}$'),
  chat_id              text        NOT NULL CHECK (length(chat_id) BETWEEN 1 AND 64),
  peran                text        NOT NULL DEFAULT 'anggota' CHECK (peran IN ('admin', 'anggota')),
  aktif                boolean     NOT NULL DEFAULT true,
  password_hash        text        NOT NULL,
  wajib_ganti_password boolean     NOT NULL DEFAULT false,
  versi_sesi           integer     NOT NULL DEFAULT 1,   -- dinaikkan untuk mengeluarkan semua perangkat
  persona              text        CHECK (persona IS NULL OR length(persona) BETWEEN 40 AND 1500),
  persona_diperbarui   timestamptz,
  dibuat               timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pengguna_username ON pengguna (username);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pengguna_chat_id  ON pengguna (chat_id);
-- Hanya boleh ada SATU admin (pemilik proyek). Database menolak admin kedua.
CREATE UNIQUE INDEX IF NOT EXISTS ux_satu_admin ON pengguna ((peran)) WHERE peran = 'admin';

-- Riwayat chat halaman Catat (dibatasi 200 pesan terbaru per pengguna oleh aplikasi).
CREATE TABLE IF NOT EXISTS chat_pesan (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pengguna_id bigint      NOT NULL REFERENCES pengguna (id) ON DELETE CASCADE,
  peran       text        NOT NULL CHECK (peran IN ('user', 'bot')),
  teks        text        NOT NULL CHECK (length(teks) BETWEEN 1 AND 4000),
  waktu       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_chat_pesan_pengguna_waktu ON chat_pesan (pengguna_id, waktu DESC);

-- Pembatas pemakaian per jam (chat dan pembuatan persona). Terpisah dari chat_pesan
-- supaya "hapus percakapan" tidak mereset batas.
CREATE TABLE IF NOT EXISTS aktivitas (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pengguna_id bigint      NOT NULL REFERENCES pengguna (id) ON DELETE CASCADE,
  jenis       text        NOT NULL CHECK (jenis IN ('chat', 'persona')),
  waktu       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_aktivitas_pengguna_jenis_waktu ON aktivitas (pengguna_id, jenis, waktu DESC);

-- Percobaan login yang gagal (kunci: 'u:<username>' atau 'ip:<alamat>').
CREATE TABLE IF NOT EXISTS login_gagal (
  id    bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kunci text        NOT NULL CHECK (length(kunci) <= 100),
  waktu timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_login_gagal_kunci_waktu ON login_gagal (kunci, waktu DESC);

-- Hak akses role aplikasi (hanya jika role app_web sudah ada).
-- n8n_writer dan n8n_reader SENGAJA tidak diberi akses ke tabel-tabel ini.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_web') THEN
    GRANT SELECT, INSERT, UPDATE ON pengguna  TO app_web;
    GRANT SELECT, INSERT, DELETE ON chat_pesan TO app_web;
    GRANT SELECT, INSERT, DELETE ON aktivitas  TO app_web;
    GRANT SELECT, INSERT, DELETE ON login_gagal TO app_web;
  END IF;
END $$;
