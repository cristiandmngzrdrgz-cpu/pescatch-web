---
tags: [vault/brain, vault/onboarding]
fecha: 2026-07-30
---

# Estado actual del proyecto

> Lee esto al empezar cualquier sesión. Es el "cerebro" del agente.

---

## Lo último que se hizo (24 Ago 2026)

**Purga Decathlon + crons en producción (Vercel Cron + GH Action), 177 tests:**
- **Decathlon ELIMINADO del proyecto**: sin afiliado no monetiza. Purga de 80 deals locales y 79 de Turso (+65 productos huérfanos por DB, price_history incluida) con `scripts/_archive/purge-decathlon.ts`. Backups: `data/backups/pescatch-2026-08-24.db` + `data/archive-decathlon-{local,turso}.json`. `DISABLED_STORES` queda como defensa pasiva; añadido el filtro que faltaba en `/marcas`, `/api/deals/batch` y los crons newsletter/telegram (**fuga real: salían chollos Decathlon en Turso con 33 deals published sin filtrar**).
- **Crons en producción**: 5 crons diarios en `vercel.json` (sync 06:00, clean-expired 03:00, price-alerts 08:30, newsletter lun 09:00, telegram lun 09:05 — horas UTC). Las rutas `/api/cron/*` aceptan GET (lo que dispara Vercel Cron) + POST y exportan `maxDuration=300`. Vercel inyecta Bearer CRON_SECRET solo.
- **Refresh horario vía GitHub Action** (`.github/workflows/cron-refresh-prices.yml`): Vercel Hobby solo permite crons diarios. Cada hora procesa ~20 deals con cursor persistido en la nueva tabla `cron_state` (`src/lib/cron-state.ts`) → ciclo completo diario contra Turso directo. `refreshAllPrices({ limit })` nuevo parámetro. **Pendiente**: añadir secret `CRON_SECRET` al repo de GitHub (Settings → Secrets → Actions).
- **Playwright 100% lazy en `src/`** (`scraping-utils/browser.ts`, `price-scraper/brave.ts`, `price-scraper/decathlon.ts`): el import estático reventaba el serverless con "Cannot find module playwright-core/browsers.json".
- **Env vars de producción completas**: CRON_SECRET, GOOGLE_SHEETS_CREDENTIALS (JSON compactado), RESEND_API_KEY, ADMIN_EMAIL, EMAIL_FROM, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID añadidas a Vercel.
- **Validado en producción**: refresh-prices 2 chunks (13+17 updated, cursor avanza), clean-expired y price-alerts 200 OK.
- **Mantenimiento lunes**: clean-expired (0 expirados) + `refresh-prices:prod --apply` (118 updated, 14 failed Amazon, 0 removed) propagado a Turso.
- Backlog de candidatos ya estaba aplicado (Turso a 0 pending, 34 deals creados el 23/08). Commits: `7b4384f`, `afe3d4a`, `be89493`, `f5c2705`, `e17fd50`, `f2cc5d9`.
- **Tests: 177/177** (+17 en `api-cron.test.ts`). Lint 0 errores.

### Sesión anterior (18 Ago 2026)

**Telegram operativo + refactor blog + tests SEO (160 tests):**
- **Bot de Telegram funcionando**: `src/lib/telegram.ts` (`buildTelegramMessage` con HTML válido de la Bot API: solo `<b>`, `<i>`, `<a>`, `<code>`, `<s>`; `sendTelegramMessage`) + `scripts/send-telegram.ts` (`npm run send-telegram`, top 10 chollos por `discountPercent`). Link al canal `t.me/pescatch` en footer y newsletter. Tarea `PesCatch-Telegram` (lun 09:05) añadida a `setup-scheduler.ps1`. **Primer envío real publicado en el canal ✅** (config ya en `.env`). Commit `1f773fb`.
- **Refactor blog**: lógica de render extraída de `blog/[slug]/page.tsx` → `src/lib/blog-renderer.ts` (`extractProducts`, `extractFAQs`, `extractToc`, `mdToHtml`, `bestStoreUrl`, `BADGE_LABELS/COLORS`) + 13 tests (`blog-renderer.test.ts`). Commit `2cb5d09`.
- **Tests SEO**: `seo.test.ts` con 48 tests de schemas JSON-LD (Product/Breadcrumb/ItemPage/Review/FAQ/BlogPosting/CollectionPage/SearchResults) + `buildMetadata` + `category-content`. Commit `2cb5d09`.
- **Refresh AliExpress solo API**: eliminado el fallback con navegador Brave en `price-scraper/index.ts` (AliExpress bloquea con captcha "no soy un robot"); la API de afiliados con gate ±15% es la única vía. Commit `167c635`.
- **Lint**: 0 errores, **20 warnings** (bajó de 21 al quitar el `slugify` sin usar del refactor). **Tests: 160/160** (12 archivos). Build OK.
- **Git**: 3 commits + push (`1f773fb`, `2cb5d09`, `167c635`).

