# PesCatch — Roadmap

> Web de chollos de material de pesca. Dominio: `pescatch.es`
> Tech stack: Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + SQLite/Turso
> **Última actualización:** 2026-10-24

---

## Fase 1 — Fundación ✅ (COMPLETADO)

- [x] Proyecto Next.js + TypeScript + Tailwind 4 + shadcn/ui
- [x] Layout: Navbar (navy blur), Footer (navy oscuro), SEO metadata
- [x] SQLite/Turso con `@libsql/client`, schema completo (deals, products, posts, comments, price_history, subscribers, contact_messages, pending_candidates, scraping_health, rate_limits, sync_log)
- [x] Homepage: Hero gradiente, categorías, destacados, blog, últimos descuentos
- [x] Deal detail: Galería, specs, precio histórico SVG, votación, comentarios, favoritos, comparador multi-tienda
- [x] Blog funcional: parser markdown (`marked`), product cards via `<!-- PRODUCTS_DATA -->`, TOC, SEO on-page
- [x] Search: filtros precio/descuento/categoría/tienda, ordenación
- [x] Categories: grid + subcategorías + filtros (nuevo/descuento/precio/popular, tienda, descuento mínimo, rango de precio)
- [x] Admin: Dashboard, CRUD deals/blog, sidebar, auth con `ADMIN_SECRET`
- [x] Diseño visual navy/aqua/gold, diseño responsive

## Fase 2 — Pipeline de datos ✅ (COMPLETADO)

- [x] **Validación Zod**: schemas para SyncRow, rechazo de filas inválidas con log
- [x] **Unificar código duplicado**: `src/lib/scraping-utils/` con price-parser, constants, categorizer, browser, filters
- [x] **Enriquecimiento con IA**: Groq API (Llama 3.3 70B) para reviews, pros/cons, specs. Fallback heurístico
- [x] **Matching fuzzy cross-store**: Jaccard similarity, auto-match >85%, sugerencia 70-85%
- [x] **Retry + backoff adaptativo**: exponential backoff, detección de captcha, max 3 reintentos
- [x] **Monitoreo de salud**: tabla `scraping_health`, dashboard `/admin/health`
- [x] **Pipeline semi-automático**: `scripts/discover/auto.ts` → `pending_candidates` → `/admin/candidates` (aprobar/rechazar)
- [x] **Sync multi-entorno**: `npm run sync` (local) / `sync:prod` (Turso) + `publish:prod` (drafts → published en Turso)
- [x] **Normalización de categorías**: `normalize-category.ts`, migración, matching multi-tienda por productId

## Fase 3 — UX/SEO ✅ (COMPLETADO)

- [x] OG dinámico por página (img + meta tags)
- [x] Open Graph / Twitter Cards
- [x] Schema.org Product+Offer JSON-LD (precio, disponibilidad, review, shipping, returns, priceValidUntil)
- [x] Breadcrumbs con schema BreadcrumbList (+ @id conectado con ItemPage)
- [x] Páginas de marca (`/marca/[slug]`)
- [x] Marcas index (`/marcas`)
- [x] Stars rating (rating/reviewCount) en cards
- [x] Sitemap dinámico + RSS feed (`/deals.xml`, `/rss.xml`)
- [x] Página 404 personalizada
- [x] AVIF support + code splitting
- [x] UI overhaul: CTAs directos, sticky mobile, trust badges, badges de urgencia
- [x] Newsletter backend (tabla + API + form en footer)
- [x] Contacto funcional (tabla + API + form)
- [x] Favoritos (`/favoritos`)
- [x] Categorías con filtros SEO (H1, intro + FAQ con FAQPage JSON-LD, filtros precio/descuento/tienda, chips activos, interlinking a blog)
- [x] Comparador multi-tienda (PriceComparison en ficha, agrupación por productId)
- [x] Analytics (`@vercel/analytics`) + Google Search Console verification

## Fase 4 — Engagement (EN CURSO)

