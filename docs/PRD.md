# PRD v2: Web Pencatatan Pengeluaran & Kalori Harian (Next.js)

> Panduan kerja untuk AI coding agent. Baca seluruh dokumen sebelum menulis kode. Kerjakan **satu fase per sesi** (bagian 11) dan **buat rencana dulu** sebelum mengubah file.

---

## 1. Ringkasan

Aplikasi web pribadi untuk mencatat dan memantau pengeluaran serta kalori harian.

- **Mencatat**: lewat chat bahasa natural ("sarapan nasi uduk 2 telur, kopi 18rb"). Diproses AI Agent di n8n (sudah ada), yang menulis ke Postgres.
- **Memantau**: dashboard dan riwayat dibaca **langsung dari Postgres oleh server Next.js**, tanpa lewat AI.
- **Pengguna**: satu orang (pemilik). Semua data difilter dengan `chat_id` milik pemilik.
- **Tujuan**: (1) pencatatan cepat, (2) dashboard akurat dan cepat, (3) proyek portofolio front-end yang rapi, aman, dan responsive.

---

## 2. Pembagian Tanggung Jawab

| Tugas | Dipegang oleh |
|---|---|
| Memahami bahasa natural dan **menulis** data | AI Agent n8n (existing, jangan diubah agent) |
| **Membaca** data untuk dashboard dan riwayat | Server Next.js, query SQL langsung |
| Ringkasan harian ke Telegram | n8n (di luar cakupan proyek ini) |

Alasan: angka keuangan harus **deterministik** dan cepat. SQL (`SUM`, `GROUP BY`) lebih tepat daripada AI yang menulis query setiap kali.

## 3. Status Proyek (baru vs existing)

| Bagian | Status | Aturan untuk agent |
|---|---|---|
| Aplikasi Next.js | **Baru** | Bangun dari nol |
| Workflow n8n | **Existing** | **Dilarang diubah** |
| Postgres Railway (tabel `log_kalori`, `pengeluaran_invoice`) | **Existing** | **Dilarang diubah skema/datanya**. Aplikasi hanya `SELECT` |
| Webhook n8n `/chat` | Disiapkan pemilik proyek secara manual | Agent hanya memakai kontrak di bagian 6.1 |

---

## 4. Arsitektur & Deploy

```
Browser
  │  (HTML dari Server Components, fetch ke /api/chat)
  ▼
Next.js di Vercel (server)
  ├─► Postgres Railway  (read-only, via TCP proxy publik + SSL)   ← dashboard, riwayat
  └─► Webhook n8n       (POST + secret header)                    ← chat
```

- Deploy: **Vercel**. Database dan n8n tetap di **Railway**.
- Database diakses lewat **TCP proxy publik** Railway, jadi pengamanan di bagian 8 wajib dipatuhi.
- Browser **tidak pernah** menerima kredensial database atau secret webhook.
- Atur region function Vercel sedekat mungkin dengan region Railway untuk mengurangi latensi.

---

## 5. Tech Stack

| Kebutuhan | Pilihan |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** (`strict: true`) |
| Styling | Tailwind CSS |
| Komponen UI | shadcn/ui |
| Grafik | Recharts (di Client Component) |
| Database client | `pg` (node-postgres), query berparameter. **Tanpa ORM** |
| Validasi | Zod |
| Sesi/cookie | `jose` (menandatangani cookie sesi) |
| Test | Vitest + Testing Library |
| Lint & format | ESLint + Prettier |

Aturan:
- Pakai **versi stabil terbaru** dan baca dokumentasi resmi Next.js (fitur seperti middleware/proxy dan caching berubah antarversi).
- **Dilarang menambah dependency di luar daftar ini tanpa izin.**
- Pakai komponen shadcn/ui yang sudah ada sebelum membuat komponen baru.
- Pembacaan data dilakukan di **Server Component / Route Handler**. Komponen klien (`"use client"`) hanya untuk interaksi (chat, grafik, form).

---

## 6. Kontrak Data & API

### 6.0 Skema database (diverifikasi dari workflow n8n)

**Terverifikasi (`log_kalori`)**: `id` integer, `tanggal` **timestamp without time zone**, `nama_makanan` varchar, `estimasi_kalori` integer, `chat_id` **varchar (teks)**.

**Terverifikasi (`pengeluaran_invoice`)**: `id` integer, `tanggal` **timestamp without time zone**, `kategori` varchar, `deskripsi` text, `nominal` **numeric**.

