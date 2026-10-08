# Manajemen Pengeluaran

Web pribadi untuk mencatat dan memantau pengeluaran serta kalori harian dengan cepat. Dipakai berkali-kali sehari dalam hitungan detik: tulis apa yang dibeli atau dimakan, lihat sisa budget dan kalori hari ini, selesai.

## Untuk siapa

Multi-pengguna dengan isolasi `chat_id` (`web-<username>`). Satu **admin** (pemilik) + anggota. Semua query filter `chat_id`/`pengguna_id`, admin kelola pengguna via `/pengaturan/pengguna`. Tujuan pencatatan cepat tanpa spreadsheet, pantau target harian, dan portofolio front-end yang rapi, aman, mobile-first.

## Fitur

- **Beranda (/)** — nota hari ini (pengeluaran vs budget, kalori vs target, bar 600ms, stempel merah jika over), tren 7 hari toggle Pengeluaran | Kalori, donat kategori + legenda LeaderRow, 5 catatan terakhir.
- **Catat (/chat)** — chat bahasa natural mis. `kopi 18rb` atau `sarapan nasi uduk 2 telur`. Dukung foto JPG/PNG/WebP maks 5MB + caption (foto opsi 1: preview `objectURL` di bubble, hilang saat pindah/refresh/prune 200 — tidak persist). Status `Mencatat…` → `Sabar, AI-nya baru bangun…` setelah 8s, retry `Kirim ulang` untuk `504`/`502`, batas 30/jam per pengguna.
- **Riwayat (/riwayat)** — tab Pengeluaran | Kalori, filter `?from & ?to & ?category` via GET, validasi Zod, group per tanggal WIB, LeaderRow + chip kategori + jam WIB.
- **Atur (/pengaturan)** — target kalori 500–10000 & budget 1–50.000.000 (upsert `pengaturan` per `chat_id`), ganti panggilan, ganti password (scrypt), kartu Persona.
- **Persona (/pengaturan)** — atur gaya bicara via `POST /api/persona` (`permintaan` 1–150 → Gemini via `N8N_PERSONA_URL` → `validatePersona` 40–1200). Bawaan sopan, tombol Kembali ke bawaan via ConfirmDialog, batas 5/jam per pengguna. `PERSONA_FAKE=true` lokal tanpa n8n.
- **Kelola pengguna (/pengaturan/pengguna)** — admin only: buat anggota, reset password & persona, aktif/nonaktif. Semua perubahan via dialog konfirmasi. Hanya satu admin (`ux_satu_admin`).
- **Login (/login)** — multiuser scrypt (`scrypt$16384$8$1$`), JWT `jose` HS256 cookie `httpOnly` `Secure` `SameSite=Lax` 7 hari (`SESSION_SECRET` ≥32 char). `wajib_ganti_password` redirect ke `/ganti-password`. Rate limit login 5/15 menit per `username`/`IP`.
- **Riwayat chat** — `chat_pesan` 200 terbaru per `pengguna_id` (`pruneKeep200`), `aktivitas` jenis `chat`/`persona` terpisah supaya hapus percakapan tidak reset batas.

## Arsitektur

```
Browser ──▶ Next.js (Vercel, region sin1 dekat Railway)
             ├─▶ Postgres Railway (role app_web, TCP proxy publik + ?sslmode=require) — dashboard, riwayat, pengaturan, pengguna, chat_pesan
             ├─▶ Webhook n8n chat (POST multipart/form-data + X-Webhook-Secret) — AI Agent (Gemini) ──▶ Postgres Railway
             └─▶ Webhook n8n persona (POST JSON + X-Webhook-Secret) — Pembuat Persona ──▶ Next.js validasi
Lokal: Next.js ─▶ Postgres Docker localhost:5433, CHAT_FAKE=true & PERSONA_FAKE=true balas palsu
```

Kenapa baca langsung SQL, bukan lewat AI: angka keuangan harus deterministik (SUM, GROUP BY), AI hanya untuk menulis catatan dari bahasa natural. `chat_id`/`panggilan`/`persona`/`target_kalori` dikirim via `profil` (`JSON` normal, `JSON.stringify` untuk `multipart` foto — n8n perlu `JSON.parse` saat `profil` string).

## Stack

Next.js 16 App Router + TypeScript strict, Tailwind CSS v4, shadcn/ui (base-nova), Recharts, pg (query berparameter tanpa ORM), Zod, jose, Vitest + Testing Library, ESLint + Prettier.

## Struktur