- [x] **Alertas de precio por email (usuario)** — Tabla `price_alerts`, endpoint suscripción/cancelación, modal en ficha, `processPriceAlerts()` one-shot, script `send-price-alerts` + scheduler 08:30. 14 tests. *(14 Ago 2026, commit `fd99b52`)*
- [x] **Newsletter semanal automatizado** — Backend completo y `RESEND_API_KEY` ya configurada; falta el cron (manual hoy: `npx tsx scripts/send-newsletter.ts`)
- [x] **Bot de Telegram / canal público** — `src/lib/telegram.ts` + `scripts/send-telegram.ts` (`npm run send-telegram`), link en footer + newsletter, tarea `PesCatch-Telegram` (lun 09:05), 4 tests. Primer envío real publicado en el canal. *(18 Ago 2026)*
- [x] **Tests: ampliar cobertura** — vitest con DB en memoria (`file::memory:`), 177 tests: queries CRUD, API routes (newsletter/contact/vote/comments/deals/posts/admin/sync/price-alerts/**cron**), candidates, rate-limit, validación zod, schemas SEO, blog renderer, telegram *(24 Ago 2026)*

## Fase 5 — Infraestructura (COMPLETADO 24 Ago 2026)

- [x] **Crons en producción** — 5 crons diarios en `vercel.json` (sync/clean-expired/price-alerts/newsletter/telegram, horas UTC, auth Bearer CRON_SECRET) + GitHub Action horaria `.github/workflows/cron-refresh-prices.yml` para el refresh por chunks (~20 deals/invocación, cursor en tabla `cron_state`). Vercel Hobby solo permite frecuencia diaria. Env vars de producción completas (CRON_SECRET, GOOGLE_SHEETS_CREDENTIALS, RESEND_*, TELEGRAM_*). *(24 Ago 2026)*
- [x] **APIs reales de tiendas** — AliExpress vía API de afiliados (TOP, firma MD5), Amazon fetch directo con `?tag=`. Decathlon eliminado del proyecto (sin afiliado; purga de datos 24 Ago 2026).
- [x] Google Sheets range dinámico — `RANGE = SHEET_NAME` (sin `A1:R100` hardcodeado) + `ensureHeaders` expande grid más allá de la col Z
- [x] DNS canónico: `pescatch.es` → `www.pescatch.es` (308); `BASE_URL` ya apunta a www

---

## Correcciones de la revisión (Ago 2026)

- **Tablas `votes` y `favorites` NO existen**: los votos son contadores `votesUp/votesDown` en `deals`; los favoritos son solo localStorage. (El ROADMAP anterior las listaba)
- **Producción = Turso** (`TURSO_DATABASE_URL` en `.env.vercel`), no SQLite local. `db.ts` lee env en tiempo de llamada.
- **Tests**: ya existen (vitest, 14 tests). Uno fallaba por bug `createPost` (18 placeholders/19 columnas) — **arreglado Ago 2026**.
- **Scripts one-off** (~29) movidos a `scripts/_archive/` (batch*/check*/update*/content/sombrero/test-stealth/etc.)

## Agosto 2026 — Monetización + SEO

- **Bot de Telegram (18 Ago 2026)**: `src/lib/telegram.ts` (`buildTelegramMessage` con HTML válido de la Bot API + `sendTelegramMessage`), `scripts/send-telegram.ts` (`npm run send-telegram`, top 10 chollos por descuento), link al canal `t.me/pescatch` en footer y newsletter, tarea `PesCatch-Telegram` (lun 09:05) en `setup-scheduler.ps1`, 4 tests. **Primer envío real publicado en el canal ✅** (config `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHANNEL_ID` en `.env`).
- **Refactor blog (18 Ago 2026)**: lógica de render extraída de `blog/[slug]/page.tsx` a `src/lib/blog-renderer.ts` (extractProducts/extractFAQs/extractToc/mdToHtml/bestStoreUrl/badges) + 13 tests de renderer y 48 tests de schemas SEO (`seo.test.ts`). Lint baja a 20 warnings.
- **Refresh AliExpress solo API (18 Ago 2026)**: eliminado el fallback con navegador Brave en `price-scraper/index.ts` (AliExpress bloquea con captcha); la API de afiliados es la única vía (con gate ±15%).
- **Monetización completada (A/B/D)**: `trackDealClick` en comparador (`price-comparison.tsx`), auto-cálculo de `commission` en `matcher.ts` (INSERT+UPDATE, `salePrice × commissionRate`), `resolveProductIdFromUrl` en `aliexpress-api.ts` (resuelve `s.click` → PID por redirect, usado por `aliexpress-adapter.ts`). Commit `bd45e59`.
- **Newsletter**: `.env` documentado con pasos Resend (`RESEND_API_KEY`/`ADMIN_EMAIL`/`EMAIL_FROM` descomentables). **14 Ago 2026**: `RESEND_API_KEY` activada (dominio `pescatch.es` verificado), email de test enviado con éxito. Newsletter y alertas de precio operativos (falta solo el cron de newsletter).
- **Alertas de precio por email (usuario)** (14 Ago 2026, `fd99b52`): tabla `price_alerts`, `POST /api/price-alerts` + `GET /api/price-alerts/unsubscribe`, modal "Avísame si baja de precio" en la ficha, `processPriceAlerts()` one-shot con `buildPriceAlertHtml`, script `npm run send-price-alerts` + tarea `PesCatch-PriceAlerts` 08:30. 112 tests.
- **Blog `mejores-senuelos-spinning-2026`**: "Los mejores señuelos de spinning de 2026" — 7 productos con precio verificado (Amazon/Decathlon/AliExpress) enlazados a deals reales de la web.
- **CTA de compra global en blog**: cada `<!--PRODUCT_IMG:N-->` renderiza bloque con botón "Comprar · precio" (mejor tienda, `?tag=` en Amazon) + "Ver en PesCatch" + alternativas. Aplica a todos los posts.
- **Páginas SEO nuevas**: `/top-chollos` (mayores descuentos + más votados) y `/chollos-hoy` (publicados hoy), con JSON-LD CollectionPage/Breadcrumb/FAQ, sitemap y enlaces en navbar/footer.

## Septiembre 2026 — Mantenimiento + fix discover

