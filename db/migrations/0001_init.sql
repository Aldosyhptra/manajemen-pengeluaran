-- 0001_init.sql
-- Skema awal. Pemilik proyek menjalankannya MANUAL di Railway (psql atau klien SQL).
-- Di lokal dijalankan otomatis oleh Docker (lihat docker-compose.yml).
-- Agent boleh menulis migrasi baru sebagai file di folder ini,
-- tetapi hanya boleh menjalankannya di database LOKAL.

BEGIN;

-- Catatan pengeluaran. id dan tanggal SELALU diisi database, bukan AI.
CREATE TABLE pengeluaran (
  id        bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id   text        NOT NULL,
  tanggal   timestamptz NOT NULL DEFAULT now(),
  kategori  text        NOT NULL
            CHECK (kategori IN ('makanan','minuman','transportasi','belanja','tagihan','kesehatan','hiburan','lainnya')),
  deskripsi text        NOT NULL CHECK (length(btrim(deskripsi)) > 0),
  nominal   integer     NOT NULL CHECK (nominal BETWEEN 1 AND 50000000)  -- rupiah utuh
);

-- Catatan kalori. estimasi_kalori adalah PERKIRAAN dari AI.
CREATE TABLE kalori (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id         text        NOT NULL,
  tanggal         timestamptz NOT NULL DEFAULT now(),
  nama_makanan    text        NOT NULL CHECK (length(btrim(nama_makanan)) > 0),
  estimasi_kalori integer     NOT NULL CHECK (estimasi_kalori BETWEEN 0 AND 5000)
);

-- Target harian (satu baris per pengguna). Jika baris tidak ada, aplikasi memakai nilai default.
CREATE TABLE pengaturan (
  chat_id       text        PRIMARY KEY,
  target_kalori integer     NOT NULL DEFAULT 2000   CHECK (target_kalori BETWEEN 500 AND 10000),
  budget_harian integer     NOT NULL DEFAULT 150000 CHECK (budget_harian BETWEEN 1 AND 50000000),
  diperbarui    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pengeluaran_chat_tanggal ON pengeluaran (chat_id, tanggal DESC);
CREATE INDEX idx_kalori_chat_tanggal      ON kalori (chat_id, tanggal DESC);

COMMIT;
