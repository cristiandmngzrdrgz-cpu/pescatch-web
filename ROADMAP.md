# PesCatch — Roadmap

> Web de chollos de material de pesca. Dominio: `pescatch.es`
> Tech stack: Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + SQLite

---

## Fase 1 — Fundación ✅ (COMPLETADO)

- [x] Proyecto Next.js + TypeScript + Tailwind 4 + shadcn/ui
- [x] Layout: Navbar (navy blur), Footer (navy oscuro), SEO metadata
- [x] SQLite con `@libsql/client`, schema completo (deals, posts, comments, votes, price_history, subscribers, contact_messages, pending_candidates, scraping_health)
- [x] Homepage: Hero gradiente, categorías, destacados, blog, últimos descuentos
- [x] Deal detail: Galería, specs, precio histórico SVG, votación, comentarios, favoritos
- [x] Blog funcional: parser markdown (`marked`), product cards via `<!-- PRODUCTS_DATA -->`, TOC, SEO on-page
- [x] Search: filtros precio/descuento/categoría/tienda, ordenación
- [x] Categories: grid + subcategorías + filtros (nuevo/descuento/precio/popular, tienda, descuento mínimo)
- [x] Admin: Dashboard, CRUD deals/blog, sidebar, auth con `ADMIN_SECRET`
- [x] Diseño visual navy/aqua/gold, diseño responsive
- [x] 111+ productos reales en DB + Google Sheet
- [x] Build 0 errores

## Fase 2 — Pipeline de datos ✅ (COMPLETADO)

- [x] **Validación Zod**: schemas para SyncRow, rechazo de filas inválidas con log
- [x] **Unificar código duplicado**: `src/lib/scraping-utils/` con price-parser, constants, categorizer, browser, filters
- [x] **Enriquecimiento con IA**: Groq API (Llama 3.3 70B) para reviews, pros/cons, specs. Fallback heurístico
- [x] **Matching fuzzy cross-store**: Jaccard similarity, auto-match >85%, sugerencia 70-85%
- [x] **Retry + backoff adaptativo**: exponential backoff, detección de captcha, max 3 reintentos
- [x] **Monitoreo de salud**: tabla `scraping_health`, dashboard `/admin/health`
- [x] **Pipeline semi-automático**: `scripts/discover/auto.ts` → `pending_candidates` → `/admin/candidates` (aprobar/rechazar)

## Fase 3 — UX/SEO (COMPLETADO → parcial)

- [x] OG dinámico por página (img + meta tags)
- [x] Open Graph / Twitter Cards
- [x] Schema.org Product + BlogPosting (básico)
- [x] Breadcrumbs con schema BreadcrumbList
- [x] Páginas de marca (`/marca/[slug]`)
- [x] Marcas index (`/marcas`)
- [x] Stars rating (rating/reviewCount) en cards
- [x] Sitemap dinámico + RSS feed (`/deals.xml`, `/rss.xml`)
- [x] Página 404 personalizada
- [x] AVIF support + code splitting
- [x] UI overhaul: CTAs directos, sticky mobile, trust badges, badges de urgencia
- [x] Newsletter backend (tabla + API + form)
- [x] Contacto funcional (tabla + API + form)
- [x] Favoritos (`/favoritos`)
- [ ] **Schema Product+Offer en fichas** — JSON-LD con precio, disponibilidad, review. Rich snippets en Google. `src/app/deals/[slug]/page.tsx`
- [ ] **Páginas de categoría con filtros** — Mejorar `/categories/[slug]`: H1, descripción SEO, filtros precio/descuento/tienda

## Fase 4 — Engagement (NO INICIADO)

- [ ] **Alertas de precio por email** — Tabla `price_alerts`, endpoint, modal en ficha, script cron
- [ ] **Comparador multi-tienda** — Tabla Amazon/Decathlon/AliExpress en ficha de chollo
- [ ] **Newsletter semanal automatizado** — Script cron, primer digest
- [ ] Bot de Telegram / canal público
- [ ] Tests automatizados (al menos integración)

## Fase 5 — Infraestructura (NO INICIADO)

- [ ] APIs reales (Amazon PA, Decathlon TradeDoubler, AliExpress)
- [ ] Vercel Cron / GH Action para sync diario
- [ ] Google Sheets range dinámico (reemplazar `A1:R100`)
- [ ] Google Search Console configurado
- [ ] DNS sin www: redirección pendiente
- [ ] Analytics (Plausible / GA)

---

## Arquitectura del Proyecto (actualizada)