- **Backlog 04 Sep 2026**: 53 `pending_candidates` locales auditados → 51 rechazados (0 reviews / fake rating 100→5.0 con 0 reviews, Sougayilang genéricos, perillas/cabezal corte junk, duplicados x2-x4), 1 duplicado de deal existente, 1 aprobado espejado. Local: 0 pending (783 rejected, 13 approved). Turso 0 pending. Backlog liquidado.
- **Fix `scoreCandidate` (04 Sep, `auto.ts`)**: `rating 0 reviews` ya no puntúa (fake AE 5.0/0), `reviews<10` half-rating, descuento >80% cap 10pts (evita inflado 94% de AE). Evita que futuros `discover:auto` generen 50 junk con score 85.
- **Verificación 04 Sep**: `clean-expired` 0 expirados, `build` OK, `lint` 22 warnings, `test` 175/177 (2 flaky timeout preexistentes), `sync_log` Turso 04 Sep 06:10 OK (283 filas, 0 creados, 281 actualizados).
- **Backlog 07 Sep 2026**: 43 pending (score 30-49, 40/43 brand fake `€`/`:`/`null`, consumibles plomos/anzuelos) + 31 approved legacy (11 Sougayilang fake 100/0 + 20 duplicados low-score) → rechazados → `rejected=925, pending=0, approved=0`. Turso `push-candidates` 0 inserts.
- **Blindaje discover 07 Sep**: `scripts/discover/auto.ts` + `auto-amazon.ts` → `isFakeBrand()` + `isValidForSave(reviews>=10 && score>=50 && !fakeBrand && 5€≤price≤600€)`; `scoreCandidate` penaliza fake -20; pool: `curated>=3` → premium, `valid>=5` → válido, `valid>0` → solo válidos, `0 válidos→0 guardados` (no rellena con junk). `robots.txt` añade `rss.xml`/`deals.xml` sitemaps.
- **Verificación 07 Sep**: `build` 81s OK, `lint` 22 warnings 0 errores, `test` 177/177 ✓.
- **Mantenimiento 14 Sep 2026**: `clean-expired` 0, `refresh-prices:prod --apply` 120 updated/31 failed/0 removed (131 pushes Turso), `sync --no-enrich` 294 rows 2 created 292 updated **0 errores** (fix slug UNIQUE `matcher.ts:132-186` check determinístico `-${storeId}` antes de INSERT/UPDATE + fallback random; antes 2 errores/sync Sienna/Stradic). `build` 117s OK 48/48, `lint` 22 warnings, `test` 175/177 (2 flaky preexistentes). TODO 9/9 100% + pendientes 0.
- **Mantenimiento 17 Sep 2026**: `clean-expired` 0, `sync --no-enrich` 319 rows 2 creados 317 updated 0 errores (207s), `backup-db` 4.33MB, `candidates` 24 pending → 0 pending (24 rechazados: 17 ya en deals + 7 duplicados approved; blindaje `isFakeBrand`/`isValidForSave` OK, 0 fake brand), `approved` 25 → 8 tras purgar 17 dups vs deals (quedan B00KM587HQ/B01MFH2JAH/B0CH16WSLM/B08NK1HGQ4/B07N6JS8GJ/B0CMV4TB3R/HMR2/RJB7, score 71-81), `pending 0 / approved 8 / rejected 1026`. `refresh-prices` **133 updated / 33 failed / 0 removed + 9 priceAlert** (price_history 12358, `TURSO push-prices --apply` 0 pendientes — ya sincronizado), Blog `_Blog/` archivado: cajas 5955 == DB (publicado 10 Sep), fluoro fake B0XXXXX descartado vs DB real 4820 (4 prod B0H1R9TZLT etc). `build` 49/49 OK, `lint` 22 warnings, `test` 175/177 (2 flaky api-admin-sync/cron).
- **Mantenimiento 18 Sep 2026**: `push` 2 commits (ropa fix + mantenimiento 17 Sep), `candidates` 19 pending + 8 approved → **13 únicos aprobados** (Shimano Baitrunner 60.49€, Ninja LT 55€, Sweepfire EC 22.91€, Ninja X Feeder 72€ + 9 únicos 22-128€, score 67-81) + 6 dup variantes rechazados → Sheet (13 `appendRow`) + `sync` 332→336 filas (6 creados local / 4 creados Turso) + `publish:prod --apply` 3 drafts→published, Blog **`mejor-ropa-impermeable-pesca-2026`** 5 prendas (Navis 71€, Vadeador 68€, Sombrero 29€, Botas 16€, Guantes 13€) + push a Turso, **AliExpress 4 picks** (JSFUN 14.95€, Cadence Darker 28.88€, Goture Xceed 35.59€, KUAISHA 26.07€) con precio manual verificado (sin inflar tachado) → `sync` 336 filas 6/4 creados → `published 169` (+4, total 173), `pending 0 / approved 25 / rejected 1051`, `price_history 13299`, `backup-db` 2026-09-18, `clean-expired` 0, `build` 49/49 OK (97s), `test` 177/177 ✓, `lint` 22 warnings.
- **Mantenimiento 19 Sep 2026**: `clean-expired` 0, `backup-db` 2026-09-19, `sync --no-enrich` 336 rows 2 creados 334 updated 0 errores (239s, id 72), `scraping_health` 10:17 Amazon 97/0 + AE 45/31, `candidates` 23 pending → 17 dup approved rechazados → **6 pending únicos** (B0CH17B8Z1 60€, B075VCFDKJ 58€, B017M320VO 27€, B0846PNXKM 37€, B0846PLYSZ 39€, B0CSDR4MPC 67€, 70-79) `pending 6 / approved 25 / rejected 1068`, `price_history 13795`, `sitemap` 21 posts OK, `lint` 22 warnings, `test` 177/177 ✓.
- **Monetización B+C 19 Sep 2026** (20€ → objetivo 300-500€/mes): spec `docs/superpowers/specs/2026-09-19-monetizacion-bc-design.md` (B 5-8h + C auto, Vercel solo `AMAZON_PA_TAG` tag-only verificado). **P0 entregado:** `scripts/auto-approve-curated.ts` (4/6 curados auto-aprobados → Sheet: B0CH17B8Z1 60€, B075VCFDKJ 58.85€, B017M320VO 27.9€, B0846PNXKM 37.5€ — `sync` 340 rows local + `sync:prod` 340 Turso), `src/app/api/admin/click-stats` + `deal-view-tracker.tsx` (Turso 4 clicks verificado: 3 AE +1 Amazon), `package.json` script `auto-approve`. **P0.3+P1:** `/admin/monetizacion` CTR/comisión, `AdminSidebar` link, `queries.ts:79` sort `commission DESC` + `types:146`, homepage high-ticket módulo 4 (Stradic 9€ vs kit 0.85€), `search/page.tsx:25` sort comisión, `/telegram` página + CTA `deals/[slug]/page.tsx`. Commits `ef0dfdb` + `60428d6`, `lint` 22w, `test` 177/177. **Pendiente mañana:** blog buyer-intent 1/semana + promo TG 30min + medir CTR.
- **Mantenimiento 28 Sep 2026**: `clean-expired` 0, `backup-db` 2026-09-28, `refresh-prices:prod --apply` **118 updated / 56 failed / 0 removed + 5 priceAlert** (email admin + reset) + push 18 a Turso, `candidates` 32 local + 6 Turso pending → **0 pending** (29 rechazados dups + 4 aprobados: Revros LT 64.50€, Saragosa SW 252.95€, Sahara FJ 86.77€, Triforce Target 39.90€ → Sheet + web), `sync` 362 filas 3 creados 0 errores + `sync:prod` 362 (1 creado) + `publish` 0 pendientes → `published 182` Turso (+1) / 175 local, `pending 0 / approved 165 / rejected 300` Turso, `price_history` local 17454 (+412). Fix ASIN Stradic `B0873PQW96→B07V2PLT9S` (local+Turso; colisionaba con candidata Sienna). Crons Vercel OK (sync 06:11 358 rows 0 err, telegram 09:29, promo 09:58; newsletter sin clave de estado — sin verificar). Sin tareas PesCatch en Programador local. `GROQ_API_KEY` no configurada → enrich con fallback heurístico. `build` 53/53 OK, `lint` 22 warnings, `test` 178/178 ✓. **Pendiente:** blog buyer-intent semanal (mejor carrete <100€) + medir CTR.
- **Mantenimiento 29 Sep 2026**: push 2 commits, `clean-expired` 0, `backup-db` 2026-09-29, `refresh-prices:prod --apply` **121 updated / 54 failed / 0 removed + 5 priceAlert** (push 23 a Turso), `candidates` 26 pending → **25 rechazados + 1 aprobado con incidente y reparación** (fila Sheet duplicada del Legalis sobrescribió el deal local Ninja 23 LT: fila 364 borrada, deal restaurado del backup, PH espurio fuera; Turso intacto 182/42), `sync` 363 + `sync:prod` 363 + `publish` 0, schedulers **bloqueados sin admin** (instalador diario listo en Temp), CTR **8 clicks** (+4, 7/8 AE, referrers chatgpt.com; CTR real en dashboard Vercel), blog **`mejor-carrete-spinning-100-2026` corregido** (Nasci/Nexave con ASINs cruzados → Revros LT 64.50€ + Sahara FJ 86.77€ + push Turso). `build` 53/53 OK, `lint` 22 warnings, `test` 178/178 ✓.
- **Mantenimiento 03 Oct 2026 (prep lunes)**: nube OK (sync diario 362 rows 01/02/03 Oct, promo 02 Oct, cursor refresh 03 Oct), `candidates` 31→0 (30 dups rechazados + Crossfire Spin 40.99€ aprobado → Sheet → `sync`/`sync:prod` 363 + `publish` 0 → Turso `published 178/draft 47`), CTR **10 clicks** (+2, 8/10 AE), cuarentena frenando 9 pendientes (Baitrunner 184€ vs 24€ falso). Blog **`mejor-hilo-trenzado-pesca-2026`** (5 bobinas Kairiki+genérica, push Turso). Newsletter incentive en footer. AdSense/X pendientes del usuario (slots + keys). `backup` 03 Oct, `build` 53/53, `lint` 22w, `test` 183/183 ✓.
- **Mantenimiento 06 Oct 2026 (post-lunes)**: nube OK (sync 02-05 Oct, telegram+promo 05 Oct, cursor refresh 06 Oct; newsletter sin verificar, subs 0), `candidates` 26→0 (25 dups rechazados + MegaForce 58.99€ aprobado → Sheet → `sync`/`sync:prod` 364 + `publish` 0 → Turso `published 179/draft 47`), CTR **10 clicks** (last7 2), `refresh-prices:prod --apply` **112/12/53/0 + 12 cuarentena** (push 119 Turso; BG/Baitrunner/Black Widow frenados), `clean` 0, `backup` 06 Oct, `build` 53/53, `lint` 22w, `test` 183/183 ✓.
- **Blog 06 Oct 2026 (buyer-intent semanal)**: `mejor-cana-spinning-pesca-2026` (Tormentor2 29€ + ORRA −51% + Crossfire + Vengeance + Legalis; 5/5 slugs vs deals, render 200 OK). Tema mochila/caja descartado por duplicado con el post del 17 Sep.
- **Mantenimiento 14 Oct 2026**: nube OK (sync 10-14 Oct, telegram 12 Oct, promo 14 Oct, cursor refresh 14 Oct; newsletter sin verificar, subs 0), `candidates` 35→0 (32 dups rechazados + 3 aprobados high-ticket: Crossfire Surf 150€, Crossfire Spod 109€, Inspira 148€ → Sheet → `sync`/`sync:prod` 367 + `publish` 0 → Turso `published 182/draft 47`), `refresh-prices:prod --apply` **134/1/42/0 + 7 priceAlert** (push 11 Turso; Triforce 49→39.90€, Okuma 37→31.77€, Baitrunner FB 42→66.37€), CTR **12 clicks** (+2, 9/12 AE), `clean` 0, `backup` 14 Oct, `build` 53/53, `lint` 22w, `test` 183/183 ✓.
- **Blog 14 Oct 2026 (buyer-intent semanal)**: `equipo-feeder-barato-2026` (Triforce 39.90€ + Okuma Baitfeeder 31.77€ + Baitrunner ST 66.37€ + cebadores 13.99€ + soporte 16.19€ = equipo 101.85€; 5/5 slugs vs deals, render 200 OK). Push Turso OK (post 28).
- **Plan ingresos 15 Oct + roundup semanal**: `chollos-pesca-semana-42-2026` (HAWKERS −49%, Polaroid −46%, ORRA −37%, MX2 −36%, Xceed/KUAISHA/JSFUN verificados; 10/10 slugs, render 200 OK, post 29). Formato repetible cada jueves.
- **Fase 3 discover 17 Oct 2026**: anti-dup real (`savePendingCandidates`: URL/ASIN en cualquier estado + deals + clones ≥0.85 vs deals activos; re-entrada solo −10%) + catálogo 33→98 keywords (jigging/eging/rockfishing/embarcación/mosca + 20 marcas×2) + bestsellers/novedades por subnodo (10 nodos vía fetch directo, parser nuevo `_cDEzb_` — antes devolvía 0) + rotación (25 keywords + 3 nodos/run, cursores `cron_state`, ciclo ~4 días) + pre-check anti-dup en `auto-approve-curated`. E2E: lote 25/98 → 352 + 120 productos → 24 curados → **4 nuevos** (20 descartados); backlog local 28→8 (20 espejados) → 2 aprobados Sheet (Socorro SW 126.14€, Torium SW 204.90€) + 1 clon rechazado; 5 pending en panel. `test` 188/188, `lint` 22w 0e.
- **Mantenimiento 22 Oct 2026**: `backup` 22 Oct, `clean-expired` 0, `refresh-prices:prod --apply` **102 updated / 13 failed / 0 removed** (Amazon devolvía "no result" en oleadas; el circuit breaker no llegó a disparar) + push 1 a Turso. `candidates` 10 pending → **6** (4 rechazados: duplicado FX XT más caro 30,96€ vs 20,99€, duplicado Okuma Aria, 2 "SHIMANO" sin modelo) en local + Turso. `test` 220/220, `lint` 22w 0e, `build` 53/53.
- **Fix categorías 22 Oct 2026**: `categorizeProduct` evaluaba Carretes primero con `/spin/i` → cualquier caña "Spinning" caía en carretes (27 de 57 fichas de la categoría no eran carretes). Reescrito con normalización de tildes (Aliexpress manda NFD), prioridad ropa→cañas→carretes→señuelos, overrides de accesorios ("grasa para carretes", "estuche", "soporte") y contenedores solo al inicio del título ("combo … + bolsa de transporte" sigue siendo caña). **74 deals reclasificados** (17 carretes→cañas, 14 accesorios→carretes, 11 carretes→accesorios…), **207 filas del Sheet normalizadas** (había categorías sueltas: "Feeder", "Carretes", "Cañas", "Spinning" → el sync las volvía accesorios) y **70 deals + productos en Turso** (los IDs de Turso son distintos a local: el emparejamiento va por slug). Script idempotente `scripts/fix-categories.ts` (local + Sheet + Turso, reintenta 429 de Sheets) + 6 tests nuevos en `src/__tests__/categorizer.test.ts`. Distribución final: canas 57 / accesorios 49 / carretes 38 / senuelos 33 / ropa 12 (local).
- **Blog 22 Oct 2026 (roundup semanal)**: `chollos-pesca-semana-43-2026` (post 30) — PENN Surfblaster III 99,99€ −38%, Shimano FX XT 20,99€ −44%, Rapala Original 12,62€ −30%, Mitchell MX1 24,49€ −18% + 4 novedades AliExpress verificadas contra ficha con navegador (Seasir Salminus 41,59€, Seasir Riveria BFS 31,79€, set 8 EGI UV 23,79€, gafas 4 lentes 7,19€). Sin repetir ninguno del roundup 42. FAQ con `###` para que genere FAQPage JSON-LD; `metaTitle` sin "| PesCatch" (lo añade la plantilla). Push a Turso OK, render 200, 16 CTAs. **BrightData 401 (token caducado)**: verificación AE hecha con Playwright.
- **Candidatos + roundup semana 44 (24 Oct 2026)**: 6 pendientes Okuma/Daiwa verificados contra ficha de Amazon (5 aprobados; precios ajustados a céntimo y ratings reales 4,2-4,5★). La Daiwa Exceler 802M se descartó: es variante de un deal ya publicado más barato (Exceler 762L, entonces 47,99€; hoy 67,00€) y su fila se borró del Sheet. Nuevo flag `--ids=` en `auto-approve-curated.ts` para aprobar a mano candidatos con score <75 (salta `isCurated`, mantiene el anti-dup) → Sheet → `sync`/`sync:prod` (5 deals nuevos). **`chollos-pesca-semana-44-2026` en borrador** para publicar el jueves 29 oct: 5 Amazon (23BG SW 194,44€, Convector 158,13€, Prorex X LT 92,41€, Magda Pro 83,17€, Trout Rod 51,41€) + Navis −15% 75,65€ + 2 AE verificados con navegador (Leydun 3,39€, caja 6,19€). Solo 1 tachado real; el resto a 0% declarado. Fix de badges en el post: `green`→`#22C55E` (el sufijo alfa generaba `green30`, CSS inválido). `test` 220/220, `lint` 22w 0e, `build` OK.
- **Cruce de identidad Daiwa corregido (24 Oct 2026)**: en Turso el deal y el producto del Exceler 762L habían quedado con nombre, slug e imagen del "Ninja X Spin" (el sync reutiliza el producto que hace match por nombre y conserva URL/precio del deal Amazon). Causa: el Sheet tenía dos variantes del Ninja X con el **mismo nombre** (2,10 m B01MFH2JAH 39,99€ y 2,70 m B01MQD5MGO 47,99€) y `amazonVariantAsin` puesto solo en algunas filas, así que se fusionaban entre sí y con el Exceler. Arreglo: renombradas las 3 filas del Sheet por variante (`Daiwa Ninja X Spin 2,10 m 10-30 g` / `2,70 m 15-50 g`), Exceler corregido a **67,00€ 0% 4,6★/37** con su imagen real (`41N3TUQwCcL`) en local + Turso, y el sync creó los **2 deals Ninja X** (4,7★/447). Redirect **308** del slug viejo `daiwa-caa-de-pescar-spinning-ninja-x-spin` → `daiwa-ninja-x-spin-270-m-15-50-g` en `next.config.ts` (el slug viejo está indexado). Post borrador de lubina reapuntado al slug nuevo. `test` 220/220, `lint` 22w 0e, `build` OK.
- **Refresh + Socorro/Saragosa (24-26 Oct 2026)**: `refresh-prices:prod --apply` **105 updated / 1 skipped / 16 failed / 0 removed + 2 priceAlert** (Amazon devolvía "no result" en oleadas por ASIN; el circuit breaker de 10 fallos seguidos no disparó) + push **26 deals + 289 price_history** a Turso. Verificados contra ficha: Catana RC 57,00→**22,95€** (−60%), Exceler 47,99→67,00€, Sweepfire EC 25,86→22,91€, 6 señuelos 13,99→12,99€. **Cruce Socorro↔Saragosa corregido**: el deal "Socorro SW" apuntaba al ASIN del Saragosa SW A 8000 HG (`B08DJ9GLK9`, 252,95€) porque el Sheet tenía 4 filas "Shimano Socorro SW" en 2 ASINs; limpieza del Sheet (renombradas por talla `Socorro SW 10000` `B01C7N7G1I` + `Socorro SW 5000` `B01EFNOEAY`, 2 duplicados borrados), deal reapuntado a **118,71€ con tachado real 126,11€ (−6%)**, Saragosa creado a **252,95€ 0%** y Socorro 5000 a 126,14€ 0%, redirect **308** `/deals/shimano-socorro-sw-carrete-de-pesca-de-agua-salada` → `/deals/shimano-socorro-sw-10000`. En Turso se consolidó un Socorro duplicado que generó el sync (slugs de producto divergentes entre local y Turso).
- **Matcher a prueba de variantes (26 Oct 2026)**: el sync fusionaba variantes del mismo modelo (mismo nombre/marca, distinto ASIN) y el deal acababa con el título de una y la URL/precio de otra. Ahora: (1) `matchByAmazonAsin()` en `matcher.ts` — si ya hay un deal Amazon con ese ASIN, ese es el producto, diga lo que diga el nombre; (2) `MIN_NAME_OVERLAP = 0.6` en `fuzzy-matcher.ts` — el bonus de marca (+0,3) y categoría (+0,1) ya no basta para emparejar modelos distintos (Saragosa vs Socorro daba 95% con solo 55% de palabras en común); (3) `amazonAsinConflict()` + guard en `run-sync.ts` — si el producto ya publica otro ASIN, **se omite la fila** (ni fusión ni producto duplicado); (4) `upsertDeal` guarda el ASIN resuelto en `deals.asin` (antes quedaba siempre vacío). **5 tests nuevos** (`sync-asin-guard.test.ts`). Primer sync tras el cambio: 391 filas, 3 deals nuevos legítimos (Saragosa, Socorro 5000, Ninja X Feeder), 32 variantes omitidas, 0 errores. `test` **225/225**, `lint` 22w 0e, `build` OK, redirect 308 verificado con `next start`.
- **Cron de sync muerto → tarea local + roundup 44 (28 Oct 2026)**: commit `584282b` (el fix del matcher del 26-oct estaba sin commitear, así que producción seguía con el matcher viejo). **El cron `/api/cron/sync` de las 06:00 llevaba sin completarse desde el 18-oct**: el sync contra Turso tarda **304 s** incluso con `--no-enrich` y la ruta tiene `maxDuration = 300`, así que la función moría antes de `insertSyncLog` (Turso solo tenía los `sync:prod` manuales de las 23:00). Sustituido por la tarea local `\PesCatch\PesCatch-Sync` (07:00, `scripts/sync-prod.ts --no-enrich`, salida a `logs/sync-prod.log`) y `/api/cron/sync` fuera de `vercel.json` (quedan 5 crons). Primer pase: 391 filas, 7 creados, 31 omitidas por variante, 0 errores. **Roundup semana 44** (`chollos-pesca-semana-44-2026`) con precios del día: Convector **158,13→123,99€** (real, −21% desde la verificación), Magda 83,19€, Trout 51,39€, 8/8 slugs en 200; en borrador con `publishedAt` 29-oct para publicar el jueves. **Candidatos**: 49 pending solo en local (Turso tenía 0) → 2 verificados contra ficha y aprobados al Sheet (PENN Rival Level Wind **107,18€** −3% y Spinfisher VII **139,97€** −18%), descartados como variante el Ninja X 36,99€ y el Spinfisher VII 166,92€; 47 pendientes espejados a Turso para revisar en el panel. El Rival venía con título alemán de la ficha: renombrado en el Sheet (`PENN Rival Level Wind — carrete de arrastre para embarcación y curricán`) y re-sync (slug nuevo, 200 en producción). `refresh-prices:prod --apply` **112 updated / 15 failed / 0 removed** + push 6 deals, `backup` 28-oct, `clean-expired` 0, `publish:prod` 0 pendientes (Turso 203 published / 47 draft), `test` 225/225, `lint` 22w 0e, `build` OK.

