-- 0003_edit_hapus_dan_tampilan.sql
-- (1) Ukuran huruf per akun, (2) arsip catatan yang dihapus, (3) hak ubah/hapus terbatas untuk app_web.
-- Aman dijalankan berulang. Tidak mengubah atau menghapus data yang ada.
-- Pemilik menjalankannya MANUAL di Railway SEBELUM men-deploy kode Fase 13. Docker menjalankannya otomatis di lokal.

-- (1) Preferensi tampilan akun (mode huruf besar untuk pengguna yang kesulitan membaca).
ALTER TABLE pengguna
  ADD COLUMN IF NOT EXISTS ukuran_huruf text NOT NULL DEFAULT 'normal'
  CHECK (ukuran_huruf IN ('normal', 'besar', 'sangat_besar'));

-- (2) Arsip: setiap catatan yang dihapus lewat aplikasi disalin ke sini dalam pernyataan SQL yang sama.
-- Tidak ada UI untuk membukanya. Pemilik dapat memulihkan lewat SQL (lihat docs/BACKEND.md bagian 10).
CREATE TABLE IF NOT EXISTS catatan_dihapus (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id      text        NOT NULL,
  jenis        text        NOT NULL CHECK (jenis IN ('pengeluaran', 'kalori')),
  data         jsonb       NOT NULL,
  dihapus_pada timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_catatan_dihapus_chat_waktu ON catatan_dihapus (chat_id, dihapus_pada DESC);

-- (3) Hak akses. Pembatasan per KOLOM: id, chat_id, dan tanggal tidak dapat diubah oleh aplikasi,
-- sehingga satu bug tidak bisa memindahkan catatan ke pemilik lain.
-- n8n_writer dan n8n_reader tidak berubah dan tidak punya akses ke catatan_dihapus.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_web') THEN
    GRANT UPDATE (kategori, deskripsi, nominal)        ON pengeluaran TO app_web;
    GRANT UPDATE (nama_makanan, estimasi_kalori)       ON kalori      TO app_web;
    GRANT DELETE ON pengeluaran, kalori TO app_web;
    GRANT INSERT ON catatan_dihapus TO app_web;
    GRANT USAGE, SELECT ON SEQUENCE catatan_dihapus_id_seq TO app_web;
  END IF;
END $$;