```
src/
├── app/
│   ├── page.tsx                       # Homepage
│   ├── layout.tsx                     # Root layout (+ Navbar, Footer)
│   ├── globals.css                    # Design tokens Tailwind 4
│   ├── deals/[slug]/page.tsx          # Detalle de chollo
│   ├── deals.xml/route.ts             # RSS feed chollos
│   ├── rss.xml/route.ts               # RSS feed blog
│   ├── sitemap.xml/route.ts           # Sitemap dinámico
│   ├── categories/
│   │   ├── page.tsx                   # Grid categorías
│   │   └── [slug]/
│   │       ├── page.tsx               # Categoría individual
│   │       └── [sub]/page.tsx         # Subcategoría
│   ├── search/page.tsx                # Búsqueda + filtros
│   ├── blog/[slug]/page.tsx           # Artículo blog
│   ├── marca/[slug]/page.tsx          # Página de marca
│   ├── marcas/page.tsx                # Index de marcas
│   ├── favoritos/page.tsx             # Favoritos del usuario
│   ├── contact/page.tsx               # Contacto
│   └── admin/
│       ├── layout.tsx                 # Sidebar admin
│       ├── page.tsx                   # Dashboard
│       ├── error.tsx                  # Error boundary admin
│       ├── health/page.tsx            # Dashboard de salud
│       ├── candidates/page.tsx        # Aprobación candidatos
│       ├── deals/
│       │   ├── page.tsx               # Lista CRUD
│       │   ├── new/page.tsx           # Form nuevo deal
│       │   └── [id]/edit/page.tsx     # Form editar deal
│       └── blog/
│           ├── page.tsx               # Lista CRUD blog
│           ├── new/page.tsx           # Form nuevo post
│           └── [id]/edit/page.tsx     # Form editar post
├── components/
│   ├── layout/
│   │   ├── navbar.tsx                 # Navbar (navy blur)
│   │   └── footer.tsx                 # Footer
│   ├── deals/
│   │   ├── deal-card.tsx              # Card de chollo
│   │   ├── product-card.tsx           # Card multi-tienda
│   │   ├── deal-cta-button.tsx        # Botón CTA directo
│   │   ├── price-history-chart.tsx    # Gráfico SVG inline
│   │   ├── vote-buttons.tsx           # Votación
│   │   ├── comments-section.tsx       # Comentarios
│   │   └── favorites.tsx              # Favoritos
│   ├── admin/                         # Admin components
│   │   └── ProductSelector.tsx        # Selector de productos
│   ├── layout/
│   │   └── newsletter-form.tsx        # Form newsletter
│   ├── search/
│   │   └── search-input.tsx           # Búsqueda header
│   └── ui/                            # shadcn/ui
├── data/
│   ├── queries.ts                     # Queries SQL
│   ├── blog-queries.ts                # Queries blog
│   ├── deals.ts                       # Seed data
│   └── seed.ts                        # Seed automático
├── lib/
│   ├── db.ts                          # Schema + singleton SQLite
│   ├── run-sync.ts                    # Sync pipeline
│   ├── enrich-ai.ts                   # Enriquecimiento IA
│   ├── pending-candidates.ts          # CRUD candidatos
│   ├── scraping-health.ts             # Monitoreo salud
│   ├── amazon-affiliate.ts            # URLs afiliado Amazon
│   ├── sync/
│   │   ├── matcher.ts                 # Match + upsert
│   │   ├── validation.ts             # Zod schemas
│   │   ├── fuzzy-matcher.ts          # Matching fuzzy
│   │   └── *-adapter.ts              # Stubs tienda
│   ├── scraping-utils/
│   │   ├── index.ts                   # Barrel
│   │   ├── price-parser.ts            # parseSpanishPrice
│   │   ├── constants.ts              # Palabras/marcas pesca
│   │   ├── categorizer.ts            # categorizeProduct
│   │   ├── browser.ts                # Brave/Playwright
│   │   ├── filters.ts                # isFishingProduct
│   │   └── retry.ts                  # Retry backoff
│   ├── price-scraper/                # Scrapers refresh
│   └── ai-providers/
│       └── groq.ts                    # Groq API adapter
├── types/index.ts                     # Tipos + categorías + tiendas
└── lib/utils.ts                       # Utilidades
```

---

## Paleta de Colores (Tailwind 4 `@theme inline`)

Definida en `src/app/globals.css`. Referencia rápida:

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
- **Turbopack**: Bundler por defecto (`npm run dev`)
- **SQLite**: `@libsql/client` local (`data/pescatch.db`), sin Turso
- **Auth admin**: `ADMIN_SECRET` en `.env` (cookie, 24h). Sin `ADMIN_SECRET` → acceso libre
- **Seed automático**: `seedDatabase()` en cada query si DB vacía
- **Build**: `npm run build` exitoso, 0 errores, 6 warnings inevitables