### Sesión anterior (14 Ago 2026)

**6 chollos AliExpress verificados y publicados con precio real + fix push-prices:**
- **Verificación de precios AE**: el precio del cache/API es "desde" (sin IVA / mín. de variantes), distinto del real. Verificados los 6 candidatos top con navegador (playwright) en `es.aliexpress.com` → precio real usado como `manualPrice` (precedencia en `run-sync.ts` intacta: `manualPrice ?? api.price`).
- **Publicados en Turso** (precio real, original verificado, descuento ≤70% por cap anti-falso): KastKing Centron Lite **76,99€**, FUJI Jigging **41,79€**, Sougayilang Surf 3 sec **62,69€**, Goture telescópico **61,99€**, BIUTIFU BIGFISH **56,69€**, Sougayilang 1.8m kit **39,59€**. 3 creados nuevos en Turso, 3 actualizados. `sync` + `sync:prod` → total 40 AE `published` en Turso.
- **Fix `push-prices:prod`** (`scripts/push-prices-to-prod.ts`): ahora empareja por id → slug → **productId+storeId**. Resuelto el "Deals no encontrados en Turso: 1" (la CAPERLAN Seacoast local y la Turso eran el mismo producto con id/slug de deal divergentes). Aplicados 4 cambios de `shippingCost` pendientes (local 2,99€ → Turso).
- **Candidatos AE restantes** (~89) rechazados (baratijas/genéricos, precio cache "desde" no fiable). Limpiados todos los scripts temporales de la sesión.

**Alertas de precio por email (usuario) + Resend activado:**
- **Nuevo**: tabla `price_alerts` (`UNIQUE(email, dealId)`, status `active`/`triggered`/`cancelled`), `src/lib/price-alerts.ts` (`createPriceAlert`, `cancelPriceAlert`, `processPriceAlerts` one-shot), `POST /api/price-alerts` (+ GET de estado) y `GET /api/price-alerts/unsubscribe` (redirige a `/deals/<slug>?alert-cancelled=true`).
- **Nuevo**: `src/components/deals/price-alert-button.tsx` — botón + modal "Avísame si baja de precio" en la ficha (email + precio objetivo opcional; sin objetivo = cualquier bajada). Integrado en `deals/[slug]/page.tsx`.
- **Nuevo**: `scripts/send-price-alerts.ts` (`npm run send-price-alerts`) + tarea `PesCatch-PriceAlerts` 08:30 en `setup-scheduler.ps1` (tras el refresh de 08:00).
- **Rate-limit**: tier `price-alerts` (3/min). **Tests**: 14 nuevos en `api-price-alerts.test.ts` → **112 tests**.
- **Resend configurado**: `RESEND_API_KEY`/`ADMIN_EMAIL`/`EMAIL_FROM=PesCatch <noreply@pescatch.es>` en `.env`, dominio `pescatch.es` verificado. Email de test enviado y recibido ✅. Newsletter y alertas operativos.
- **Verificado**: `npm test` (112/112), `npm run lint` (0 errores), `npm run build` OK.
- **Git**: commit `fd99b52` (12 archivos) + push.

### Sesión anterior (12 Ago 2026)

