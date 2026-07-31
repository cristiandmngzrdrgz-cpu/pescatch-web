---
tags: [vault/brain, vault/onboarding]
fecha: 2026-07-30
---

# Estado actual del proyecto

> Lee esto al empezar cualquier sesión. Es el "cerebro" del agente.

---

## Lo último que se hizo (31 Jul 2026)

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
```

**6 warnings, todos inevitables.** No introducir nuevos. No reintentar "arreglar" estos 6.

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

- **sync.ts**: `STORE_ADAPTERS` y `db` sin usar (pre-existentes, no tocar)
- **Seed data**: EANs vacíos e imágenes de picsum.photos
- **A1:R100**: hardcodeado en Google Sheets client — trunca a 18 columnas y 100 filas
- **Tests**: no hay tests automatizados (pendiente)
- **Sheet con EANs de 12 dígitos**: `Carrete Shimano Stradic FL 2500` y `Carrete Penn Spinfisher VI 5500` (filas F5/F8) fallan validación en cada sync — corregir EAN en el Sheet
- **Store adapters**: amazon/decathlon/aliexpress son stubs sin API keys reales
- **Newsletter**: sin envío automatizado aún (solo `scripts/send-newsletter.ts` manual)
- **Contacto**: sin rate limiting ni notificación al admin
- **Marcas index**: sin imágenes de marca (solo texto)
- **DNS sin www**: redirección pendiente → SEO split

---

## Próxima sesión — prioridades sugeridas

1. **Schema Product+Offer en fichas** — JSON-LD con precio, disponibilidad, review para rich snippets. `src/app/deals/[slug]/page.tsx`
2. **Páginas de categoría con filtros** — Mejorar `/categories/[slug]`: H1 SEO, descripción, filtros precio/descuento/tienda
3. **Alertas de precio por email** — Tabla `price_alerts`, endpoint, modal en ficha, script cron
4. **Comparador multi-tienda** — Tabla Amazon/Decathlon/AliExpress en ficha de chollo
5. **Vercel Cron / GH Action** — Sync diario automático
6. **Tests automatizados** — Al menos integración para queries.ts y API routes

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
npm run lint             # ESLint (0 errores, 6 warnings)
npm run sync             # Google Sheet → DB
npm run discover:auto    # Búsqueda automática → pending_candidates
npm run refresh-prices   # Actualizar precios desde tiendas
npm run send-newsletter  # Enviar newsletter semanal
npm run clean-expired    # Marcar deals expirados
```
