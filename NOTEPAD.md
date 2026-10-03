# Catatan Pengembangan — Manajemen Pengeluaran

> File ini untuk melanjutkan sesi setelah restart. Update tiap selesai fase.

## Status Saat Ini
- Branch: main
- Fase 0: SELESAI (belum push, tinggal commit)
- Commit pesan: `Inisialisasi Next.js Tailwind shadcn ESLint Vitest`
- `.gitignore` sudah hide AGENTS.md, CLAUDE.md, DESIGN.md, PRD.md, docs/ (via `git rm --cached`)

## Yang Sudah Dikerjakan (Fase 0: Setup)
- Next.js 16.3.8 App Router + TypeScript strict + Tailwind v4 + ESLint
- Stack PRD terinstall: zod, jose, pg, recharts, shadcn (base-nova), lucide, clsx, tailwind-merge, cn
- Dev: vitest + vite + @testing-library/* + jsdom + prettier + @types/pg, bump @types/node ^24
- shadcn init: components.json, src/lib/utils.ts, src/components/ui/button, card, input, label
- Config: vitest.config.ts, vitest.setup.ts, .prettierrc, .prettierignore, .npmrc (legacy-peer-deps=true), .env.example (USE_MOCK=true), .gitignore
- src/app/layout.tsx (lang=id), src/app/page.tsx placeholder, src/app/page.test.tsx smoke test
- Verifikasi: typecheck PASS, lint PASS, test PASS (1 passed), build PASS

## Yang Belum / Selanjutnya
- Commit + push Fase 0:
  ```
  git add .gitignore NOTEPAD.md
  git add . && git commit -m "Inisialisasi Next.js Tailwind shadcn ESLint Vitest"
  git push
  ```

## Rencana Fase Berikutnya
- **Fase 1: Kerangka & mock data** — Layout + navigasi mobile/desktop (375px), skema Zod (src/lib/schemas.ts), format rupiah/tanggal (src/lib/format.ts), lib/data mock + index.ts (switch USE_MOCK) sesuai PRD 6.2/6.3, halaman placeholder /, /chat, /riwayat, /pengaturan, /login
- **Fase 2: Dashboard** — Kartu ringkasan kalori & pengeluaran hari ini, grafik tren 7 hari, pie kategori, state loading/error/kosong
- **Fase 3: Riwayat** — Tab Pengeluaran/Kalori, filter searchParams (from, to, category), validasi Zod 366 hari
- **Fase 4: Chat** — UI chat + Route Handler /api/chat (mock), loading, error timeout, router.refresh()
- **Fase 5: Pengaturan** — Form target harian (localStorage, TODO pindah ke DB)
- **Fase 6: Login & proteksi** — Cookie sesi jose httpOnly Secure SameSite=Lax, proteksi halaman & endpoint, rate limit
- **Fase 7: Integrasi asli** — pg.ts (query berparameter, to_char, z.coerce.number), konek Railway web_readonly + webhook n8n (bareng pemilik)
- **Fase 8: Polish & deploy** — Aksesibilitas, performa Lighthouse >=90, README, deploy Vercel

## Perintah Verifikasi Tiap Fase
```
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev
```

## Catatan Penting PRD
- Semua query filter chat_id, berparameter, validasi Zod
- tanggal = timestamp without timezone, ambil via to_char sebagai teks, jangan jadi Date
- pg numeric/bigint = string, pakai z.coerce.number()
- USE_MOCK=true selama Fase 0-6
- Dilarang ubah n8n / skema DB / INSERT/UPDATE/DELETE