**Tests ampliados (14 → 98) + deuda técnica + push:**
- **Tests con DB en memoria**: `vitest.config.ts` usa `TURSO_DATABASE_URL=file::memory:` + `src/__tests__/setup.ts` limpia tablas transitorias entre tests. **Ya no tocan `data/pescatch.db`** (antes los tests escribían en la DB local real).
- **98 tests en 8 archivos**: `queries.test.ts` (existente), `data-queries.test.ts` (CRUD deals, paginación, búsqueda, brands/categories, multi-store, blog update regression), `misc-lib.test.ts` (pending-candidates, rate-limit, zod), `api-newsletter-contact.test.ts`, `api-vote-comments.test.ts`, `api-deals-posts.test.ts`, `api-admin-sync.test.ts`, `api-admin-login.test.ts`. Cobertura de las 18 API routes (éxito + 400/401/404/429).
- **`safeEqual` extraído** a `src/lib/auth-utils.ts`; `admin-auth.ts` y `admin/login` ahora leen `ADMIN_SECRET` en tiempo de llamada (consistente con `db.ts`) → testable.
- **Fix robustez**: `createDeal`/`createPost`/`createProduct` generan id con sufijo aleatorio (`Date.now()` colisionaba en tests rápidos).
- **Git**: commit `79d5d1e` + push a `origin/master` (incluye los 3 commits previos pendientes: 612a021, fe037ad, 79a95a8). Scripts one-shot `create-kit-post` y `fix-vengance-image` archivados.
- **ROADMAP.md actualizado**: tests ✅, Google Sheets range dinámico ✅ (ya no hay `A1:R100`), notas técnicas con 98 tests.
- **Verificado**: `npm test` (98/98), `npm run lint` (0 errores), `npm run build` OK.

### Sesión anterior (2 Ago 2026)

**Revisión completa del proyecto + actualización de ROADMAP/TODO:**
- **Verificado todo el código** (rutas, admin, SEO, scripts, schema DB, infra) con agente de exploración. Resultado en `ROADMAP.md` (reestructurado con lo real).
- **Bug arreglado**: `createPost` en `src/data/blog-queries.ts` tenía 18 placeholders `?` para 19 columnas → el test `queries.test.ts:115` fallaba y crear/editar posts desde admin crasheaba. Añadido el `?` que faltaba. `npm test` → 14/14 ✅.
- **Correcciones en docs**: `votes`/`favorites` no son tablas (contadores en `deals` + localStorage); comparador multi-tienda y tests ya existían (el ROADMAP los marcaba NO INICIADO); newsletter tiene backend pero falta `RESEND_API_KEY` + cron; producción = Turso.
- **29 scripts one-off movidos a `scripts/_archive/`** (batch*/check*/update*/content/sombrero/test-stealth/fetch-images/clean-orphans/prioritize/add-decathlon/scrape-decathlon-full/etc.).
- **Categorías con filtros SEO** (sesión anterior, pendiente de commit): `src/lib/seo/category-content.ts` + `src/app/categories/[slug]/page.tsx` + `[sub]/page.tsx` (filtro precio, chips activos, FAQ JSON-LD, interlinking blog, force-dynamic).

### Sesión anterior (1 Ago 2026)

**Recuperación del deploy de chollos (producción = Turso):**
- **Diagnóstico**: el "deploy fallido" era un problema de datos, no de build. Producción (Vercel) lee **Turso** (`TURSO_DATABASE_URL`), pero el sync solo se había ejecutado contra la DB local. En Turso había 130 deals con solo 21 publicados; los 12 chollos del 31-jul y otros nunca llegaron.
- **Nuevos scripts**:
  - `scripts/sync-prod.ts` (`npm run sync:prod`) — `runSync()` contra Turso (Sheet → Turso).
  - `scripts/publish-to-prod.ts` (`npm run publish:prod`, dry-run por defecto, `--apply` aplica) — marca drafts de Turso como published matcheando por productId+storeId → slug → título normalizado+Jaccard.
  - Ambos cargan `.env.vercel` con merge que **no machaca valores no vacíos** de `.env` (`.env.vercel` tiene `GOOGLE_SHEET_CSV_URL=""` vacío).
