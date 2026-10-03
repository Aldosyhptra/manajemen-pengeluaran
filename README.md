# Manajemen Pengeluaran

Web pribadi untuk mencatat dan memantau pengeluaran serta kalori harian dengan cepat.

## Apa ini?

Aplikasi catatan harian yang dipakai berkali-kali sehari dalam hitungan detik: tulis apa yang dibeli atau dimakan, lihat sisa budget dan kalori hari ini, selesai.

- **Mencatat** lewat chat bahasa natural, mis. `sarapan nasi uduk 2 telur, kopi 18rb` — diproses AI Agent n8n dan disimpan ke Postgres.
- **Memantau** lewat dashboard dan riwayat yang dibaca langsung dari Postgres oleh Next.js (tanpa lewat AI, supaya angka deterministik).

Satu pengguna (pemilik), semua data difilter `chat_id`.

## Untuk apa?

- Pencatatan cepat tanpa buka spreadsheet.
- Pantau target harian (budget dan kalori) secara real-time.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript strict
- **Styling:** Tailwind CSS v4
- **UI:** shadcn/ui
- **Grafik:** Recharts
- **Database:** Postgres + `pg` (query berparameter, tanpa ORM)
- **Validasi:** Zod
- **Auth sesi:** `jose` (cookie httpOnly)
- **Test:** Vitest + Testing Library
- **Lint & format:** ESLint + Prettier

```

Database lokal di `localhost:5433` dengan data seed. Reset: `docker compose down -v && docker compose up -d`.

> README lengkap (diagram arsitektur, screenshot, performa) menyusul di Fase 8.
