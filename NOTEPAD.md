# Catatan Pengembangan — Manajemen Pengeluaran

> File untuk melanjutkan sesi setelah restart. Update tiap selesai fase. AI agent WAJIB baca ini + AGENTS.md + docs/PRD.md + docs/DESIGN.md + docs/BACKEND.md sebelum mulai.

## Status Saat Ini (2026-10-03 malam)
- Branch: `update` (bukan `main`)
- Commit terakhir: `5efe3ef` fase 3, `9d3503e` fase 2, `77fc2a1` add readme, `8d6471b` fase 1, `1ae75e6` setup, `f193b88` init
- Belum commit: perbaikan kecil Fase 1-4 + Fase 4 Chat (status `M` di git). Commit berikutnya harus mencakup: `src/app/api/chat/route.ts`, `src/app/(app)/page.tsx`, `src/app/(app)/chat/page.tsx`, `src/components/ChatUI.tsx`, `src/lib/db.ts`, `src/lib/schemas.ts`, `src/lib/data/queries.ts`, `src/lib/format.test.ts`, `src/lib/schemas.test.ts`
- `.env.example` disalin dari `.env.local` (identik, jangan ubah nilai lokal)
- `.gitignore` sudah gabungan HEAD + gitignore.template (hide AGENTS.md, docs/, .env.local)
- `next.config.ts` pakai `agentRules: false` agar Next 16 tidak timpa AGENTS.md

## Yang Sudah Dikerjakan