`pengeluaran_invoice.chat_id`: **varchar**, terverifikasi. Skema kedua tabel sudah final.

Catatan tipe numerik: `nominal` bertipe `numeric`, dan `pg` membaca `numeric` serta hasil `SUM()` sebagai **string**. Gunakan `z.coerce.number()`, dan bulatkan ke rupiah utuh saat ditampilkan.

Aturan penanganan tanggal (penting):
- `tanggal` adalah waktu WIB **tanpa informasi zona**. Data lama berjam `00:00:00` (hanya tanggal), data baru akan memiliki jam setelah default database dipasang.
- **Jangan** membiarkan `pg` mengubah kolom ini menjadi objek `Date`. Di Vercel proses Node berjalan di UTC, sehingga konversi zona bisa menggeser hari. Ambil `tanggal` sebagai **teks** lewat `to_char(...)` di SQL (lihat 6.3), perlakukan sebagai string waktu WIB apa adanya, dan **jangan** mengonversi zona di aplikasi.
- Tampilkan jam di UI hanya jika bagian jamnya bukan `00:00:00`.
- `chat_id` bertipe teks, jadi `OWNER_CHAT_ID` selalu diperlakukan sebagai string.
- Kolom `id` pada data lama berupa angka besar buatan AI. Urutkan riwayat dengan `tanggal DESC, id DESC`, jangan mengandalkan `id` saja.

`log_kalori`: `id`, `tanggal`, `nama_makanan`, `estimasi_kalori`, `chat_id`
`pengeluaran_invoice`: `id`, `tanggal`, `kategori`, `deskripsi`, `nominal`, `chat_id`

Catatan penting:
- `kategori` adalah **teks bebas** yang diisi AI. Jangan membuat enum ketat. Tampilkan apa adanya, dan beri warna default untuk kategori yang tidak dikenal.
- **`pg` mengembalikan `bigint` dan `numeric` sebagai string.** Di skema Zod gunakan `z.coerce.number()` untuk `nominal`, `estimasi_kalori`, dan hasil `SUM`.
- Hari ini dihitung di aplikasi dengan zona `Asia/Jakarta`, lalu dikirim sebagai parameter. Jangan mengandalkan zona waktu server database.
- Semua query **wajib** memfilter `chat_id = $1` (nilai dari `OWNER_CHAT_ID`) dan memakai parameter, bukan menyusun string SQL.

### 6.1 `POST /api/chat` (diteruskan ke n8n)

Request dari browser: `{ "text": "kopi 18rb" }` (maksimal 500 karakter).
Route Handler meneruskan ke webhook n8n: `{ text, chat_id: OWNER_CHAT_ID, session_id }` dengan header secret.
Respons: `{ "reply": "Tercatat: kopi Rp18.000." }`.
Error: lihat 6.5.

### 6.2 Data dashboard (Server Component, bukan endpoint publik)

```ts
type DashboardData = {
  date: string; // YYYY-MM-DD (hari ini, WIB)
  today: { calories: number; spending: number };
  trend7d: { date: string; calories: number; spending: number }[];
  spendingByCategory7d: { category: string; total: number }[];
};
```

Query referensi (`$1` = chat_id, `$2` = hari ini):
```sql
-- Hari ini
SELECT COALESCE(SUM(estimasi_kalori),0) AS calories
FROM log_kalori WHERE chat_id = $1 AND tanggal::date = $2::date;

SELECT COALESCE(SUM(nominal),0) AS spending
FROM pengeluaran_invoice WHERE chat_id = $1 AND tanggal::date = $2::date;

-- Tren 7 hari (hari tanpa data tetap muncul sebagai 0)
WITH days AS (
  SELECT generate_series($2::date - 6, $2::date, interval '1 day')::date AS d
)
SELECT days.d AS date,
  COALESCE((SELECT SUM(estimasi_kalori) FROM log_kalori
            WHERE chat_id = $1 AND tanggal::date = days.d), 0) AS calories,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran_invoice
            WHERE chat_id = $1 AND tanggal::date = days.d), 0) AS spending
FROM days ORDER BY days.d;

-- Pengeluaran per kategori, 7 hari
SELECT kategori AS category, SUM(nominal) AS total
FROM pengeluaran_invoice
WHERE chat_id = $1 AND tanggal::date BETWEEN $2::date - 6 AND $2::date
GROUP BY kategori ORDER BY total DESC;
```

