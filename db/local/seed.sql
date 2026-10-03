-- Data palsu untuk pengembangan lokal. Semua data fiktif.
-- chat_id lokal: 1000000001 (samakan dengan OWNER_CHAT_ID di .env.local)

INSERT INTO pengaturan (chat_id) VALUES ('1000000001');

INSERT INTO pengeluaran (chat_id, tanggal, kategori, deskripsi, nominal)
SELECT '1000000001',
       ((now() AT TIME ZONE 'Asia/Jakarta')::date - hari_lalu::int + jam::time) AT TIME ZONE 'Asia/Jakarta',
       kategori, deskripsi, nominal::int
FROM (VALUES
  (0, '07:30', 'minuman',      'kopi susu',            18000),
  (0, '12:15', 'makanan',      'nasi ayam campur',     15000),
  (0, '19:00', 'transportasi', 'bensin',               25000),
  (1, '08:00', 'makanan',      'nasi uduk telur',      13000),
  (1, '13:00', 'makanan',      'soto ayam',            17000),
  (1, '15:30', 'minuman',      'es teh',                5000),
  (1, '20:10', 'belanja',      'sabun cuci',           22000),
  (2, '12:30', 'makanan',      'nasi goreng',          16000),
  (2, '18:45', 'tagihan',      'token listrik',       100000),
  (3, '07:50', 'minuman',      'kopi susu',            18000),
  (3, '12:20', 'makanan',      'ayam geprek',          18000),
  (3, '17:00', 'hiburan',      'tiket bioskop',        40000),
  (4, '12:10', 'makanan',      'mie ayam',             14000),
  (4, '19:30', 'transportasi', 'bensin',               25000),
  (5, '08:15', 'makanan',      'bubur ayam',           12000),
  (5, '13:05', 'makanan',      'nasi telur balado',    15000),
  (6, '12:40', 'makanan',      'sate ayam lontong',    22000),
  (6, '16:00', 'kesehatan',    'vitamin',              35000),
  (7, '12:25', 'makanan',      'nasi padang',          25000),
  (7, '18:00', 'minuman',      'boba',                 20000)
) AS t(hari_lalu, jam, kategori, deskripsi, nominal);

INSERT INTO kalori (chat_id, tanggal, nama_makanan, estimasi_kalori)
SELECT '1000000001',
       ((now() AT TIME ZONE 'Asia/Jakarta')::date - hari_lalu::int + jam::time) AT TIME ZONE 'Asia/Jakarta',
       nama_makanan, kkal::int
FROM (VALUES
  (0, '07:35', 'nasi uduk dan 2 telur',   550),
  (0, '12:20', 'nasi ayam campur',        650),
  (1, '08:05', 'nasi uduk telur',         500),
  (1, '12:55', 'soto ayam',               400),
  (1, '19:45', 'mie instan goreng',       380),
  (2, '12:35', 'nasi goreng',             600),
  (2, '19:00', 'sate ayam dan lontong',   450),
  (3, '07:55', 'roti dan susu',           300),
  (3, '12:25', 'ayam geprek dan nasi',    700),
  (4, '12:15', 'mie ayam',                520),
  (4, '19:40', 'nasi telur dadar',        480),
  (5, '08:20', 'bubur ayam',              350),
  (5, '13:10', 'nasi telur balado',       600),
  (6, '12:45', 'sate ayam lontong',       450),
  (6, '19:15', 'pecel lele dan nasi',     650),
  (7, '12:30', 'nasi padang',             800)
) AS t(hari_lalu, jam, nama_makanan, kkal);