- **Fix bug en `src/lib/db.ts`**: `TURSO_URL`/`TURSO_TOKEN` se capturaban a nivel de módulo → los scripts que cargan env después del import creaban el cliente **local** aunque `process.env.TURSO_DATABASE_URL` estuviera seteado. Ahora `createDbClient()` lee env en tiempo de llamada.
- **Resultado**: Turso pasó de 21 → **47 deals publicados** (33 decathlon + 13 amazon + 1 aliexpress) = los 46 de local + 1 extra preexistente. `www.pescatch.es/api/deals` devuelve 47.
- **Errores de sync conocidos (no bloqueantes)**: 2 EAN de 12 dígitos (Stradic FL 2500, Penn Spinfisher VI 5500) + 3 UNIQUE slug (Phishger, Rapala D Magnum Whu, BEUCHAT Sirocco — ya existen en Turso).
- **Verificado**: build + lint OK. Scripts `_debug-*.ts` temporales borrados.

### Sesión anterior (31 Jul 2026)

**Descubrimiento de chollos + fixes de pipeline:**
- **`npm run discover:auto`**: 50 candidatos → limpiados a 13 buenos (rechazados 27 corruptos/duplicados, quedaron 10 de nicho como rejected).
- **13 chollos añadidos al Google Sheet y publicados en la web** (Decathlon 12 + Amazon 1): Shimano Nasci 2500 HG (94,99→109,99), Pantalón Vadeo 900 (89,99→119,99), Trenza Pex8 (13,99→19,99), Kit Lucio Box (18,99→34,99), Guante 500, LAKESIDE-5, Minnow Trucha, Botón Freno Casting, Bobina Bauxit, Placa Espuma, Tenya 30g/60g, kit 358 plomos Amazon. Total deals publicados: 34→46 (Decathlon 32, Amazon 13, AliExpress 1).
- **Fix bug**: `/api/admin/candidates` solo añadía al Sheet candidatos con `asin` (Amazon). Ahora detecta la tienda por URL (`decathlon`/`aliexpress`/`amazon`) y mapea columnas `*Price`/`*Url`/`*Stock`/`*OriginalPrice` correctamente.
- **Fix bug**: `reader-sheets.ts` no convertía `*OriginalPrice` a número (con coma decimal) → validación fallaba para Decathlon; y no filtraba filas vacías del Sheet (56 filas "undefined"). Ahora sí.
- **Fix bug**: `ensureHeaders` en `google-sheets-client.ts` crasheaba al añadir columnas más allá de Z (col 26). Ahora expande el grid de la hoja con `batchUpdate` antes de escribir (`pros`/`cons` añadidas al Sheet).
- **Sheet**: columna `ean` del kit de plomos Amazon contenía el ASIN (B0G1G79PZM, no EAN) — limpiado.
- **Sync**: 1 creado + 10 creados/actualizados. Quedan 2 errores preexistentes ajenos: EAN de 12 dígitos en `Carrete Shimano Stradic FL 2500` y `Carrete Penn Spinfisher VI 5500` (filas F5/F8 del Sheet, no tocadas).

### Sesión anterior (30-31 Jul)

Normalización de categorías + matching multi-tienda:
- **Nuevo** `src/lib/normalize-category.ts` — `normalizeCategory()` (minúsculas + sin acentos + Levenshtein vs nombres canónicos, fallback `accesorios`) y `normalizeSubcategory()`.
- **Fix bug**: la DB tenía categorías mixtas (`Cañas`, `Ca�as`, `canas`...) y `/categories/canas` perdía ~la mitad de deals. Ahora migración en `migrateSchema()` normaliza deals+products, y `buildWhereClause` usa `LOWER()`+param normalizado. Verificado: `canas` 5→12, `carretes` 4+10→14.
- **`categorizer.ts`** devuelve slugs canónicos; **`run-sync.ts`** normaliza antes de validar/escribir; **`findFuzzyMatch`** ya no depende de categoría exacta (busca en todos los products + bonus si categoría coincide).
- **Nuevo** `scripts/match-deals-to-products.ts` + `npm run match-products` — linkea deals del mismo producto en distintas tiendas por similitud (umbral 0.85). Con la DB actual no cambió nada (los 5 grupos ya compartían productId); sirve para futuros syncs.

Fix admin dashboard 500, limpieza lint, import dinámico de Playwright, actualización de URLs y precios.