- **Descubrimiento y 5 chollos nuevos (28 Oct 2026, tarde)**: segundo `discover:auto` tras arreglar el pool: **418 Amazon + 2.079 AliExpress → 246 válidos → 50 al top → 16 candidatos nuevos** (antes: 0 guardados). Verificados contra ficha y aprobados al Sheet 5: Rapala Fire Minnow 18,03€, PENN Pursuit IV 44,99€, PENN Squall SQL50VSW 321,81€, Abu Garcia MAX X Black Ops **99,99€ −23%** (tachado real 129,99€) y Mitchell Avocet Black **38,81€ −14%** (44,99€); los 5 en producción con 200. El tachado lo da la ficha, no el buscador: el candidato venía a 0% y el sync conserva el `originalPrice` existente, así que hubo que corregir `amazonOriginalPrice` en el Sheet y parchear local antes de re-sincronizar. **Categorías**: los candidatos traían taxonomías del discover ("Marcas", "Embarcación", "Equipo") y los 5 se publicaron en accesorios; arreglado en `savePendingCandidates` con `toSiteCategory()` (+ `/mango\b/` del categorizador marcaba accesorios las cañas con "mango de corcho") y recategorizados los 53 pendientes afectados. **AliExpress sigue bloqueado**: 45 candidatos nuevos en el panel (103 pending en Turso), pero la verificación de precio no se pudo hacer — el WAF `punish` de AE salta también con `fetch` plano y perfil limpio (es la IP, no la automatización), BrightData sigue en 401 y la API de afiliados devuelve **precio de app** (`target_sale_price` == `target_app_sale_price`, sin campo de precio web): medido contra fichas ya verificadas, 60,22€ vs 68,69€ y 65,12€ vs 105,39€ (−12% y −38%), y algunas fichas ni salen (`productos: 0`). Pendiente para mañana: VPN o IP enfriada → `verify-ae` de los 8 finalistas → publicar 3-4. `test` 225/225, `lint` 22w 0e, `build` OK, commits `4f4b19e` + `762bd53`.

