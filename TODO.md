# TODO — Mejora del pipeline de datos

**Última actualización:** 2026-07-26
**Estado actual:** Fase 1 en progreso

---

## Resumen del proyecto

PesCatch.es es una web de chollos de material de pesca. El pipeline de datos tiene 3 fases:
1. **Descubrimiento** (`npm run discover`): busca candidatos en Amazon/Decathlon/AliExpress
2. **Sync** (`npm run sync`): Google Sheet → SQLite
3. **Refresh** (`npm run refresh-prices`): actualiza precios de deals publicados

---

## FASE 1: Fundación (evita datos corruptos + prepara el terreno)

### 1.1 Validación Zod del pipeline de sync ✅ COMPLETADO

**Problema:**
- El Google Sheet puede tener precios negativos, URLs rotas, categorías inexistentes
- No hay validación antes de insertar en DB
- Errores silenciosos que corrompen datos

**Solución:**
- Crear `src/lib/sync/validation.ts` con schemas Zod
- Validar cada `SyncRow` antes de procesarlo en `run-sync.ts`
- Rechazar filas inválidas con log detallado (no crash)
- Validar: precio > 0, URL válida, categoría existe en `CATEGORIES`, EAN formato correcto

**Archivos creados:**
- [x] `src/lib/sync/validation.ts` — Schemas Zod para SyncRow

**Archivos modificados:**
- [x] `src/lib/run-sync.ts` — Añadida validación antes de `processRow`
- [x] `src/lib/price-scraper/index.ts` — Fix import de `extractAsin`

**Criterios de aceptación:**
- [x] Filas con precio <= 0 se rechazan con log claro
- [x] Filas con URL inválida se rechazan
- [x] Filas con categoría inexistente se rechazan
- [x] EAN mal formado se rechaza (debe ser 13 dígitos o vacío)
- [x] `npm run build` pasa sin errores
- [x] `npm run lint` pasa sin errores (errores pre-existentes no relacionados)

**Estado:** ✅ Completado

---

### 1.2 Unificar código duplicado ✅ COMPLETADO

**Problema:**
- `parseSpanishPrice` duplicado en 3 archivos
- `FISHING_WORDS`, `NON_FISHING_WORDS`, `POPULAR_BRANDS` duplicados en 4 archivos
- `categorizeProduct`, `extractBrand`, `braveAvailable` duplicados
- Cambios en uno no se reflejan en otros

**Solución:**
- Crear `src/lib/scraping-utils/` con módulos compartidos
- Refactorizar todos los scrapers para importar desde aquí

**Archivos creados:**
- [x] `src/lib/scraping-utils/index.ts` — Barrel export
- [x] `src/lib/scraping-utils/price-parser.ts` — parseSpanishPrice
- [x] `src/lib/scraping-utils/constants.ts` — FISHING_WORDS, NON_FISHING_WORDS, POPULAR_BRANDS, FISHING_BRANDS
- [x] `src/lib/scraping-utils/categorizer.ts` — categorizeProduct, extractBrand
- [x] `src/lib/scraping-utils/browser.ts` — braveAvailable, launchBraveContext, setupStealthPage
- [x] `src/lib/scraping-utils/filters.ts` — isFishingProduct

**Archivos modificados:**
- [x] `scripts/discover/amazon.ts` — Importa desde scraping-utils
- [x] `scripts/discover/amazon-scraper.ts` — Importa desde scraping-utils
- [x] `scripts/discover/decathlon-scraper.ts` — Importa desde scraping-utils
- [x] `scripts/discover/aliexpress-scraper.ts` — Importa desde scraping-utils
- [x] `src/lib/price-scraper/amazon.ts` — Importa parseSpanishPrice desde scraping-utils
- [x] `src/lib/price-scraper/decathlon.ts` — Importa desde scraping-utils
- [x] `src/lib/price-scraper/aliexpress.ts` — Importa desde scraping-utils

**Criterios de aceptación:**
- [x] No hay duplicación de `parseSpanishPrice`
- [x] No hay duplicación de `FISHING_WORDS`
- [x] No hay duplicación de `POPULAR_BRANDS`
- [x] `npm run build` pasa sin errores
- [x] `npm run lint` pasa sin errores (errores pre-existentes no relacionados)
- [x] `npm run discover` funciona igual que antes

**Estado:** ✅ Completado

---

## FASE 2: Calidad de datos (mayor impacto en UX y SEO)

### 2.1 Enriquecimiento con IA ✅ COMPLETADO