Resumen rápido de cambios:
- **Fix admin dashboard 500**: error boundary, force-dynamic, safe JSON parse en `getLastSync()`, try-catch wrapper
- **Fix dynamic import**: `scrapeAmazonDetails` ahora es import dinámico para evitar Playwright en el bundle del server de admin
- **Fix lint (React 19)**: purity de funciones, setState en efectos, tipos `any` reemplazados + cleanup de `_debug/` (archivos de snapshot, YAML, logs de scraper)
- **Nuevo**: `scripts/send-newsletter.ts` — envío de newsletter semanal
- **Nuevo**: `scripts/setup-scheduler.ps1` — programar tareas diarias en Windows
- **Nuevo**: `scripts/clean-expired-deals.ts` — marcar deals expirados automáticamente
- **Nuevo**: `src/app/favoritos/page.tsx` — página de favoritos del usuario
- **Nuevo**: `src/components/deals/deal-cta-button.tsx` — botón CTA con enlace directo a tienda
- **Nuevo**: `src/app/deals.xml/route.ts` — RSS/XML de chollos
- **Fixes**: Decathlon Seacoast URL (delisted → Seacoast 100 350), buildAmazonUrl (`th=1&psc=1`), ASIN Daiwa 4.20m, quitados datos falsos de organizationSchema

### Sesiones anteriores
- **29-30 Jul**: Fix admin dashboard 500, Playwright import, lint cleanup → [[_Sesiones/2026-07-29-admin-fixes]]
- **6 Jul**: UX/SEO overhaul, OG dinámico, paginación, 404, AVIF, blog->deals, code splitting seed URLs reales, precios actualizados → [[_Sesiones/2026-07-06-ux-seo-overhaul]]
- **4-5 Jul**: Brand pages, stars rating, AliExpress scraper, price refresh, newsletter backend, contacto funcional, marcas index, parser marked, categorías filters
- **30 Jun**: Code review completo + refactor masivo (41 issues corregidos)

---

## Warnings de lint (actuales)

```
scripts/sync.ts → STORE_ADAPTERS, db (sin usar — preexistentes)
lib/sync/*-adapter.ts (×3) → _ean sin usar (stubs intencionales)
blog/[slug]/page.tsx → 1 <img> en dangerouslySetInnerHTML (no hay alternativa)
+ varios unused imports preexistentes (product-card, deals/[slug], query-cache, opengraph-image)
```

**21 warnings, todos inevitables/preexistentes.** No introducir nuevos. No reintentar "arreglar" estos 21.

---

## Patrones establecidos (NO cambiar)

1. **Imágenes**: `<Image>` de `next/image` con `fill` + `sizes` + contenedor `relative`. No `<img>`.
2. **Hover**: solo CSS (`hover:`, `group-hover:`). Nunca `onMouseEnter`/`onMouseLeave`.
3. **Navegación**: `router.push()`. Nunca `window.location.href`.
4. **Queries**: batch con `Promise.all` + `WHERE IN (...)`. Nunca `for...of await`.
5. **Auth admin**: `isAdminAuthenticated()` + `adminApiCheck()`. No reinventar.
6. **JSON parse**: `safeJsonParse()` con try-catch. No `JSON.parse()` sin protección.
7. **params es Promise** en Next.js 16 server components → siempre `await params` antes de desestructurar.
8. **Estilos**: `#0B1120` fondo, `#111827` superficie, `#1E3A5F` borde, `#00D4FF` acentos, `#E8F0FE` texto, `#8BA3C7` texto secundario.

---

## Bugs/limitaciones conocidas

- **Producción = Turso** (`TURSO_DATABASE_URL` en `.env.vercel`), no la DB local. `npm run sync` (sin sufijo) escribe en local; `npm run sync:prod` en Turso.
- **`upsertDeal` no toca `status` en UPDATE** (`src/lib/sync/matcher.ts`) → un re-sync no re-publica drafts. Para publicar usar `npm run publish:prod -- --apply`.

