# DESIGN.md: Arahan Visual

> Dokumen ini mengatur **tampilan dan rasa** aplikasi. Perilaku dan data ada di `docs/PRD.md`. Jika keduanya bertentangan soal perilaku, PRD menang. Soal visual, dokumen ini menang.
> Kerjakan dengan komponen shadcn/ui, tetapi **ganti tampilan bawaannya** dengan token di bawah. Jangan membiarkan tema default shadcn.

---

## 1. Konsep

**Produk**: catatan harian pribadi untuk pengeluaran dan kalori. Dipakai terutama di **HP**, berkali-kali sehari, dalam hitungan detik: catat sesuatu, lihat sisa budget dan kalori, selesai.

**Ide visual: nota warung.** Pengeluaran dan makan sehari-hari itu urusan nota, kuitansi, dan buku catatan. Dari situ kita ambil bahasa visualnya:
- Kertas bersih kebiruan, tinta biru seperti bolpoin nota, dan **stempel merah** untuk peringatan.
- Rincian ditampilkan dengan **garis titik-titik penuntun** (nama barang ........ harga), seperti nota asli. Ini bukan hiasan: garis itu membantu mata menghubungkan nama dengan angkanya.
- Ringkasan hari ini tampil sebagai **satu lembar nota** dengan tepi bawah bergerigi. Itu satu-satunya elemen yang dibuat mencolok. Semua yang lain tenang dan rapi.

**Yang dihindari** (ini tampilan "default" yang membuat aplikasi terlihat dibuat otomatis):
- Latar krem dengan aksen terakota, atau latar hitam dengan satu aksen neon.
- Konten dipotong jadi kartu-kartu seragam dengan radius dan bayangan abu-abu yang sama.
- Gradasi sebagai hiasan, label huruf kapital berjarak di atas tiap judul, penomoran 01/02/03 untuk konten yang bukan urutan, panah `→` di setiap tombol.
- Menebalkan atau mewarnai satu kata di dalam judul.

---

## 2. Token Warna

Definisikan sebagai CSS variable di `globals.css`, lalu petakan ke tema Tailwind dan variabel shadcn. Jangan menulis hex langsung di komponen.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `kertas` | `#F4F6F8` | Latar halaman |
| `struk` | `#FFFFFF` | Permukaan nota, input, tabel |
| `tinta` | `#1B2A41` | Teks utama |
| `tinta-redup` | `#5B6B82` | Teks sekunder, label |
| `garis` | `#D5DCE6` | Garis tipis dan border |
| `biru-nota` | `#2B59C3` | Aksen utama, tombol, fokus, data pengeluaran |
| `kuning-kalori` | `#E08A1E` | Data kalori |
| `stempel` | `#C8352E` | **Hanya** untuk melebihi target dan error |

Aturan:
- **Merah (`stempel`) hanya berarti peringatan.** Jangan dipakai sebagai warna kategori atau hiasan.
- Informasi **tidak boleh bergantung pada warna saja**. Melebihi target selalu disertai teks ("Melebihi budget").
- Verifikasi kontras teks minimal 4.5:1 terhadap latarnya (periksa `tinta-redup` pada `kertas`).
- Mode gelap bukan bagian MVP, tetapi susun token agar nanti bisa ditambah tanpa menulis ulang komponen.

**Warna kategori** (grafik dan legenda). Cocokkan nama kategori secara persis (huruf kecil). Kategori yang tidak dikenal, termasuk variasi seperti `makanan/minuman`, memakai warna abu dan ditampilkan apa adanya. Jangan menggabungkan atau menebak di UI.

| Kategori | Hex |
|---|---|
| `makanan` | `#E08A1E` |
| `minuman` | `#2F9E8F` |
| `transportasi` | `#2B59C3` |
| `belanja` | `#8E5BC9` |
| `tagihan` | `#6B7F2A` |
| `kesehatan` | `#D0568A` |
| `hiburan` | `#4F86B8` |
| lainnya / tidak dikenal | `#7A8699` |

---

## 3. Tipografi

Pakai `next/font/google`. Dua keluarga yang jelas berbeda, dengan peran tegas:

- **Bricolage Grotesque**: judul halaman dan **angka besar** (total rupiah, kalori). Karakternya yang membuat aplikasi terasa punya identitas.
- **Hanken Grotesk**: semua teks lain (isi, tabel, form, navigasi).

Verifikasi dulu bahwa kedua font tersedia di `next/font/google` dan angkanya mendukung tabular numerals. Jika tidak, pilih pengganti yang setara dan beri tahu pemilik proyek.

