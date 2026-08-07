# PesCatch — Roadmap

> Web de chollos de material de pesca. Dominio: `pescatch.es`
> Tech stack: Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + SQLite/Turso
> **Última actualización:** 2026-08-02 (revisión completa del proyecto)

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

- [ ] **Alertas de precio por email (usuario)** — Base parcial: flag `deals.priceAlert` + email al admin cuando hay bajadas. Falta: tabla `price_alerts`, endpoint suscripción, modal en ficha, script cron. *(parcial en `refresh-all.ts` + `email.ts`)*
- [ ] **Newsletter semanal automatizado** — Backend completo; falta `RESEND_API_KEY` en env + cron. Hoy el envío es manual (`npm run newsletter`) y no operativo sin API key
- [ ] Bot de Telegram / canal público
- [ ] Tests: ampliar cobertura (hoy hay vitest + `src/__tests__/queries.test.ts`, 14 tests)

## Fase 5 — Infraestructura (EN CURSO)

- [ ] **Vercel Cron / GH Action** para sync diario — Hoy solo Windows Task Scheduler local (`scripts/setup-scheduler.ps1`: discover/refresh-prices/clean-expired)
- [ ] **APIs reales de tiendas** — Amazon PA, Decathlon TradeDoubler, AliExpress. Los adapters son stubs (sin API keys configuradas)
- [ ] Google Sheets range dinámico (reemplazar `A1:R100` hardcodeado)
- [x] DNS canónico: `pescatch.es` → `www.pescatch.es` (308); `BASE_URL` ya apunta a www
- [ ] Newsletter cron en Vercel

---

## Correcciones de la revisión (Ago 2026)

- **Tablas `votes` y `favorites` NO existen**: los votos son contadores `votesUp/votesDown` en `deals`; los favoritos son solo localStorage. (El ROADMAP anterior las listaba)
- **Producción = Turso** (`TURSO_DATABASE_URL` en `.env.vercel`), no SQLite local. `db.ts` lee env en tiempo de llamada.
- **Tests**: ya existen (vitest, 14 tests). Uno fallaba por bug `createPost` (18 placeholders/19 columnas) — **arreglado Ago 2026**.
- **Scripts one-off** (~29) movidos a `scripts/_archive/` (batch*/check*/update*/content/sombrero/test-stealth/etc.)

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
- **Verificación**: `npm run build` + `npm run lint` (0 errores, 6 warnings inevitables) + `npm test` (14 tests)
