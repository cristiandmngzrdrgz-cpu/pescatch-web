# PesCatch.es — Chollos de material de pesca

Web de afiliados que agrega chollos de pesca de **Amazon** y **AliExpress** con guías y comparativas. Stack: **Next.js 16.2.9 + TypeScript strict + Tailwind v4** (`@tailwindcss/postcss` + `@theme inline` en `src/app/globals.css`) + **SQLite via `@libsql/client`** (local `data/pescatch.db`, producción **Turso**).

Dominio canónico: `https://www.pescatch.es` (Vercel redirige apex → www con 308).

## Requisitos

- Node 20+, npm 10+
- Cuenta Turso (prod), Vercel (deploy), Google Cloud (Sheets API), AliExpress Open Platform (opcional), Resend + Telegram (opcional)

## Quick start (local en 5 min)

```bash
git clone https://github.com/cristiandmngzrdrgz-cpu/pescatch-web.git
cd pescatch-web
npm ci
cp .env.example .env        # si no existe, crea .env con vars de abajo
npm run dev                  # http://localhost:3000 (Turbopack)
```

La DB se crea sola en `data/pescatch.db`; si está vacía, `seedDatabase()` la siembra con `src/data/deals.ts` + 3 posts.

```bash
npm run build && npm run lint && npm test   # verif. antes de commit (177 tests, DB file::memory:)
```

## Variables de entorno

Crea `.env` (dev) y `.env.vercel` (prod, usado por `sync:prod`/`publish:prod` + Vercel):

| Var | Dónde | Descripción |
|-----|-------|-------------|
| `TURSO_DATABASE_URL` | `.env.vercel` / Vercel | `libsql://...turso.io` (prod). Sin ella usa `data/pescatch.db` |
| `TURSO_AUTH_TOKEN` | idem | Token Turso |
| `GOOGLE_SHEETS_CREDENTIALS` | Vercel (JSON inline) / `.env.google-sheets.json` | Service account JSON (o archivo). Sheet ID ya hardcodeado en `src/lib/sync/google-sheets-client.ts` |
| `ADMIN_SECRET` | `.env` / Vercel | Auth `/admin` (cookie 24h). Sin ella, admin abierto |
| `RESEND_API_KEY`, `ADMIN_EMAIL`, `EMAIL_FROM` | Vercel | Newsletter + alertas precio (`noreply@pescatch.es`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` | Vercel | Canal `t.me/pescatch` |
| `CRON_SECRET` | Vercel + GitHub Secret | Bearer para `/api/cron/*` |
| `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`, `ALIEXPRESS_TRACKING_ID`, `ALIEXPRESS_TARGET_CURRENCY=EUR` | Vercel | API afiliados (firma TOP MD5). Opcional sin ella no hay precios AE |
| `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | Vercel | AdSense (slot horizontal home). Sin slot no muestra banner en prod |
| `NEXT_PUBLIC_GA_ID` | Vercel | Analytics opcional |

`src/lib/db.ts` lee `TURSO_DATABASE_URL` en tiempo de llamada (no a nivel módulo) para que scripts que cargan `.env.vercel` tras import funcionen.

## Primer sync (Sheet → web)

Sheet ID: `1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc` (Hoja 1). Auth: service account shareado como Editor.

```bash
# 1. Coloca credenciales
echo '{"type":"service_account",...}' > .env.google-sheets.json
# 2. Sync local (Sheet → data/pescatch.db)
npm run sync
# 3. Verifica
npm run dev   # abre /admin con ADMIN_SECRET
# 4. Sync prod (Sheet → Turso)
npm run sync:prod
npm run publish:prod -- --apply   # drafts → published (dry-run por defecto)
```

Pipeline: `readAllRows` (Sheets API) → fallback CSV público → `scripts/sync-data.json` → SQLite. Columnas: `ean`, `name`, `brand`, `category`, `imageUrl`, `amazonPrice/Url/Stock/OriginalPrice`, `aliexpress*`, `technicalSpecs/review/pros/cons`. `ean` en RAW (preserva leading zeros), `originalPrice` auto 30% sobre `salePrice` si falta.

## Estructura Sheet (Hoja 1)

Headers se auto-expanden más allá de Z (`ensureHeaders` con `batchUpdate`). Flujo discover → candidatos → aprobar añade fila via `appendRow`.

## Scripts principales

| Flujo | Comando |
|-------|---------|
| Discover → candidatos | `npm run discover:auto` → `npm run push-candidates:prod -- --apply` → `/admin/candidates` → Aprobar |
| Sync | `npm run sync` (local) / `sync:prod` (Turso) |
| Refresh precios | `npm run refresh-prices:prod -- --apply` (local + Turso, 15-40min) |
| Crons prod | 5 en `vercel.json` (sync 06:00, clean-expired 03:00, price-alerts 08:30, newsletter lun 09:00, telegram 09:05 UTC) + GH Action horaria `cron-refresh-prices.yml` |
| Tests | `npm test` (vitest, `file::memory:`) |

Ver `AGENTS.md` (no commiteado, guía operativa completa) y `ROADMAP.md` (fases, arquitectura, paleta `globals.css` `@theme inline`).

## Diseño

Tokens en `src/app/globals.css` (`--color-mc-*`, `--color-navy-*`). Utilidades: `.glow-cyan`, `.glass`. Fuente `Geist`.

## Deploy

Push a `master` → Vercel build. Env vars en Vercel Project Settings. Hobby solo permite crons diarios → refresh horario via GitHub Action con `CRON_SECRET`.

## Licencia

Privado — todos los derechos reservados.