Aturan:
- **Semua angka memakai `font-variant-numeric: tabular-nums`** supaya digit sejajar di kolom dan tidak "bergoyang" saat berubah.
- Skala (mobile): angka besar 40px, judul halaman 24px, judul bagian 18px, isi 16px, keterangan 14px. Tampilan desktop boleh sedikit lebih besar.
- Isi 16px dengan tinggi baris 1.5. Panjang baris teks maksimal sekitar 70 karakter.
- **Huruf kapital semua tidak dipakai** untuk label. Gunakan huruf kecil biasa (sentence case).
- Format angka: `Rp18.000` (tanpa spasi), `1.850 kkal`. Buat satu fungsi pemformat di `lib/format.ts` dan pakai di mana-mana. Pembulatan rupiah ke bilangan bulat.

---

## 4. Bentuk & Permukaan

- **Radius sengaja berbeda per peran**: nota 4px, kontrol (tombol, input) 8px, chip dan label status penuh (pil). Jangan memakai satu radius untuk semuanya.
- **Tanpa bayangan** (`box-shadow`) kecuali cincin fokus. Pisahkan area dengan `garis` 1px dan jarak, bukan bayangan.
- Jarak berbasis kelipatan 4px. Beri ruang lega antarbagian, rapatkan hanya di dalam satu kelompok informasi.
- Latar halaman `kertas`. Hanya nota dan area input yang berlatar `struk`, supaya nota benar-benar terlihat sebagai lembar.

---

## 5. Layout

Rata kiri secara default. **Angka rata kanan** di tabel dan baris rincian. Mobile-first, rapi di 375px.

### 5.1 Navigasi
- **Mobile**: bar tab di bawah dengan 4 item: Beranda, Catat, Riwayat, Atur. Tombol "Catat" (chat) paling menonjol (warna `biru-nota`), karena itu aksi utama.
- **Desktop (≥ 768px)**: bar horizontal di atas, konten di tengah dengan lebar maksimal 960px.
- Area sentuh minimal 44×44px. Item aktif ditandai warna dan penanda bentuk (garis bawah), bukan warna saja.

### 5.2 Beranda (mobile)

```
┌──────────────────────────────┐
│ Kamis, 2 Oktober             │
│                              │
│ ┌──────────────────────────┐ │
│ │ Pengeluaran hari ini     │ │
│ │ Rp96.000      dari 150rb │ │
│ │ ▓▓▓▓▓▓▓▓░░░░░░░░         │ │
│ │ · · · · · · · · · · · ·  │ │
│ │ Kalori hari ini          │ │
│ │ 1.850 kkal   dari 2.000  │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░          │ │
│ └╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱┘ │  ← tepi bergerigi
│                              │
│ Tujuh hari terakhir          │
│ (Pengeluaran | Kalori)       │
│ [grafik garis]               │
│                              │
│ Pengeluaran per kategori     │
│ [donat]                      │
│ makanan ........... Rp62.000 │
│ transportasi ...... Rp25.000 │
│                              │
│ Catatan terakhir             │
│ nasi ayam campur . Rp15.000  │
└──────────────────────────────┘
 [Beranda] [Catat] [Riwayat] [Atur]
```

- **Nota hari ini** adalah elemen paling menonjol di halaman. Tepi bawahnya bergerigi (dibuat dengan CSS `mask` atau gradient berulang, tanpa gambar). Garis pemisah di dalam nota berupa titik-titik.
- **Grafik tren**: satu grafik per kali tampil, dipilih lewat kontrol segmen "Pengeluaran | Kalori". Jangan menumpuk dua satuan di satu grafik dua sumbu.
- **Kategori**: donat dengan **daftar legenda berisi nominal** di bawahnya. Daftar itu yang membawa informasi, donatnya pelengkap.
- Desktop: nota di kolom kiri (sekitar 360px), grafik dan kategori di kolom kanan.

### 5.3 Catat (chat)
- Daftar pesan, dan kolom input menempel di atas bar tab. Pesan pengguna rata kanan, balasan rata kiri, dengan permukaan berbeda (pengguna `biru-nota` dan teks putih, balasan `struk` dengan border `garis`).
- Saat kosong, tampilkan contoh yang bisa disentuh: "kopi 18rb", "sarapan nasi uduk 2 telur". Menyentuh contoh mengisi kolom input, belum mengirim.
- Saat menunggu balasan: indikator "Mencatat…" dan tombol kirim nonaktif.
- Kalori yang disebut AI diberi label **perkiraan**.

### 5.4 Riwayat
- Tab "Pengeluaran | Kalori". Dikelompokkan per tanggal, tiap tanggal diberi judul.
- Tiap baris memakai garis titik-titik penuntun: `nasi ayam campur ........ Rp15.000`, kategori sebagai chip kecil. Jam ditampilkan hanya jika bukan `00:00`.
- Filter di mobile muncul sebagai panel dari bawah (drawer). Di desktop berupa baris filter di atas tabel.
- Desktop boleh memakai tabel biasa dengan angka rata kanan.