---

## Arquitectura del Proyecto (actualizada)

```
src/
├── app/
│   ├── page.tsx                       # Homepage
│   ├── layout.tsx                     # Root layout (+ Navbar, Footer, Analytics, JSON-LD)
│   ├── globals.css                    # Design tokens Tailwind 4
│   ├── deals/[slug]/page.tsx          # Detalle de chollo (comparador, galería, precio histórico)
│   ├── deals.xml/route.ts             # RSS feed chollos
│   ├── rss.xml/route.ts               # RSS feed blog
│   ├── sitemap.xml/route.ts           # Sitemap dinámico
│   ├── categories/
│   │   ├── page.tsx                   # Grid categorías
│   │   └── [slug]/
│   │       ├── page.tsx               # Categoría individual (filtros + SEO + FAQ)
│   │       └── [sub]/page.tsx         # Subcategoría (filtros + paginación)
│   ├── search/page.tsx                # Búsqueda + filtros
│   ├── blog/[slug]/page.tsx           # Artículo blog
│   ├── marca/[slug]/page.tsx          # Página de marca
│   ├── marcas/page.tsx                # Index de marcas
│   ├── favoritos/page.tsx             # Favoritos del usuario
│   ├── contact/page.tsx               # Contacto
│   └── admin/
│       ├── page.tsx                   # Dashboard
│       ├── health/page.tsx            # Dashboard de salud scraping
│       ├── candidates/page.tsx        # Aprobación candidatos
│       ├── deals/ · blog/             # CRUD
│       └── login/page.tsx             # Auth
├── components/
│   ├── layout/ navbar, footer, newsletter-form
│   ├── deals/ deal-card, product-card, deal-cta-button, price-history-chart, vote-buttons, comments-section, price-comparison, favorites
│   ├── search/ search-input, search-pagination, price-range-slider, filter-drawer
│   ├── admin/ ProductSelector
│   └── ui/                            # shadcn/ui
├── data/
│   ├── queries.ts                     # Queries SQL deals/products
│   ├── blog-queries.ts                # Queries blog
│   ├── deals.ts                       # Seed data
│   └── seed.ts                        # Seed automático
├── lib/
│   ├── db.ts                          # Schema + singleton SQLite/Turso
│   ├── run-sync.ts                    # Sync pipeline
│   ├── enrich-ai.ts                   # Enriquecimiento IA
│   ├── pending-candidates.ts          # CRUD candidatos
│   ├── scraping-health.ts             # Monitoreo salud
│   ├── email.ts                       # Email admin (alertas)
│   ├── seo/ schemas.tsx, category-content.ts
│   ├── sync/ matcher, validation, fuzzy-matcher, *-adapter
│   ├── scraping-utils/ price-parser, constants, categorizer, browser, filters, retry
│   ├── price-scraper/                 # Scrapers refresh
│   └── ai-providers/ groq
├── types/index.ts                     # Tipos + categorías + tiendas
└── lib/utils.ts                       # Utilidades
```

