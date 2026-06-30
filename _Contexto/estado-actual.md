---
tags: [vault/brain, vault/onboarding]
fecha: 2026-06-30
---

# Estado actual del proyecto

> Lee esto al empezar cualquier sesión. Es el "cerebro" del agente.

---

## Lo último que se hizo (30 Jun 2026)

Code review completo + refactor masivo. **41 issues corregidos** en 6 rondas. Sesión completa en [[Sesiones/2026-06-30-code-review]].

### Nueva investigación (30 Jun 2026)
- **Competidores**: Análisis completo en [[_Investigacion/competidores]]. ChollosPesca.com es el rival directo #1 (9 años, 380+ posts, solo AliExpress). Promopesca.es tiene 400K clientes. Formulapesca.com rankea para nuestras keywords objetivo con contenido mediocre.
- **Palabras clave**: Investigación completada en [[_Investigacion/palabras-clave]]. Prioridad: "chollos pesca amazon" (sin competidor), "comparativa carretes spinning", long-tails de "calidad precio".
- **Diferenciación**: Somos los únicos multi-tienda (Amazon+Decathlon+AliExpress) con formato editorial premium (tablas + scores + FAQ). Nadie más compara precios entre tiendas.

Resumen rápido de cambios:
- Auth admin con `ADMIN_SECRET` + cookie
- DB: `UNIQUE(productId, storeId)`, batch queries, `globalThis` singleton
- Comentarios conectados a DB real + rate limiting
- Votos persistentes en DB
- 11 archivos migrados de `<img>` → `<Image>` de Next.js
- Rediseño visual: tarjetas de blog full-bleed con imagen de fondo
- Error boundaries (`error.tsx`, `not-found.tsx`)
- N+1 queries eliminadas (homepage, categories, price history)
- Sitemap con `<lastmod>` + URLs de blog
- OG images en deals y blog posts
- Newsletter funcional (client form, sin backend)
- SEO: investigación de competidores y keywords completada

---

## Warnings de lint (6 — todos inevitables)

```
scripts/sync.ts → STORE_ADAPTERS, db (sin usar — preexistentes)
lib/sync/*-adapter.ts (×3) → _ean sin usar (stubs intencionales)
blog/[slug]/page.tsx → 1 <img> en dangerouslySetInnerHTML (no hay alternativa)
```

No introducir nuevos warnings. No reintentar "arreglar" estos 6.

---

## Patrones establecidos (NO cambiar)

1. **Imágenes**: usar `<Image>` de `next/image` con `fill` + `sizes` + contenedor `relative`. No volver a `<img>`.
2. **Hover**: solo CSS (`hover:`, `group-hover:`). Nunca `onMouseEnter`/`onMouseLeave`.
3. **Navegación**: `router.push()`. Nunca `window.location.href`.
4. **Queries**: batch con `Promise.all` + `WHERE IN (...)`. Nunca `for...of await`.
5. **Auth admin**: `isAdminAuthenticated()` + `adminApiCheck()`. No reinventar.
6. **JSON parse**: `safeJsonParse()` con try-catch. No `JSON.parse()` sin protección.
7. **Estilos**: consistencia con `#0B1120` fondo, `#111827` superficie, `#1E3A5F` borde, `#00D4FF` acentos, `#E8F0FE` texto, `#8BA3C7` texto secundario.

---

## Bugs/limitaciones conocidas

- **Pendiente**: Migrar parser markdown a `marked` (ya instalado). El actual es frágil con edge cases (links, code blocks).
- **Pendiente**: `sync.ts` tiene `STORE_ADAPTERS` sin usar + `db` sin usar.
- **Pendiente**: Seed data tiene EANs vacíos e imágenes de picsum.photos.
- **Pendiente**: `A1:R100` hardcodeado en Google Sheets client — trunca a 18 columnas y 100 filas.
- **Pendiente**: No hay tests automatizados.
- **Pendiente**: Los adapters de tienda (amazon, decathlon, aliexpress) son stubs — no tienen API keys reales.

---

## Próxima sesión — prioridades sugeridas

1. **Migrar parser markdown a `marked`** (ya instalado) en `blog/[slug]/page.tsx`. Mantener el estilo visual actual (headings con barra gradiente, párrafos con colores). Ver `src/app/blog/[slug]/page.tsx:96-121` para el parser actual.
2. **Tests**: Al menos tests de integración para `queries.ts` y las API routes.
3. **Google Sheets range dinámico**: Cambiar `A1:R100` por rango calculado.
4. **Contenido**: Artículo "Shimano vs Daiwa" (ver `_Blog/ideas.md`).
5. **Redes sociales**: Crear presencia en TikTok/Instagram (ChollosPesca está fuerte ahí).
6. **Vercel Cron**: Configurar sync diario automático.

---

## Archivos clave para orientarse

| Archivo | Qué es |
|---------|--------|
| `src/app/page.tsx` | Homepage (hero, blog, featured, categories, latest) |
| `src/app/blog/[slug]/page.tsx` | Detalle de artículo (parser markdown, product cards, TOC) |
| `src/data/queries.ts` | Todas las queries SQL (deals, products, comments, votes) |
| `src/lib/db.ts` | Schema SQLite + singleton cliente DB |
| `src/lib/sync/matcher.ts` | Pipeline sync: match, upsert, price history |
| `src/components/deals/deal-card.tsx` | Tarjeta de chollo (usada en toda la web) |
| `src/components/deals/comments-section.tsx` | Sección de comentarios (conectada a API) |
| `src/app/sitemap.xml/route.ts` | Sitemap dinámico |
| `src/app/error.tsx` | Error boundary global |
| `src/app/api/deals/[id]/vote/route.ts` | Endpoint de votos |

---

## Comandos

```bash
npm run dev         # Dev server
npm run build       # Build + typecheck
npm run lint        # ESLint (0 errores, 6 warnings)
npm run sync        # Google Sheet → DB
```
