# TODO — Mejora del pipeline de datos

**Última actualización:** 2026-09-04
**Estado actual:** ✅ 9/9 tareas completadas (Fases 1-4 + Infra) + mantenimiento semanal

> Nota: este archivo cubre el pipeline de datos. El ROADMAP.md cubre todo el proyecto (marketing, SEO, infraestructura).

---

## Resumen del proyecto

PesCatch.es es una web de chollos de material de pesca. El pipeline de datos tiene 3 fases:
1. **Descubrimiento** (`npm run discover`): busca candidatos en Amazon/Decathlon/AliExpress
2. **Sync** (`npm run sync`): Google Sheet → SQLite/Turso
3. **Refresh** (`npm run refresh-prices`): actualiza precios de deals publicados

---

## FASE 1: Fundación (evita datos corruptos + prepara el terreno)

### 1.1 Validación Zod del pipeline de sync ✅ COMPLETADO
- `src/lib/sync/validation.ts` — Schemas Zod para SyncRow
- `src/lib/run-sync.ts` — Validación antes de `processRow`

### 1.2 Unificar código duplicado ✅ COMPLETADO
- `src/lib/scraping-utils/` — price-parser, constants, categorizer, browser, filters

---

## FASE 2: Calidad de datos (mayor impacto en UX y SEO)

### 2.1 Enriquecimiento con IA ✅ COMPLETADO
- `src/lib/enrich-ai.ts` + `src/lib/ai-providers/groq.ts` — reviews/pros/cons/specs con voz de pescador

### 2.2 Matching fuzzy cross-store ✅ COMPLETADO
- `src/lib/sync/fuzzy-matcher.ts` — Jaccard similarity, auto-match >85%, sugerencia 70-85%

---

## FASE 3: Resiliencia (evita que el pipeline se rompa)

### 3.1 Retry + backoff adaptativo ✅ COMPLETADO
- `src/lib/scraping-utils/retry.ts` — exponential backoff, detección de captcha

### 3.2 Monitoreo de salud del scraping ✅ COMPLETADO
- Tabla `scraping_health` + dashboard `/admin/health`

---

## FASE 4: Automatización (reduce trabajo manual)

### 4.1 Pipeline semi-automático con cron + aprobación ✅ COMPLETADO
- `scripts/discover/auto.ts` → `pending_candidates` → `/admin/candidates`

### 4.2 Sync multi-entorno ✅ COMPLETADO
- `scripts/sync-prod.ts` (`npm run sync:prod`) — Sheet → Turso
- `scripts/publish-to-prod.ts` (`npm run publish:prod`, dry-run por defecto, `--apply`) — drafts → published en Turso
- Fix `db.ts`: cliente lee `TURSO_DATABASE_URL` en tiempo de llamada

### 4.3 Normalización de categorías ✅ COMPLETADO
- `src/lib/normalize-category.ts` + migración en `migrateSchema()` + `match-deals-to-products.ts`

---

## Progreso general

| Fase | Tarea | Estado |
|------|-------|--------|
| 1.1 | Validación Zod | ✅ 100% |
| 1.2 | Unificar código duplicado | ✅ 100% |
| 2.1 | Enriquecimiento con IA | ✅ 100% |
| 2.2 | Matching fuzzy | ✅ 100% |
| 3.1 | Retry + backoff | ✅ 100% |
| 3.2 | Monitoreo de salud | ✅ 100% |
| 4.1 | Pipeline semi-auto | ✅ 100% |
| 4.2 | Sync multi-entorno | ✅ 100% |
| 4.3 | Normalización de categorías | ✅ 100% |

**Progreso total:** 9/9 tareas completadas (100%) ✅

---

## Pendientes / mejoras para el pipeline

- [x] **Refresh-prices**: API AliExpress operativa + Amazon fetch directo (GH Action horaria)
- [x] **Sync automático en la nube**: 5 Vercel Crons + GH Action `cron-refresh-prices`
- [x] **Alertas de precio usuario**: tabla `price_alerts` + modal + cron 08:30
- [x] **A1:R100 hardcodeado** → `RANGE = SHEET_NAME` + `ensureHeaders` expande más allá de Z
- [x] **EANs de 12 dígitos** resueltos vía RAW mode (`0022255230759`, `0031324038523`)

### Nuevos pendientes (04 Sep 2026)
- [x] **Scoring 0 reviews**: fake rating 100/0 ya no puntúa (fix `scoreCandidate` 04 Sep)
- [ ] **Backlog Sougayilang genéricos**: 52 rechazados hoy (53 pending → 0). Vigilar que `discover:auto` no regenere junk; valorar filtro `score>=50 && reviews>=10`
- [ ] **Slug UNIQUE duplicado**: `SHIMANO Sienna FG 4000` y `Stradic FL 2500` siguen fallando en sync_log (2 errores por sync) — revisar slugs en Sheet

---

## Notas técnicas

### Comandos de verificación
```bash
npm run build   # ✓ 04 Sep 2026
npm run lint    # 22 warnings, 0 errores
npm test        # 175/177 (2 flaky timeout preexistentes)
```

### Convenciones de código
- TypeScript strict
- Sin comentarios innecesarios
- Usar utilidades existentes (clsx, tailwind-merge, etc.)
- Seguir patrones de archivos vecinos

### Estructura de commits
- `feat: ...`, `fix: ...`, `refactor: ...` (ver git log para convención del repo)
