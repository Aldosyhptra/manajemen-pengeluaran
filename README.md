# Manajemen Pengeluaran

Aplikasi web untuk mencatat pengeluaran dan kalori harian dengan bahasa natural. Tulis `kopi 18rb` atau `nasi padang 25rb` di chat, atau kirim foto makanan + caption — AI (n8n + Gemini) mencatat otomatis. Ada dashboard harian, riwayat, dan target budget/kalori.

Multi-pengguna dengan isolasi data per `chat_id`. Satu admin + anggota, login dengan password terenkripsi (scrypt).

## Fitur

- **Beranda** — pengeluaran vs budget & kalori vs target hari ini, tren 7 hari, donat kategori
- **Catat** — chat + foto (JPG/PNG/WebP 5MB), balasan AI sesuai persona
- **Riwayat** — filter tanggal & kategori
- **Pengaturan** — ganti target, panggilan, password, dan persona (gaya bicara AI)

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts · PostgreSQL (`pg`) · Zod · jose · Vitest

## Jalankan Lokal

```bash
docker compose up -d
cp .env.example .env.local
npm install
npm run dev
```

Buka http://localhost:3000 — database lokal di `localhost:5433`.

## Environment

Lihat `.env.example`. Production diisi via Vercel Dashboard (`DATABASE_URL`, `SESSION_SECRET`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `N8N_PERSONA_URL`, `N8N_PERSONA_SECRET`).
