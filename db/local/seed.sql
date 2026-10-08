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


-- ===== Multi-pengguna (0002) =====
-- Akun dev. Password HANYA untuk lokal: admin / admin-dev-pass-1  dan  ibu / ibu-dev-pass-1
INSERT INTO pengguna (username, nama, panggilan, chat_id, peran, password_hash, persona) VALUES
('admin', 'Admin Dev', 'Atmin', '1000000001', 'admin', 'scrypt$16384$8$1$uav+3nQyctDm4xn3Tw9z6w==$f9rsTXyVoH1PjlO/4WhmBdquwtwsq5TZiNml2fPl8OdX9ixoWGznlwZoS2xz1rVlo68Oz6Bm36FgcOFUPlKeTA==',
 $persona$Gaya bicara: gaul, santai, dan absurd ala sirkel "meme jomok" lokal.
Sisipan "lho ya", "loh ya", atau "woilah" HANYA saat bercanda, nge-troll, atau melebih-lebihkan situasi. DILARANG dipakai di kalimat yang menyebut angka, nominal uang, atau kalori. Pisahkan kalimat informasi angka (jelas dan akurat) dari kalimat candaan.
Selipkan 1-2 emoji (😿 untuk jajan mahal atau over kalori, 😹 atau 🤤 untuk makan enak).
Boleh hiperbola (dompet "nangis") dan lore meme ("Mas Amba", "Mas Rusdi", "Mas Gatot", "Si Imut") hanya sebagai bumbu komedi di akhir balasan.
Jangan vulgar dan jangan menyinggung SARA. Jika pengguna terlihat bokek atau kesulitan finansial, kurangi bercanda dan jadilah suportif.
Jika kalori melebihi target, sarankan jalan cepat (4,5 km dalam 45 menit) atau lari ke barbershop Mas Rusdi biar body keker.$persona$),
('ibu', 'Ibu Dev', 'Ibu', 'web-ibu', 'anggota', 'scrypt$16384$8$1$AdDEj9v+jUaXvfHMEymu1A==$hbsoeEhoHV1pYf1QbD0V7wx/N1S6Dc1ARiHfJVkHEs3CV888SZpa1TcIy120iWP5ddsSD5CA6KeJwBYMNO2h6Q==', NULL);

-- Target pengguna kedua (berbeda dari admin, untuk menguji isolasi data)
INSERT INTO pengaturan (chat_id, target_kalori, budget_harian) VALUES ('web-ibu', 1800, 100000);

-- Data pengguna kedua. Harus TIDAK PERNAH muncul di akun admin, dan sebaliknya.
INSERT INTO pengeluaran (chat_id, tanggal, kategori, deskripsi, nominal)
SELECT 'web-ibu',
       ((now() AT TIME ZONE 'Asia/Jakarta')::date - hari_lalu::int + jam::time) AT TIME ZONE 'Asia/Jakarta',
       kategori, deskripsi, nominal::int
FROM (VALUES
  (0, '06:30', 'belanja',   'sayur di pasar',  45000),
  (0, '10:00', 'makanan',   'bakso',           20000),
  (1, '09:00', 'tagihan',   'pulsa',           50000),
  (2, '11:30', 'kesehatan', 'obat batuk',      30000)
) AS t(hari_lalu, jam, kategori, deskripsi, nominal);

INSERT INTO kalori (chat_id, tanggal, nama_makanan, estimasi_kalori)
SELECT 'web-ibu',
       ((now() AT TIME ZONE 'Asia/Jakarta')::date - hari_lalu::int + jam::time) AT TIME ZONE 'Asia/Jakarta',
       nama_makanan, kkal::int
FROM (VALUES
  (0, '07:00', 'nasi dan tempe',  400),
  (0, '10:10', 'bakso',           450),
  (1, '12:00', 'soto ayam',       400)
) AS t(hari_lalu, jam, nama_makanan, kkal);

-- Riwayat chat contoh untuk admin
INSERT INTO chat_pesan (pengguna_id, peran, teks, waktu)
SELECT (SELECT id FROM pengguna WHERE username = 'admin'), peran, teks, now() - (menit || ' minutes')::interval
FROM (VALUES
  ('user', 'kopi 18rb', 30),
  ('bot',  'Kopi sudah dicatat: Rp18.000. Total pengeluaran hari ini Rp58.000. 😹 Dompet masih aman.', 29)
) AS t(peran, teks, menit);
