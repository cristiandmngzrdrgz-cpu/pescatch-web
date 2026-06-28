# PesCatch — Roadmap

> Web de chollos de pesca. Dominio: `pescatch.es`
> Tech stack: Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + SQLite

---

## Sprint 1 — MVP Web (COMPLETADO)

Status: ✅ Done

- [x] Proyecto Next.js + TypeScript + Tailwind 4 + shadcn/ui
- [x] Layout: Navbar (navy blur), Footer (navy oscuro), SEO metadata
- [x] Homepage: Hero con gradiente, categorías, destacados, últimos, mayores descuentos
- [x] Deal detail: Galería, specs, precio histórico SVG, votación, comentarios, favoritos
- [x] Search: Filtros por precio/descuento/categoría, ordenación
- [x] Categories: Grid con subcategorías, filtrado por sub
- [x] Admin: Dashboard con stats, CRUD deals (formularios), sidebar
- [x] Diseño visual Open Design: paleta navy/aqua/gold, tipografía, sombras
- [x] 6 chollos de ejemplo con datos realistas
- [x] Build 0 errores

---

## Sprint 1.5 — Pulido Visual (EN PROGRESO)

- [ ] Unificar diseño navy/aqua en deal detail page (página más compleja)
- [ ] Unificar diseño en categories + subcategories pages
- [ ] Unificar diseño en search page
- [ ] Unificar diseño en admin panel (dashboard, tabla deals, formularios)
- [ ] Añadir animaciones sutiles (hover lift, fade-in, scroll reveal)
- [ ] Responsive: probar en móvil todas las páginas
- [ ] Dark mode toggle funcional

---

## Sprint 2 — Datos Reales (PENDIENTE)

- [ ] Wire up SQLite con better-sqlite3 para persistencia real
  - [ ] Schema: deals, stores, categories, price_history, votes, comments
  - [ ] API routes para CRUD desde admin
  - [ ] Migrar datos de ejemplo de /src/data/deals.ts a SQLite
- [ ] Admin: guardar deals reales (no simulación)
- [ ] Admin: upload imágenes (o URL externa)
- [ ] Sistema de verificación de precio mínimo (≥15% descuento)

---

## Sprint 3 — Scraping y Automatización (PENDIENTE)

- [ ] Scraper para Amazon.es (productos de pesca)
- [ ] Scraper para AliExpress (categoría fishing)
- [ ] Scraper para Decathlon.es (sección pesca)
- [ ] Job scheduler para ejecutar scrapers periódicamente
- [ ] Detección automática de chollos (precio < media - 15%)
- [ ] Pipeline: scrape → verificar → publicar (con revisión manual opcional)

---

## Sprint 4 — Afiliados y Monetización (PENDIENTE)

- [ ] Registro en Amazon Associates España
- [ ] Registro en AliExpress Affiliate (o Admitad)
- [ ] Registro en Awin para Decathlon
- [ ] Sistema de enlaces de afiliado con tracking
- [ ] Disclaimer legal en footer y páginas de deal
- [ ] Cumplimiento GDPR / cookies

---

## Sprint 5 — Engagement y Notificaciones (PENDIENTE)

- [ ] Bot de Telegram: notificar nuevos chollos a suscriptores
- [ ] Canal de Telegram público con ofertas diarias
- [ ] Newsletter email (integración gratuita: Resend, Brevo)
- [ ] RSS feed de chollos
- [ ] Compartir en redes sociales (Twitter/X, WhatsApp)

---

## Sprint 6 — Deploy y Dominio (PENDIENTE)

- [ ] Registrar dominio `pescatch.es` (DonDominio ~4.95€/año)
- [ ] Plan alternativo: `pescatch.com` si .es no está disponible
- [ ] Deploy a Vercel (Hobby tier, gratuito)
- [ ] Configurar DNS (dominio → Vercel)
- [ ] SSL automático con Vercel
- [ ] Google Analytics o Plausible (métricas tráfico)
- [ ] Search Console de Google (indexación)

---

## Sprint 7 — Crecimiento (PENDIENTE)

- [ ] SEO: sitemap.xml, meta tags optimizadas, structured data (Product schema)
- [ ] Blog de pesca integrado (MDX o CMS ligero)
- [ ] PWA: manifest.json, service worker, instalable en móvil
- [ ] App móvil con React Native / Expo (o PWA first)
- [ ] Comunidad: perfiles de usuario, guardar favoritos en DB
- [ ] Alertas personalizadas: "avísame cuando baje el precio de X"

---

## Arquitectura del Proyecto

```
src/
├── app/
│   ├── page.tsx                       # Homepage
│   ├── layout.tsx                     # Root layout (+ Navbar, Footer)
│   ├── globals.css                    # Design tokens Tailwind 4
│   ├── deals/[slug]/page.tsx          # Detalle de chollo
│   ├── categories/
│   │   ├── page.tsx                   # Grid categorías
│   │   └── [slug]/
│   │       ├── page.tsx               # Categoría individual
│   │       └── [sub]/page.tsx         # Subcategoría
│   ├── search/page.tsx                # Búsqueda + filtros
│   └── admin/
│       ├── layout.tsx                 # Sidebar admin
│       ├── page.tsx                   # Dashboard
│       └── deals/
│           ├── page.tsx               # Lista CRUD
│           ├── new/page.tsx           # Form nuevo deal (cliente)
│           └── [id]/edit/page.tsx     # Form editar deal (cliente)
├── components/
│   ├── layout/
│   │   ├── navbar.tsx                 # Navbar (navy blur)
│   │   └── footer.tsx                 # Footer (navy dark)
│   ├── deals/
│   │   ├── deal-card.tsx              # Card de chollo
│   │   ├── price-history-chart.tsx    # Gráfico SVG inline
│   │   ├── vote-buttons.tsx           # Votación (localStorage)
│   │   ├── comments-section.tsx       # Comentarios
│   │   └── favorites.tsx              # Favoritos (localStorage)
│   └── ui/                            # shadcn/ui components
├── data/
│   ├── deals.ts                       # Datos ejemplo (migrar a SQLite)
│   └── queries.ts                     # Queries con filtros/sort
├── types/index.ts                     # Tipos + categorías + tiendas
└── lib/utils.ts                       # cn(), formatPrice(), etc.
```

---

## Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `--navy-900` | `#0F1B2D` | Footer bg |
| `--navy-700` | `#1B2A4A` | Navbar bg |
| `--navy-600` | `#1E3A5F` | Gradiente hero |
| `--navy-50` | `#E8EEF6` | Iconos categorías |
| `--aqua-500` | `#0D9488` | Botones CTA, precios |
| `--aqua-400` | `#14B8A6` | Acentos, hover |
| `--aqua-200` | `#5EEAD4` | Gradiente hero title |
| `--aqua-50` | `#E6FFFA` | Bg hover categorías |
| `--gold-500` | `#F59E0B` | Badges descuento |
| White | `#F8FAFC` | Bg principal |

---

## Notas Técnicas

- **Next.js 16**: `params` es Promise en server components → hay que usar `await`
- **Tailwind 4**: Sin `tailwind.config.ts`, config en `@theme inline` del CSS
- **Turbopack**: Bundler por defecto, configurar `turbopack.root` en next.config.ts
- **Open Design**: Daemon en `http://127.0.0.1:53503`. MCP tools requieren reiniciar opencode tras cambio de config
- **Build**: `npm run build` exitoso, 0 errores