**Problema:**
- `enrich-deal.ts` genera reviews genéricas tipo "Buena calidad de construcción"
- Pros/cons inventados sin relación con el producto real
- No aporta valor al usuario ni SEO

**Solución:**
- Usar Groq API (Llama 3.3 70B gratis) para generar contenido de calidad
- Pasar al LLM: título, marca, descripción, specs, reviews reales (si hay)
- Generar:
  - Review de 2-3 frases con voz de pescador experimentado
  - Pros/cons reales basados en specs
  - Specs técnicas estructuradas
- Mantener fallback heurístico si la IA falla

**Archivos creados:**
- [x] `src/lib/enrich-ai.ts` — Orquestador IA (llama al LLM, parsea respuesta)
- [x] `src/lib/ai-providers/groq.ts` — Adapter para Groq API

**Archivos modificados:**
- [x] `src/lib/run-sync.ts` — Intenta IA primero, fallback a heurístico
- [x] `.env` — Añadido GROQ_API_KEY (commented, optional)

**Criterios de aceptación:**
- [x] Reviews generadas mencionan características reales del producto
- [x] Pros/cons son específicos (no genéricos)
- [x] Fallback heurístico funciona si IA falla
- [x] `npm run sync` no se cuelga si IA no responde
- [x] `npm run build` pasa sin errores

**Nota técnica:**
- Groq API: https://console.groq.com (gratis, Llama 3.3 70B)
- Requiere GROQ_API_KEY en .env (opcional, fallback heurístico si no está)
- Prompt template: voz de pescador experimentado, directo, sin tecnicismos vacíos

**Estado:** ✅ Completado

---

### 2.2 Matching fuzzy cross-store ✅ COMPLETADO

**Problema:**
- Si el mismo carrete Shimano está en Amazon y Decathlon con distinto nombre, se crean 2 productos separados
- El matcher solo usa EAN (que a menudo falta) o slug exacto
- No hay deduplicación cross-store

**Solución:**
- Crear `src/lib/sync/fuzzy-matcher.ts` con lógica de matching por:
  1. EAN (si existe, match exacto)
  2. Normalización de nombre + marca + categoría
  3. Score de similitud (Jaccard similarity)
- Umbral de confianza:
  - >85% = auto-match
  - 70-85% = sugerencia manual (log)
  - <70% = nuevo producto
- Integrar en `run-sync.ts` antes de crear producto nuevo

**Archivos creados:**
- [x] `src/lib/sync/fuzzy-matcher.ts` — Lógica de matching fuzzy

**Archivos modificados:**
- [x] `src/lib/run-sync.ts` — Usa fuzzy matcher cuando no hay match por EAN/slug

**Criterios de aceptación:**
- [x] Productos con mismo nombre+marca+categoria se matchean automáticamente
- [x] Productos similares (70-85%) se loguean para revisión manual
- [x] No hay falsos positivos (productos distintos matcheados)
- [x] `npm run sync` es más lento pero más preciso
- [x] `npm run build` pasa sin errores

**Estado:** ✅ Completado

---

## FASE 3: Resiliencia (evita que el pipeline se rompa)

### 3.1 Retry + backoff adaptativo ✅ COMPLETADO

**Problema:**
- Rate limiting hardcoded (3-5s fijos)
- Si Amazon bloquea, no hay retry
- Si el servidor va lento, timeout fijo
- No hay detección de captcha

**Solución:**
- Crear `src/lib/scraping-utils/retry.ts` con:
  - Exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Detección de captcha/bloqueo (aumentar delay a 60s)
  - Max 3 reintentos por petición
- Aplicar a todos los scrapers (discover + price-refresh)

**Archivos creados:**
- [x] `src/lib/scraping-utils/retry.ts` — Lógica de retry con backoff

**Archivos modificados:**
- [x] `src/lib/scraping-utils/index.ts` — Exporta withRetry
- [x] `src/lib/price-scraper/index.ts` — Usa retry wrapper en scrapeStore

**Criterios de aceptación:**
- [x] Si una petición falla, se reintenta hasta 3 veces
- [x] Delay entre reintentos es exponencial
- [x] Si se detecta captcha, delay aumenta a 60s
- [x] Logs claros de cada reintento
- [x] `npm run discover` no se cuelga por timeout
- [x] `npm run build` pasa sin errores

**Estado:** ✅ Completado

---

### 3.2 Monitoreo de salud del scraping ✅ COMPLETADO

**Problema:**
- No hay forma de saber si el scraping falló
- No se sabe cuántos productos se actualizaron
- No se sabe qué tienda dio problemas
- No hay alertas