### 6.3 Data riwayat (filter lewat `searchParams`: `from`, `to`, `category`)

```ts
type HistoryData = {
  expenses: { id: number; date: string; category: string; description: string; amount: number }[];
  meals: { id: number; date: string; name: string; calories: number }[];
  categories: string[]; // untuk dropdown filter
};
```
```sql
SELECT id, to_char(tanggal, 'YYYY-MM-DD"T"HH24:MI:SS') AS tanggal, kategori, deskripsi, nominal
FROM pengeluaran_invoice
WHERE chat_id = $1 AND tanggal::date BETWEEN $2::date AND $3::date
  AND ($4::text IS NULL OR kategori = $4)
ORDER BY tanggal DESC, id DESC LIMIT 200;

SELECT id, to_char(tanggal, 'YYYY-MM-DD"T"HH24:MI:SS') AS tanggal, nama_makanan, estimasi_kalori
FROM log_kalori
WHERE chat_id = $1 AND tanggal::date BETWEEN $2::date AND $3::date
ORDER BY tanggal DESC, id DESC LIMIT 200;

SELECT DISTINCT kategori FROM pengeluaran_invoice WHERE chat_id = $1 ORDER BY kategori;
```
Validasi `from`, `to`, `category` dengan Zod sebelum dipakai. Rentang maksimal 366 hari.

### 6.4 Target harian (Pengaturan)

Belum ada tabelnya, dan database dibaca saja. Untuk MVP, target kalori dan budget disimpan di **`localStorage`** (nilai awal: 2000 kkal dan Rp150.000, bisa diubah di halaman Pengaturan). Progress dihitung di komponen klien dengan membandingkan total dari server dengan target. Beri komentar `TODO: pindah ke database` di kode terkait.

### 6.5 Format error `/api/chat`

```json
{ "error": { "code": "UPSTREAM_TIMEOUT", "message": "Server terlalu lama merespons. Coba lagi." } }
```
Kode: `UNAUTHORIZED` (401), `VALIDATION_ERROR` (400), `UPSTREAM_TIMEOUT` (504), `UPSTREAM_ERROR` (502), `INTERNAL` (500).

---

## 7. Halaman & Perilaku UI

Keputusan visual (warna, font, layout, bentuk, copy) mengikuti **`docs/DESIGN.md`**. Bagian ini hanya mengatur perilaku.

Berlaku untuk semua halaman:
- **Loading**: skeleton (`loading.tsx`). **Error**: `error.tsx` dengan pesan Bahasa Indonesia dan tombol "Coba lagi". **Kosong**: pesan yang menjelaskan langkah berikutnya.
- **Mobile-first**, wajib rapi di **375px**.
- **Aksesibilitas**: tag semantik (`button`, bukan `div`), label pada input, kontras cukup, bisa dipakai dengan keyboard.
- Format rupiah (`Rp18.000`) dan tanggal Indonesia lewat `Intl`. Teks UI dalam Bahasa Indonesia.

Halaman:
1. **Dashboard (`/`)**: kartu kalori dan pengeluaran hari ini (progress terhadap target), grafik tren 7 hari, pie kategori pengeluaran 7 hari.
2. **Chat (`/chat`)**: daftar pesan dan satu kolom input. Saat menunggu, tampilkan indikator dan nonaktifkan tombol kirim (AI bisa butuh beberapa detik). Setelah sukses, panggil `router.refresh()` agar data ter-update. Label kalori sebagai **perkiraan**.
3. **Riwayat (`/riwayat`)**: dua tab (Pengeluaran, Kalori), filter tanggal dan kategori, tabel yang bisa di-scroll horizontal di layar kecil.
4. **Pengaturan (`/pengaturan`)**: form target dengan validasi Zod.
5. **Login (`/login`)**: satu kolom password.

---

## 8. Keamanan