---

## Paleta de Colores (Tailwind 4 `@theme inline`)

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-navy-900` | `#0B1120` | Fondo principal |
| `--color-navy-800` | `#111827` | Superficie |
| `--color-navy-700` | `#1A2535` | Superficie elevada |
| `--color-navy-600` | `#1E3A5F` | Bordes |
| `--color-aqua` | `#00D4FF` | Acento principal (CTAs, enlaces) |
| `--color-amber` | `#FFB800` | Badges descuento |
| `--color-green` | `#26DE81` | Ahorro |
| `--color-slate` | `#8BA3C7` | Texto secundario |
| `--color-white` | `#E8F0FE` | Texto principal |

---

## Notas Técnicas

- **Next.js 16**: `params` es Promise en server components → `await params`
- **Tailwind 4**: Sin `tailwind.config.ts`, config en `@theme inline` del CSS. PostCSS plugin: `@tailwindcss/postcss`
- **DB**: `@libsql/client`. Local `data/pescatch.db`; producción Turso (`TURSO_DATABASE_URL`). `db.ts` lee env en tiempo de llamada.
- **Auth admin**: `ADMIN_SECRET` en `.env` (cookie, 24h). Sin `ADMIN_SECRET` → acceso libre
- **Seed automático**: `seedDatabase()` en cada query si DB vacía
- **Verificación**: `npm run build` + `npm run lint` (0 errores, 20 warnings) + `npm test` (160 tests)
- **Tests aislados**: `vitest.config.ts` usa `TURSO_DATABASE_URL=file::memory:` + `setupFiles` limpia tablas transitorias. Nunca tocan `data/pescatch.db`. Cada worker corre con `ADMIN_SECRET=test-admin-secret`.