### Fase 0: Setup — SELESAI
- Next.js 16.3.8 App Router + TS strict + Tailwind v4 + ESLint + Prettier + Vitest
- Deps: zod, jose, pg, recharts, shadcn base-nova, lucide, clsx, tailwind-merge, cn + dev vitest/jsdom/testing-library
- Token DESIGN.md bag 2-3 di `globals.css` (kertas #F4F6F8 .. stempel #C8352E + 8 kategori) dan font Bricolage Grotesque + Hanken Grotesk (tabular-nums)
- `docker compose up -d` OK — DB `localhost:5433` isi seed: pengeluaran 20, kalori 16, pengaturan 1 (chat_id 1000000001)
- Verifikasi: typecheck/lint/test/build PASS

### Fase 1: Kerangka & Lapisan Data — SELESAI (commit 8d6471b)
- `next.config.ts` cegah overwrite AGENTS.md
- `src/lib/db.ts` Pool pg max 3 (sekarang pakai globalThis singleton + pool.on error)
- `src/lib/schemas.ts` Zod: kategori 8, pengaturan, dashboard, history, historyFilter (366 hari)
- `src/lib/format.ts` formatRupiah/Kkal/TanggalWIB (Intl Asia/Jakarta)
- `src/lib/data/queries.ts` semua query PRD 6.1-6.3 berparameter + cast ::int ::text + Zod
- `src/components/nav.tsx` mobile bottom tab + desktop top bar (Catat biru-nota menonjol, 44x44, max 960px)
- `src/app/(app)/layout.tsx` wrapper nav, halaman placeholder /, /chat, /riwayat, /pengaturan, /login (375px)

### Fase 2: Beranda — SELESAI (commit 9d3503e)
- `LeaderRow`, `DailyNote` (tepi bergerigi, bar 600ms, stempel merah jika over), `TrendChart` (Recharts toggle Pengeluaran|Kalori), `CategoryDonut` (donat + legenda LeaderRow)
- `src/app/(app)/loading.tsx` skeleton, `error.tsx` Bahasa Indonesia + Coba lagi
- `src/app/(app)/page.tsx` Server Component fetch getDashboardData — fallback lokal SEED 1000000001 jika OWNER 1302646743 kosong (NODE_ENV !== production)
- `export const dynamic = "force-dynamic"` agar / tidak statis (build: ƒ /)
- Angka cocok DB lokal (1200 kkal / Rp58.000 hari ini, trend 7d 7 baris)

### Fase 3: Riwayat — SELESAI (commit 5efe3ef)
- `src/app/(app)/riwayat/page.tsx` Server Component: tab pengeluaran|kalori (?tab), filter from/to/category (?from & ?to & ?category) form GET, validasi historyFilterSchema, group per tanggal WIB, LeaderRow + chip + jam WIB, kosong "Tidak ada catatan di rentang ini..."
- Fallback seed lokal sama seperti Beranda. Build: ƒ /riwayat dynamic. Filter invalid tampil error.

### Fase 4: Catat — SELESAI (belum commit, file ada)
- `src/app/api/chat/route.ts` POST {text} max 500, CHAT_FAKE=true lokal balas palsu, production forward ke N8N_WEBHOOK_URL + X-Webhook-Secret, timeout 15s, Zod validasi reply n8n, maxDuration 30
- `src/components/ChatUI.tsx` Client: list pesan, contoh "kopi 18rb" klik isi input, Mencatat… + tombol disabled, router.refresh(), label perkiraan

### Perbaikan Kecil Fase 1-4 (belum commit, sudah dikerjakan)
1. db.ts globalThis + pool.on error tanpa connection string
2. schemas.ts from/to pakai z.iso.date() (2026-13-45 ditolak), refine 366 hari tetap
3. getTargets pakai pengaturanRowSchema.parse
4. /api/chat validasi n8n dengan Zod, hapus cabang duplikat
5. Beranda sudah force-dynamic (tabel build ƒ)
6. Paket cn TETAP dipakai (5 file ui), tidak uninstall
7. Test nyata: src/lib/format.test.ts (9) + src/lib/schemas.test.ts (11) — total 21 tests PASS
8. Beranda hapus tanggal ganda (tinggal 1 di DailyNote)

### README
- `README.md` singkat sudah dibuat (web apa, buat apa, stack, cara jalan lokal). Versi lengkap Fase 8.

## Verifikasi Terakhir (perbaikan kecil)
- typecheck PASS, lint PASS, test 3 files 21 tests PASS, build PASS — Route: ƒ / , ƒ /riwayat , ƒ /api/chat , ○ /chat /login /pengaturan /_not-found

## PENTING — Jangan Dilanggar
- DB hanya localhost:5433. Jangan pakai psql/railway/vercel ke production. Jangan baca .env* selain .env.example.
- OWNER_CHAT_ID lokal = 1302646743 (milik pemilik), seed = 1000000001 — mismatch sengaja, keep. Fallback seed hanya di NODE_ENV !== production.
- Semua query berparameter filter chat_id, cast ::int ::text, Zod.
- Timestamptz baca Date -> ISO string di server, format Intl Asia/Jakarta.
- Satu fase per sesi, rencana dulu tunggu approve, jangan tambah dep tanpa izin, jangan ubah n8n/migrasi.

## Yang Belum / Selanjutnya

### Segera: Commit Fase 4 + perbaikan kecil
```
git add src/app/api/chat/route.ts src/app/\(app\)/page.tsx src/app/\(app\)/chat/page.tsx src/components/ChatUI.tsx src/lib/db.ts src/lib/schemas.ts src/lib/data/queries.ts src/lib/format.test.ts src/lib/schemas.test.ts
git commit -m "Chat Catat API palsu loading refresh"
# atau gabung dengan perbaikan: "Perbaikan db Zod chat tanggal ganda"
git push origin update
```

### Fase 5: Pengaturan (berikutnya setelah commit)
- Form target kalori (500-10000) & budget (1-50jt) validasi Zod pengaturanInputSchema, upsert ke tabel pengaturan, tampilkan di Beranda. Server Action atau PUT /api/settings.

### Fase 6: Login & Proteksi
- POST /api/login cek APP_PASSWORD, set cookie httpOnly Secure SameSite Lax pakai jose SESSION_SECRET, proteksi semua halaman & endpoint, rate limit.

### Fase 7: Integrasi Production (bersama pemilik)
- Pemilik setup DB Railway + n8n webhook, isi env Vercel. Agent hanya fix kode dari hasil tes pemilik. Ganti fallback seed -> pakai OWNER_CHAT_ID asli.

### Fase 8: Polish & Deploy
- Aksesibilitas, Lighthouse >=90, README lengkap (diagram, screenshot), deploy Vercel. region Vercel dekat Railway.

## Perintah Verifikasi Tiap Fase
```
npm run typecheck
npm run lint
npm run test
npm run build
# dev cek manual: npm run dev (http://localhost:3000) — cek 375px
# DB: docker compose ps ; docker compose exec db psql -U postgres -d pengeluaran_dev -c "SELECT count(*) FROM pengeluaran;"
```

## Struktur Terkini
```
src/app/(app)/ page.tsx (Beranda dynamic) /chat/page.tsx /riwayat/page.tsx /pengaturan/page.tsx + loading.tsx error.tsx layout.tsx
src/app/login/page.tsx
src/app/api/chat/route.ts
src/components/ nav.tsx DailyNote.tsx LeaderRow.tsx TrendChart.tsx CategoryDonut.tsx ChatUI.tsx + ui/*
src/lib/ db.ts format.ts schemas.ts format.test.ts schemas.test.ts data/queries.ts utils.ts
db/migrations/0001_init.sql  db/local/roles.local.sql seed.sql
.env.example (= .env.local)  docker-compose.yml  README.md
```