### 5.5 Atur
Form sederhana satu kolom: target kalori dan budget harian, tombol "Simpan target".

### 5.6 Login
Satu kolom password di tengah, tanpa dekorasi.

---

## 6. Elemen Khusus

**Nota hari ini** (komponen `DailyNote`)
- Latar `struk`, border `garis`, radius 4px, tepi bawah bergerigi.
- Dua bagian (pengeluaran dan kalori) dipisah garis titik-titik.
- Progres berupa bar horizontal dengan **penanda posisi target**. Warna isi mengikuti jenis data (`biru-nota` untuk pengeluaran, `kuning-kalori` untuk kalori).
- Jika melebihi target, bar berubah `stempel`, dan muncul label bergaya stempel "Melebihi budget" atau "Melebihi target" (border `stempel` 2px, pil, sedikit miring -2°). Label ini satu-satunya elemen yang miring.

**Garis titik-titik penuntun** (komponen `LeaderRow`)
- Flex: nama di kiri, garis titik `flex-1` di tengah (`border-bottom: 2px dotted` warna `garis`), angka rata kanan di kanan. Dipakai di nota, daftar kategori, dan Riwayat.

---

## 7. Gerak (Motion)

- Gerak otomatis (tanpa aksi pengguna) hanya **satu**: bar progres di nota terisi sekali saat Beranda dibuka (sekitar 600ms).
- Gerak sebagai respons aksi pengguna boleh dan dianjurkan: drawer filter, tombol tertekan, pesan baru muncul di chat.
- Dilarang: animasi masuk berulang di tiap bagian, hover bergerak di setiap kartu, efek paralaks.
- Hormati `prefers-reduced-motion`: matikan animasi bar dan transisi non-esensial.

---

## 8. Aksesibilitas & Kualitas Minimum

- Cincin fokus terlihat jelas pada semua elemen interaktif: 2px `biru-nota` dengan jarak 2px.
- Semua input punya label yang terhubung. Tombol memakai tag `button`.
- Grafik punya alternatif teks (ringkasan atau tabel tersembunyi untuk pembaca layar). Legenda kategori sekaligus menjadi alternatif datanya.
- Uji di lebar 375px dan 768px. Tidak ada scroll horizontal pada halaman, kecuali tabel di dalam wadahnya sendiri.

---

## 9. Bahasa & Teks di UI

Bahasa Indonesia, sentence case, kata kerja yang jelas, tanpa basa-basi.

| Situasi | Contoh |
|---|---|
| Tombol | "Catat", "Simpan target", "Coba lagi", "Masuk" |
| Konsistensi aksi | Tombol "Simpan target" menghasilkan pesan "Target tersimpan" |
| Data kosong (Beranda) | "Belum ada catatan hari ini. Buka Catat dan tulis apa yang kamu beli atau makan." |
| Data kosong (Riwayat) | "Tidak ada catatan di rentang ini. Ubah tanggal atau hapus filter." |
| Error jaringan | "Tidak bisa mengambil data. Periksa koneksi, lalu coba lagi." |
| Timeout chat | "Server terlalu lama merespons. Catatanmu mungkin sudah tersimpan, jadi cek Riwayat sebelum mengirim ulang." |
| Password salah | "Password salah. Coba lagi." |
| Label kalori | "perkiraan" di samping angka dari AI |

Aturan: pesan error menjelaskan **apa yang terjadi dan apa yang bisa dilakukan**, tanpa minta maaf berlebihan dan tanpa istilah teknis (bukan "webhook" atau "timeout 504"). Tiap elemen teks hanya punya satu tugas.

---

## 10. Catatan Implementasi untuk Agent

- Taruh token di `globals.css` sebagai CSS variable, petakan ke konfigurasi tema Tailwind sesuai versi yang terpasang (cek dokumentasi resmi), dan ke variabel tema shadcn/ui.
- Font lewat `next/font/google`. Terapkan `tabular-nums` secara global untuk angka.
- Tepi bergerigi dan garis titik dibuat dengan CSS murni (tanpa gambar atau library tambahan).
- Recharts hanya dipakai di Client Component. Warna grafik mengambil dari token, bukan hex langsung.
- Fase 1 menetapkan token, font, layout, dan navigasi. Fase 2 membangun `DailyNote` dan `LeaderRow`. Jangan menunda token ke fase akhir.
- Jika ada keputusan visual yang tidak tercakup di sini, pilih yang paling sederhana dan konsisten dengan dokumen ini, lalu catat di laporan fase.