1. **Dua kredensial sensitif, keduanya hanya di environment server**: `DATABASE_URL` dan `N8N_WEBHOOK_SECRET`. Jangan pakai awalan `NEXT_PUBLIC_` untuk apa pun yang rahasia.
2. **Database**: aplikasi memakai role `web_readonly` (hanya `SELECT` di dua tabel), **bukan** user admin Railway. Koneksi memakai SSL (`sslmode=require`).
3. **Pool koneksi kecil** (`max` 1-3) karena serverless, dan `statement_timeout` pendek.
4. **Query hanya berparameter.** Dilarang menggabungkan input pengguna ke string SQL.
5. **Autentikasi**: `POST /api/login` membandingkan dengan `APP_PASSWORD`, lalu mengeset cookie sesi **httpOnly, Secure, SameSite=Lax** yang ditandatangani `SESSION_SECRET`. Semua halaman dan endpoint kecuali `/login` menolak akses tanpa sesi valid. Batasi percobaan login (rate limit sederhana).
6. **Validasi input** di server: panjang `text`, format tanggal, nilai `category`. **Validasi hasil query** dengan Zod sebelum dikirim ke UI.
7. Jangan menulis data keuangan ke `console.log`. `.env*` masuk `.gitignore`. Sediakan `.env.example` tanpa nilai asli.
8. **Akses agent ke kredensial**: agent coding **tidak diberi `DATABASE_URL` production**. Selama fase 0-6 aplikasi berjalan dengan `USE_MOCK=true`. Koneksi database asli baru dites di fase 7 oleh pemilik proyek.

Environment variable (server): `DATABASE_URL`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `OWNER_CHAT_ID`, `APP_PASSWORD`, `SESSION_SECRET`, `USE_MOCK`.

---

## 9. Non-Functional

- Lighthouse minimal **90** (Performance dan Accessibility).
- **Efisien ke database**: tiap tampilan halaman maksimal beberapa query ringan, hasil dibatasi (`LIMIT`), dan jangan polling berkala. Data hanya diambil saat halaman dibuka atau setelah chat sukses. Ini menjaga biaya Railway tetap kecil.
- **Timeout chat**: tetapkan batas waktu `fetch` ke n8n dan `maxDuration` di Route Handler. Cek batas terbaru Vercel untuk akun yang dipakai, lalu tampilkan error `UPSTREAM_TIMEOUT` yang ramah.
- `typecheck`, `lint`, dan `test` harus lulus sebelum fase dianggap selesai.

---

## 10. Struktur Folder & Standar Kode

```
/
├─ src/
│  ├─ app/
│  │  ├─ (app)/
│  │  │  ├─ page.tsx             # Dashboard
│  │  │  ├─ chat/page.tsx
│  │  │  ├─ riwayat/page.tsx
│  │  │  └─ pengaturan/page.tsx
│  │  ├─ login/page.tsx
│  │  └─ api/
│  │     ├─ chat/route.ts
│  │     └─ login/route.ts
│  ├─ components/
│  │  ├─ ui/                     # shadcn/ui
│  │  └─ ...
│  └─ lib/
│     ├─ data/
│     │  ├─ index.ts             # memilih mock atau pg berdasarkan USE_MOCK
│     │  ├─ mock.ts
│     │  └─ pg.ts                # query SQL (bagian 6)
│     ├─ db.ts                   # pool pg
│     ├─ schemas.ts              # skema Zod + tipe TS
│     ├─ auth.ts                 # sesi cookie
│     └─ format.ts               # rupiah & tanggal
├─ .env.example
└─ AGENTS.md
```

Aturan kode:
- TypeScript strict. **Dilarang `any`.** Tipe diturunkan dari skema Zod (`z.infer`).
- Komponen fungsional. Satu komponen per file, nama file `PascalCase.tsx` (kecuali file khusus Next.js).
- Jadikan **Server Component** sebagai default. Pakai `"use client"` hanya jika perlu.
- Akses data hanya lewat `lib/data` (satu pintu), sehingga mock dan database asli bisa ditukar tanpa mengubah halaman.
- Styling dengan Tailwind.

Perintah (harus ada di `package.json`): `dev`, `build`, `lint`, `typecheck`, `test`.

---

## 11. Tahapan Kerja

Setelah tiap fase: jalankan `typecheck`, `lint`, `test`, lalu berhenti dan laporkan untuk di-review dan di-commit.

**Fase 0: Setup.** Next.js + TypeScript, Tailwind, shadcn/ui, ESLint, Prettier, Vitest, `.env.example`, `.gitignore`.
*Selesai jika*: `dev`, `build`, `lint`, `typecheck`, `test` jalan tanpa error.

