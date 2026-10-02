# AGENTS.md

Proyek: web pribadi pencatatan pengeluaran dan kalori harian (Next.js).
**Baca `docs/PRD.md` (perilaku dan data) dan `docs/DESIGN.md` (tampilan) sebelum mulai.** Kerjakan **satu fase per sesi**.
Soal visual, `DESIGN.md` menang. Pakai token warna dan font di sana, jangan membiarkan tema default shadcn/ui.

## Aturan Kerja

1. **Rencana dulu.** Tulis rencana singkat (file yang diubah dan langkahnya), lalu tunggu persetujuan sebelum menulis kode.
2. **Tugas kecil.** Hanya kerjakan fase atau tugas yang diminta.
3. **Verifikasi sendiri.** Jalankan `npm run typecheck`, `npm run lint`, `npm run test` sebelum menyatakan selesai. Laporkan hasil yang sebenarnya, termasuk yang gagal.
4. **Jangan mengarang.** Nama kolom, format data, atau perilaku n8n yang tidak tertulis di PRD harus ditanyakan atau ditulis sebagai asumsi eksplisit.
5. **Pakai dokumentasi resmi** (bukan ingatan) untuk Next.js dan library lain, karena versi sering berubah.
6. **Ringkas perubahan** di akhir tugas: file apa yang berubah dan kenapa.

## Stack

Next.js (App Router) + TypeScript strict, Tailwind CSS, shadcn/ui, Recharts, `pg` (query berparameter, tanpa ORM), Zod, `jose`, Vitest + Testing Library, ESLint + Prettier.
**Dilarang menambah dependency di luar daftar ini tanpa izin.**

## Perintah

`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test`

## Keamanan (wajib)

- Tidak ada secret di kode klien. Jangan pakai awalan `NEXT_PUBLIC_` untuk apa pun yang rahasia.
- Browser tidak pernah menerima kredensial database atau secret webhook.
- Semua query SQL berparameter. Dilarang menggabungkan input pengguna ke string SQL.
- Semua query memfilter `chat_id`. Semua input dan hasil query divalidasi dengan Zod.
- `tanggal` bertipe `timestamp` tanpa zona: ambil sebagai **teks** (`to_char`), jangan jadikan objek `Date` dan jangan konversi zona waktu.
- `pg` membaca `numeric` dan `bigint` sebagai string: gunakan `z.coerce.number()`.
- `.env*` masuk `.gitignore`. Jangan pernah membaca atau meminta kredensial production. Selama pengembangan pakai `USE_MOCK=true`.

## Struktur & Kode

- Server Component sebagai default. `"use client"` hanya untuk interaksi (chat, grafik, form).
- Semua akses data lewat `src/lib/data` (mock atau `pg`, dipilih oleh `USE_MOCK`).
- Dilarang `any`. Tipe diturunkan dari skema Zod (`z.infer`).
- Pakai komponen shadcn/ui yang ada sebelum membuat komponen baru.
- Mobile-first, wajib rapi di 375px. Teks UI dalam Bahasa Indonesia. Aksesibilitas dasar (tag semantik, label, kontras).

## Larangan

- Mengubah atau membuat workflow n8n.
- Mengubah skema/data Postgres, atau menjalankan `INSERT/UPDATE/DELETE/ALTER/DROP`.
- Menambah login multi-user, atau mengerjakan fitur pasca-MVP (edit/hapus entri, ekspor CSV, dark mode).
- Mengerjakan lebih dari satu fase dalam satu sesi.