- **sync.ts**: `STORE_ADAPTERS` y `db` sin usar (pre-existentes, no tocar)
- **Seed data**: EANs vacíos e imágenes de picsum.photos
- **Tests**: vitest (`npm test`, **160 tests**, DB en memoria aislada). Cobertura de queries, API routes, rate-limit, zod, schemas SEO, blog renderer y telegram. Faltan tests de páginas server (categorías).
- **Store adapters**: amazon/decathlon/aliexpress son stubs sin API keys reales
- **Newsletter**: sin envío automatizado (solo `scripts/send-newsletter.ts` manual). `RESEND_API_KEY` ya configurada (14 Ago); falta el cron (Vercel Cron o Task Scheduler).
- **Scheduler instalado (14 Ago)**: 5 tareas PesCatch en Task Scheduler (CleanExpired 03:00, DiscoverAuto 06:00, RefreshPrices 08:00 `--apply`, PriceAlerts 08:30, Newsletter lun 09:00) — se requiere PowerShell como administrador para re-instalar.
- **EANs de 12 dígitos**: resueltos — el fix RAW mode mantiene los leading zeros (`Stradic FL 2500` = `0022255230759`, `Penn Spinfisher VI 5500` = `0031324038523`).
- **Contacto**: sin rate limiting ni notificación al admin
- **Marcas index**: sin imágenes de marca (solo texto)
- **DNS sin www**: redirección pendiente → SEO split

---

## Próxima sesión — prioridades sugeridas

1. **Añadir secret `CRON_SECRET` al repo de GitHub** — sin él, la Action `cron-refresh-prices` fallará (Settings → Secrets and variables → Actions → New repository secret; valor = el de `.env`).
2. **Validar lunes 31 Ago los envíos desde Vercel** (newsletter + telegram) y, si van bien, desactivar las tareas locales duplicadas: `Disable-ScheduledTask -TaskName PesCatch-Newsletter,PesCatch-Telegram`.
3. **Limpiar los 166 pending_candidates locales** — Turso ya está a 0; el espejo local se quedó atrás (son copias de aprobados/rechazados de rondas anteriores + posibles nuevos del discover de las 06:00).
4. **Tests de páginas server** — Categorías, deals/[slug], sitemap.
5. **Contacto**: notificar al admin por email (hoy solo inserta en tabla).

---

## Archivos clave para orientarse

| Archivo | Qué es |
|---------|--------|
| `src/app/page.tsx` | Homepage (hero, blog, featured, categories, latest) |
| `src/app/blog/[slug]/page.tsx` | Detalle de artículo (parser markdown, product cards, TOC) |
| `src/app/deals/[slug]/page.tsx` | Detalle de chollo (galería, specs, precio histórico, etc.) |
| `src/data/queries.ts` | Todas las queries SQL (deals, products, comments, votes) |
| `src/lib/db.ts` | Schema SQLite + singleton cliente DB |
| `src/lib/run-sync.ts` | Pipeline sync: Google Sheet → DB |
| `src/components/deals/deal-card.tsx` | Tarjeta de chollo (usada en toda la web) |
| `src/app/admin/page.tsx` | Dashboard admin |
| `src/app/sitemap.xml/route.ts` | Sitemap dinámico |
| `src/app/deals.xml/route.ts` | RSS feed de chollos |
| `scripts/discover/auto.ts` | Discover pipeline automático |
| `AGENTS.md` | Convenciones del proyecto (fuente de verdad técnica) |

---

## Comandos

```bash
npm run dev              # Dev server (Turbopack, :3000)
npm run build            # Build + typecheck
npm run lint             # ESLint (0 errores, 21 warnings)
npm test                 # vitest (160 tests, DB en memoria)
npm run sync             # Google Sheet → DB local
npm run sync:prod        # Google Sheet → Turso (producción)
npm run publish:prod     # Dry-run: drafts → published en Turso (--apply ejecuta)
npm run discover:auto    # Búsqueda automática → pending_candidates
npm run refresh-prices   # Actualizar precios desde tiendas
npm run newsletter       # Enviar newsletter semanal (manual, requiere RESEND_API_KEY)
npm run send-telegram    # Publicar top chollos en el canal de Telegram (lun 09:05)
npm run send-price-alerts # Enviar alertas de precio activas (scheduler 08:30)
npm run clean-expired    # Marcar deals expirados
npm run match-products   # Linkear deals multi-tienda por similitud
```
