# Manajemen Pengeluaran

Web pribadi untuk mencatat dan memantau pengeluaran serta kalori harian dengan cepat. Dipakai berkali-kali sehari dalam hitungan detik: tulis apa yang dibeli atau dimakan, lihat sisa budget dan kalori hari ini, selesai.

## Untuk siapa

Satu pengguna (pemilik), semua data difilter `chat_id`. Tujuannya pencatatan cepat tanpa spreadsheet, pantau target harian, dan jadi portofolio front-end yang rapi, aman, mobile-first.

## Fitur

- **Beranda (/)** — nota hari ini (pengeluaran vs budget, kalori vs target, bar 600ms, stempel merah jika over), tren 7 hari toggle Pengeluaran | Kalori, donat kategori + legenda LeaderRow, 5 catatan terakhir.
- **Catat (/chat)** — chat bahasa natural mis. `kopi 18rb` atau `sarapan nasi uduk 2 telur`. Mencatat… + tombol disabled saat kirim, `router.refresh()` setelah sukses, kalori diberi label perkiraan.
- **Riwayat (/riwayat)** — tab Pengeluaran | Kalori, filter `?from & ?to & ?category` via GET, validasi Zod, group per tanggal WIB, LeaderRow + chip kategori + jam WIB.
- **Atur (/pengaturan)** — form target kalori 500–10000 dan budget 1–50.000.000, format 1.000.000, simpan via Server Action upsert, revalidate Beranda.
- **Login (/login)** — password tunggal, cookie httpOnly Secure SameSite Lax (jose HS256, 7 hari), proxy proteksi semua halaman & /api/*.

## Arsitektur

```
Browser ──▶ Next.js (Vercel, region sin1 dekat Railway)
             ├─▶ Postgres Railway (role app_web, TCP proxy publik + ?sslmode=require) — dashboard, riwayat, pengaturan
             └─▶ Webhook n8n (POST + X-Webhook-Secret) — chat
Telegram ──▶ n8n (AI Agent) ──▶ Postgres Railway ◀── Next.js (Vercel)
Lokal: Next.js ─▶ Postgres Docker localhost:5433, chat CHAT_FAKE=true balas palsu
```

Kenapa baca langsung SQL, bukan lewat AI: angka keuangan harus deterministik (SUM, GROUP BY), AI hanya untuk menulis catatan dari bahasa natural.

## Stack

Next.js 16 App Router + TypeScript strict, Tailwind CSS v4, shadcn/ui (base-nova), Recharts, pg (query berparameter tanpa ORM), Zod, jose, Vitest + Testing Library, ESLint + Prettier.

## Struktur

```
src/app/(app)/ page.tsx (Beranda force-dynamic) chat/ riwayat/ pengaturan/ + loading.tsx error.tsx layout.tsx
src/app/login/page.tsx (Suspense) api/chat/route.ts api/login/route.ts api/logout/route.ts
src/proxy.ts  src/components/ nav DailyNote LeaderRow TrendChart CategoryDonut ChatUI PengaturanForm + ui/* 
src/lib/ auth db format schemas data/queries.ts utils
db/migrations/0001_init.sql  db/local/roles.local.sql seed.sql  docker-compose.yml
```

## Token visual (DESIGN.md)

Kertas #F4F6F8, struk #FFFFFF, tinta #1B2A41, tinta-redup #5B6B82, garis #D5DCE6, biru-nota #2B59C3, kuning-kalori #E08A1E, stempel #C8352E. Font Bricolage Grotesque (judul + angka besar) + Hanken Grotesk (isi), tabular-nums. Nota radius 4px, kontrol 8px, chip pil. Mobile-first 375px, desktop max 960px.

## Jalankan lokal

```bash
docker compose up -d
cp .env.example .env.local
npm install
npm run dev
```

Database lokal `localhost:5433` isi seed pengeluaran 20, kalori 16, pengaturan 1 (chat_id 1000000001). Reset: `docker compose down -v && docker compose up -d`.

`.env.example` berisi placeholder lokal:

```
DATABASE_URL=postgresql://app_web:***@localhost:5433/pengeluaran_dev
OWNER_CHAT_ID=1302646743
CHAT_FAKE=true
APP_PASSWORD=dev-password
SESSION_SECRET=*** 64+ char
```

Production env hanya di Vercel dashboard (tanpa NEXT_PUBLIC_): `DATABASE_URL` (public proxy ?sslmode=require), `OWNER_CHAT_ID`, `N8N_WEBHOOK_URL` (Production URL /webhook/chat, workflow Active ON), `N8N_WEBHOOK_SECRET`, `APP_PASSWORD`, `SESSION_SECRET`. Jangan set `CHAT_FAKE` di production.

## Perintah

`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test`

## Keamanan

- Query berparameter + filter chat_id, cast ::int ::text, Zod di input & hasil.
- Pool pg max 3 (serverless), timestamptz dibaca Date -> ISO -> format Intl Asia/Jakarta.
- Cookie sesi httpOnly Secure SameSite Lax, rate limit login 5/15 menit.
- DB hanya localhost:5433 lokal, CHAT_FAKE hanya di NODE_ENV != production.

## Screenshot

Letak di `public/` atau screenshot manual: Beranda nota bergerigi, tren 7 hari, donat kategori, Catat chat, Riwayat filter, Atur form. Mobile 375px & desktop 768px.

## Deploy

Vercel import branch `main`, set env di atas, Functions Region sin1 (Singapore dekat Railway). Push ke main auto-deploy.

## Lisensi

Pribadi, bukan untuk multi-user. Edit/hapus entri, ekspor CSV, dark mode di luar MVP.