**Fase 1: Kerangka & mock data.** Layout, navigasi (mobile dan desktop), skema Zod, `lib/data` dengan implementasi mock sesuai bagian 6.
*Selesai jika*: semua halaman terbuka dengan data mock dan rapi di 375px.

**Fase 2: Dashboard.** Kartu ringkasan, grafik tren, pie kategori, state loading/error/kosong.
*Selesai jika*: dashboard tampil dari mock, grafik terbaca di 375px, test `format.ts` lulus.

**Fase 3: Riwayat.** Tab, filter via `searchParams`, validasi Zod.
*Selesai jika*: filter bekerja pada mock dan input tidak valid ditolak dengan pesan jelas.

**Fase 4: Chat.** UI chat, Route Handler `/api/chat` dengan balasan mock, loading, error, `router.refresh()`.
*Selesai jika*: kirim pesan berjalan, tombol nonaktif saat loading, error timeout tampil ramah.

**Fase 5: Pengaturan.** Form target + `localStorage`, dipakai dashboard.
*Selesai jika*: nilai tersimpan dan memengaruhi progress.

**Fase 6: Login & proteksi.** Cookie sesi, proteksi semua halaman dan endpoint, rate limit login.
*Selesai jika*: tanpa sesi semuanya terarah ke `/login` atau 401, dan cek hasil build menunjukkan tidak ada secret di bundle klien.

**Fase 7: Integrasi asli (dikerjakan bersama pemilik proyek).** Implementasi `pg.ts`, koneksi ke Railway dengan role read-only, sambungkan `/api/chat` ke webhook n8n asli. Pemilik yang mengisi environment variable dan menjalankan tes.
*Selesai jika*: alur login → chat → dashboard ter-update berjalan dengan data asli, dan nilai angka cocok dengan isi tabel.

**Fase 8: Polish & deploy.** Aksesibilitas, performa, README (masalah, stack, diagram arsitektur, screenshot), deploy Vercel.
*Selesai jika*: Lighthouse ≥ 90 dan aplikasi live berfungsi di HP.

---

## 12. Di Luar Cakupan (Agent Dilarang)

- Mengubah atau membuat workflow n8n.
- Mengubah skema/data Postgres, atau menjalankan `INSERT/UPDATE/DELETE/ALTER/DROP`.
- Menggunakan kredensial database production (lihat 8.8).
- Menambah login multi-user atau registrasi.
- Menambah dependency di luar daftar tanpa izin.
- Mengerjakan fitur pasca-MVP: edit/hapus entri, ekspor CSV, dark mode, target harian di database.
- Mengerjakan lebih dari satu fase per sesi.

---

## 13. Aturan Kerja Agent (ringkasan untuk AGENTS.md)

1. **Rencana dulu**, tunggu persetujuan sebelum menulis kode.
2. **Tugas kecil**: hanya fase yang diminta.
3. **Verifikasi sendiri**: jalankan `typecheck`, `lint`, `test`, lalu laporkan hasil sebenarnya, termasuk yang gagal.
4. **Jangan mengarang**: nama kolom, format data, atau perilaku n8n yang tidak tertulis di dokumen ini ditanyakan atau ditulis sebagai asumsi eksplisit.
5. **Jangan menyentuh** n8n, database, dan file `.env` asli.
6. **Pakai dokumentasi resmi**, bukan ingatan, untuk API Next.js dan library lain.
7. **Ringkas perubahan** di akhir tugas: file apa yang berubah dan kenapa.

---

## 14. Tugas Pemilik Proyek (bukan agent)

- [ ] Jalankan `db-setup.sql`: cek tipe kolom, buat role `web_readonly`, tambah index.
- [ ] Jalankan langkah 5 di `db-setup.sql` (default `tanggal` WIB dan penyelarasan sequence `id`).
- [x] Di n8n, hapus `id` dan `tanggal` dari field tool insert yang diisi model, supaya database yang mengisinya (selesai).
- [ ] Di n8n: tambah Webhook `/chat` + Header Auth, Edit Fields untuk menyamakan input, Respond to Webhook (status 200 dan 500). Hapus `id` dan `chat_id` dari field yang diisi model di tool insert (isi dari sistem), dan beri deskripsi tipe pada `nominal`, `estimasi_kalori`, `kategori`.
- [ ] Ganti tool "Cari Data" ke role database read-only.
- [ ] Siapkan environment variable di Vercel (bagian 8).
- [ ] Tentukan region Vercel yang dekat dengan region Railway.