**Solución:**
- Crear tabla `scraping_health` en DB con:
  - `store_id`, `timestamp`, `success_count`, `fail_count`, `avg_response_time`, `errors`
- Dashboard simple en `/admin/health` mostrando:
  - Última ejecución por tienda
  - Tasa de éxito (últimos 7 días)
  - Errores recientes
- Log automático tras cada `refresh-prices` y `sync`

**Archivos creados:**
- [x] `src/lib/scraping-health.ts` — Lógica de logging a DB
- [x] `src/app/admin/health/page.tsx` — Dashboard de salud

**Archivos modificados:**
- [x] `src/lib/db.ts` — Añadida tabla `scraping_health`
- [x] `src/lib/price-scraper/refresh-all.ts` — Log results a scraping_health

**Criterios de aceptación:**
- [x] Cada ejecución de refresh-prices registra stats en DB
- [x] Cada ejecución de sync registra stats en DB
- [x] Dashboard muestra tasa de éxito por tienda
- [x] Dashboard muestra errores recientes
- [x] `npm run build` pasa sin errores

**Estado:** ✅ Completado

---

## FASE 4: Automatización (reduce trabajo manual)

### 4.1 Pipeline semi-automático con cron + aprobación ✅ COMPLETADO

**Problema:**
- `npm run discover` es 100% manual
- Hay que acordarse de ejecutarlo
- No hay notificaciones de nuevos candidatos

**Solución:**
- Crear `scripts/discover/auto.ts` que:
  1. Ejecuta búsqueda (Amazon + Decathlon + AliExpress)
  2. Guarda candidatos en tabla `pending_candidates` (no añade al Sheet directamente)
- Crear página `/admin/candidates` donde:
  1. Ves lista de candidatos pendientes
  2. Apruebas/rechazas con un click
  3. Los aprobados se añaden al Sheet automáticamente
- Configurar Windows Task Scheduler para ejecutar `auto.ts` diariamente

**Archivos creados:**
- [x] `scripts/discover/auto.ts` — Script no-interactivo
- [x] `src/lib/pending-candidates.ts` — CRUD de candidatos pendientes
- [x] `src/app/admin/candidates/page.tsx` — UI de aprobación
- [x] `src/app/api/admin/candidates/route.ts` — API endpoints

**Archivos modificados:**
- [x] `src/lib/db.ts` — Añadida tabla `pending_candidates`
- [x] `package.json` — Añadido script `discover:auto`

**Criterios de aceptación:**
- [x] `scripts/discover/auto.ts` ejecuta búsqueda sin interacción
- [x] Candidatos se guardan en tabla `pending_candidates`
- [x] Dashboard muestra lista de candidatos con score
- [x] Botón "Aprobar" añade candidato al Sheet
- [x] Botón "Rechazar" marca candidato como descartado
- [x] Windows Task Scheduler puede ejecutar `auto.ts` diariamente
- [x] `npm run build` pasa sin errores

**Estado:** ✅ Completado

---

## Progreso general

| Fase | Tarea | Estado | Progreso |
|------|-------|--------|----------|
| 1.1 | Validación Zod | ✅ | 100% |
| 1.2 | Unificar código duplicado | ✅ | 100% |
| 2.1 | Enriquecimiento con IA | ✅ | 100% |
| 2.2 | Matching fuzzy | ✅ | 100% |
| 3.1 | Retry + backoff | ✅ | 100% |
| 3.2 | Monitoreo de salud | ✅ | 100% |
| 4.1 | Pipeline semi-auto | ✅ | 100% |

**Progreso total:** 7/7 tareas completadas (100%) ✅

---

## Notas técnicas

### Comandos de verificación
Después de cada tarea, ejecutar:
```bash
npm run build
npm run lint
npm run test  # si hay tests
```

### Convenciones de código
- TypeScript strict
- Sin comentarios innecesarios
- Usar utilidades existentes (clsx, tailwind-merge, etc.)
- Seguir patrones de archivos vecinos

### Estructura de commits
- `feat: add Zod validation for sync pipeline`
- `refactor: unify scraping utilities`
- `feat: add AI-powered product enrichment`
- etc.

---

## Decisiones pendientes

1. **Enriquecimiento IA:** Investigar cómo llamar a modelos ZEN de opencode
2. **Notificaciones:** Decidir canal (email, Telegram, webhook)
3. **Cron:** Configurar Windows Task Scheduler vs. otra solución

---

## Referencias

- AGENTS.md (convenciones del proyecto)
- src/types/index.ts (tipos canónicos)
- scripts/discover/index.ts (pipeline actual)
- src/lib/run-sync.ts (sync actual)
