# Pescatch.es — Proyecto TODO

> Web comparativa de artículos de pesca multi-tienda (Amazon, Decathlon, AliExpress)
> Live: https://www.pescatch.es

---

## ✅ COMPLETADO

### Infraestructura
- [x] Base de datos SQLite (dev) + Turso (prod): products, deals, price_history, comments, posts
- [x] Migración automática de esquema en frío
- [x] Migración de deals existentes a productos (enriquecimiento)
- [x] Variables de entorno (.env) con GOOGLE_SHEET_CSV_URL
- [x] Publicación en Vercel desde GitHub (master)

### Sistema de Sync (`scripts/sync.ts`)
- [x] Script CLI `npm run sync` lee CSV de Google Sheets o JSON local
- [x] Parser CSV (maneja filas envueltas en comillas de Google Sheets)
- [x] Matching por EAN, upsert de productos y deals
- [x] Historial de precios (price_history) cada sync
- [x] Adaptadores: Amazon PA API, Decathlon API, AliExpress API (stubs)
- [x] Sync importa productos sin EAN (genera slug por nombre)

### Google Sheets API
- [x] Conexión vía service account (`google-sheets-client.ts`)
- [x] Leer/escribir celdas directamente desde la API
- [x] `reader-sheets.ts` usa API como fuente primaria (fallback CSV)

### Frontend
- [x] Home con héroe dinámico (top 3 ofertas por descuento)
- [x] Detalle de oferta con comparativa multi-tienda
- [x] Blog dinámico `[slug]/page.tsx` — productos vía `PRODUCTS_DATA`
- [x] Búsqueda funcional
- [x] Cards producto con puntuación, precio, descuento
- [x] Navbar sticky
- [x] Página 500 en /search corregida

### Contenido
- [x] 1 artículo sembrado: "Las 5 mejores cañas de spinning de 2026"
- [x] Google Sheet con 10 productos
- [x] 27 productos en DB (sync exitoso)
- [x] Reader-sheets reescrito para usar API de Google Sheets
- [x] 3 EANs encontrados y escritos (Vicloon, Shimano, Penn)

### Bestsellers investigados
- [x] Scraping bestsellers Amazon.es: carretes (2930152031), cañas (2930157031), señuelos (2930195031)
- [x] Flujo documentado en AGENTS.md

---

## 🔴 FASE 1 — ESENCIAL

### Google Sheet — Poblar con bestsellers reales
- [x] 3 EANs encontrados (Vicloon, Shimano, Penn)
- [x] Imágenes reales de Amazon para 9 productos
- [x] Amazon URLs reales para 9 productos
- [x] Productos genéricos reemplazados (Rapala, Sweepfire, Sick Braid)
- [x] Daiwa Saltist reemplazado por Shimano FX XT 2.10m (bestseller #1 cañas) — ASIN B0846PNXKM
- [x] 4 productos añadidos: Mitchell Mx1, Abu Garcia Cardinal X, Abu Garcia Tormentor2, TRUSCEND Kit (13 total)
- [x] 14 productos Decathlon añadidos (27 total)
- [ ] Buscar ASINs Amazon para los 14 productos Decathlon
- [ ] Añadir más señuelos y accesorios (categorías flojas)
- [ ] Rediseño hero, CTA, badges, pruebas sociales, navegación
- [ ] Buscar equivalentes Decathlon para cada producto

### Sync — Importar todos los productos
- [x] Modificar sync para importar productos sin EAN
- [x] 9 productos en DB

### Frontend — Conversión
- [ ] Hero con imagen real de pesca (no cards mini)
- [ ] CTA único "Ver Ofertas" más grande
- [ ] Categorías con imágenes y contadores
- [ ] Badges de valor: "Más barato en X", "Mejor relación calidad-precio"
- [ ] Prueba social: contador de ahorros, testimonios
- [ ] Limpiar navegación (ocultar Admin, consolidar)

### Contenido — Artículos de blog
- [ ] "Mejores carretes de spinning calidad-precio"
- [ ] "Las 5 mejores cañas de surfcasting 2026"
- [ ] "Kits de señuelos para empezar a pescar"
- [ ] "Comparativa: carretes Shimano vs Daiwa"

---

## 🟡 FASE 2 — CRECIMIENTO

### Automatización
- [ ] Vercel Cron Job o GitHub Action para sync diario
- [ ] Histórico de precios con datos reales (7-14 días)

### API Keys
- [ ] Amazon PA API (access key + secret + partner tag)
- [ ] Afiliados Decathlon (TradeDoubler / Awin)
- [ ] AliExpress Affiliate API

### SEO
- [ ] Meta tags dinámicos por página
- [ ] Schema.org/Product + BlogPosting
- [ ] Google Search Console

---

## 🔵 FASE 3 — ESCALAR

- [ ] Comentarios en productos (tabla ya existe)
- [ ] Valoraciones de usuarios
- [ ] Newsletter
- [ ] Alertas de precio
- [ ] Open Graph / Twitter Cards
- [ ] Integración real Amazon PA API
- [ ] Integración real Decathlon API
- [ ] Integración real AliExpress API
- [ ] Tests automatizados
- [ ] Monitorización enlaces rotos

---

## ⚪ FASE 4 — VISIÓN

- [ ] 20+ artículos de blog
- [ ] 50+ productos con multi-tienda
- [ ] Guías de compra por categoría
- [ ] Sección reviews de usuarios
- [ ] Enlaces afiliados 3 tiendas activos
- [ ] Optimizar CTR afiliados
- [ ] Google AdSense / Ezoic

---

## 🚧 BLOQUEADO

- **Decathlon API**: No encontrada. Alternativa: afiliados vía TradeDoubler/Awin
- **Amazon PA API**: Sin credenciales. Fallback: BrightData
- **AliExpress API**: Sin credenciales
- **DNS dominio sin www**: Redirección pendiente

---

## 📁 Archivos clave del proyecto

| Archivo | Función |
|---------|---------|
| `scripts/sync.ts` | Script principal de sincronización |
| `src/lib/sync/reader-sheets.ts` | Lector de datos (API Google Sheets + fallback CSV) |
| `src/lib/sync/google-sheets-client.ts` | Cliente Google Sheets API (leer/escribir celdas) |
| `src/lib/sync/matcher.ts` | Matching por EAN/slug, upsert productos/deals |
| `src/lib/sync/types.ts` | Tipos SyncRow, SyncResult, StoreAdapter |
| `src/lib/db.ts` | Esquema DB + migraciones |
| `src/types/index.ts` | Tipos Product, Deal, Store, etc. |
| `src/data/queries.ts` | Queries + enrichWithProducts |
| `src/app/blog/[slug]/page.tsx` | Template blog dinámico |
| `src/app/deals/[slug]/page.tsx` | Detalle oferta + multi-tienda |
| `src/app/page.tsx` | Home con héroe dinámico |
| `.env` | GOOGLE_SHEET_CSV_URL |
| `.env.google-sheets.json` | Credenciales service account Google Sheets |
| `data/pescatch.db` | DB local SQLite |

## 🔗 Enlaces

- Google Sheet (CSV): `https://docs.google.com/spreadsheets/d/e/2PACX-1vQuuyXHtDXn9cxPebk5pQRX43xMTRIk0IaYflwX9QdItX9nfpwfjdhg8nBdXuN68JPMcc4VN1gZBdVg/pub?output=csv`
- Google Sheet (edición): Buscar en Google Drive como "Chollos Pesca"
- Live: https://www.pescatch.es
- Repo: GitHub (master → Vercel auto-deploy)