```
src/app/(app)/ page.tsx (Beranda force-dynamic) chat/ riwayat/ pengaturan/ pengaturan/pengguna/ pengaturan/pengguna/[id] + loading.tsx error.tsx layout.tsx
src/app/login/page.tsx ganti-password/page.tsx page.test.tsx
src/app/api/ chat/route.ts chat/hapus/route.ts login/route.ts logout/route.ts ganti-password/route.ts panggilan/route.ts persona/route.ts
src/proxy.ts  src/components/ nav DailyNote LeaderRow TrendChart CategoryDonut ChatUI PengaturanForm PersonaCard ConfirmDialog + ui/*
src/lib/ auth.ts db.ts format.ts schemas.ts persona.ts utils.ts data/queries.ts data/chat.ts data/pengguna.ts __tests__/
db/migrations/ 0001_init.sql 0002_multiuser.sql  db/local/ roles.local.sql seed.sql  docker-compose.yml
scripts/hash-password.ts  vitest.config.ts  next.config.ts
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

Database lokal `localhost:5433` (volume `pgdata`, init `0001_init.sql` → `roles.local.sql` → `0002_multiuser.sql` → `seed.sql`). Seed: admin `admin` + anggota `ibu`, pengeluaran/kalori contoh, pengaturan default. Reset: `docker compose down -v && docker compose up -d`.

`.env.example` berisi placeholder lokal:

```
DATABASE_URL=postgresql://app_web:***@localhost:5433/pengeluaran_dev
SESSION_SECRET=ganti-min-32-karakter-acak-untuk-lokal-xxxx
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
N8N_WEBHOOK_SECRET=ganti-secret-a-lokal
N8N_PERSONA_URL=http://localhost:5678/webhook/persona
N8N_PERSONA_SECRET=ganti-secret-b-lokal
CHAT_FAKE=true
PERSONA_FAKE=true
```

Production env hanya di Vercel dashboard (tanpa `NEXT_PUBLIC_`): `DATABASE_URL` (public proxy `?sslmode=require`), `SESSION_SECRET`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `N8N_PERSONA_URL`, `N8N_PERSONA_SECRET`. Jangan set `CHAT_FAKE`/`PERSONA_FAKE` di production. Hapus `OWNER_CHAT_ID`/`APP_PASSWORD` lama jika masih ada.

Buat hash password lokal (butuh dummy `DATABASE_URL` karena `auth` import `db`):

```bash
$env:DATABASE_URL="postgresql://x:x@localhost:1/db"; npm run hash
# masukkan password 10+ char → copy 1 baris scrypt$16384$8$1$...
```

Seed admin production via DBeaver: jalankan `0002_multiuser.sql` dulu bila `pengguna does not exist`, lalu `INSERT INTO pengguna (username,nama,panggilan,chat_id,peran,password_hash,wajib_ganti_password,persona) VALUES ('tinxx',...)` (username lowercase `^[a-z0-9._-]{3,30}$`).

## Perintah

`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test` · `npm run hash`

## Keamanan

- Query berparameter + filter `chat_id`/`pengguna_id`, `chatId` selalu dari sesi server (`requireUser()`), bukan dari body/query/header. `peran=admin` dicek dari DB setiap aksi.
- Validasi Zod di input & hasil query, `pg` `bigint`/`numeric` di-cast `::int`/`::text`.
- `validatePersona` 40–1200 + tolak URL/```/SQL/`chat_id`/`database`/`kategori`/`abaikan aturan`.
- `pg` pool `max 3` (serverless), `timestamptz` → `Date` → `Intl Asia/Jakarta`, `maxDuration 30` (Hobby).
- Cookie sesi `httpOnly` `Secure` `SameSite=Lax`, `SESSION_SECRET` ≥32 char, `versi_sesi` untuk logout semua perangkat.
- Rate limit: login 5/15 menit (`login_gagal`), chat 30/jam & persona 5/jam (`aktivitas`).
- DB hanya `localhost:5433` lokal, `CHAT_FAKE`/`PERSONA_FAKE` hanya `NODE_ENV != production`, tidak ada secret di klien.

## Screenshot

Letak di `public/` atau screenshot manual: Beranda nota bergerigi, tren 7 hari, donat kategori, Catat chat (+ foto), Riwayat filter, Atur form + Persona, Kelola pengguna. Mobile 375px & desktop 768px.

## Deploy

Vercel import branch `main`, set env di atas, Functions Region `sin1` (Singapore dekat Railway). Push ke `main` auto-deploy. Migrasi `0002_multiuser.sql` dijalankan manual di Railway (DBeaver Alt+X, `IF NOT EXISTS` aman berulang).

## Lisensi

Pribadi — satu admin + anggota, bukan SaaS publik. Edit/hapus entri, ekspor CSV, dark mode di luar MVP. Foto chat opsi 1 tidak persist (hilang ikut prune 200); persist butuh `foto_url` + Vercel Blob/base64 (belum ada).
