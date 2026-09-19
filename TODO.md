# TODO — Mejora del pipeline de datos

**Última actualización:** 2026-09-19
**Estado actual:** ✅ 9/9 tareas completadas (Fases 1-4 + Infra) + mantenimiento 19 Sep (336 rows, published 173, pending 6, rejected 1068, price_history 13795)

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

### Nuevos pendientes (07 Sep 2026)
- [x] **Scoring 0 reviews**: fake rating 100/0 ya no puntúa (fix `scoreCandidate` 04 Sep)
- [x] **Backlog Sougayilang genéricos**: auditado 04 Sep (53→0) + 07 Sep (43 pending + 31 approved junk → 0). Blindaje `discover:auto` + `auto-amazon.ts`: `isFakeBrand` (rechaza `€`/`:`/`Recomendado:`), `isValidForSave` (`reviews>=10 && score>=50 && brand ok && 5€≤price≤600€`), fallback ya no guarda junk (si 0 válidos → 0 guardados). `scoreCandidate` penaliza fake brand -20 y cap descuento >80%→10pts.
- [x] **Backlog 07 Sep live**: 43 pending Amazon (todos `score 30-49` + 40/43 brand fake `€`) y 31 approved legacy (11 fake 100/0 Sougayilang) → rechazados en bloque. Local `pending=0 approved=0 rejected=925`. Turso `push-candidates` dry-run 0 inserts. `discover-auto.log` marcará 0 válidos hasta que haya stock real.
- [x] **Slug UNIQUE duplicado** (fix 14 Sep): `SHIMANO Sienna FG 4000` y `Stradic FL 2500` ya no dan errores — `src/lib/sync/matcher.ts:132-186` ahora hace check determinístico antes de INSERT/UPDATE (`SELECT slug WHERE id != ?`) + suffix `-${storeId}`/`-${n}` y fallback random; `sync 14 Sep: 294 rows 2 created 292 updated 0 errors` (sync_log id 66). Previamente 2 errores/sync con retry parcial, ahora 0. No requiere dedup manual en Sheet.

### Mantenimiento 14 Sep 2026
- `clean-expired` 0 expirados, `refresh-prices:prod --apply` 120 updated 31 failed 0 removed 2 alerts → 131 pushes a Turso, `push-candidates` 0, `sync --no-enrich` 0 errores (previo 2), `build` 48/48 OK, `lint` 22 warnings, `test` 175/177 (2 flaky timeout preexistentes).
### Mantenimiento 17 Sep 2026
- `clean-expired` 0, `sync --no-enrich` 319 rows 2 creados 317 updated 0 errores (207s), `backup-db` 4.33MB (`data/backups/pescatch-2026-09-17.db`), `candidates` 24 pending → 0 pending (24 rechazados dup deals/approved; 0 fake brand), `approved` 25→8 (purgados 17 dups vs deals, quedan 8 score 71-81: B00KM587HQ/B01MFH2JAH/B0CH16WSLM/B08NK1HGQ4/B07N6JS8GJ/B0CMV4TB3R/HMR2/RJB7), `rejected 1026`, `refresh-prices` 133 updated / 33 failed / 0 removed + 9 priceAlert (price_history 12358, `push-prices --apply` 0 pendientes). Blog `_Blog/` archivado: cajas 5955 == DB (publicado), fluoro fake B0XXXXX descartado vs DB real 4820. `build` 49/49 OK, `lint` 22 warnings, `test` 175/177 (2 flaky).
### Mantenimiento 18 Sep 2026
- `push` 2 commits, `candidates` 19+8 → 13 únicos aprobados (B00KISCZ3Y 60€, B0CH17TGCM 55€, B017KJTV1W 22€, B0CMV4TB3R 72€ + 9 únicos) + 6 dup rechazados → Sheet + `sync` 336 filas 6 creados/4 Turso + `publish` 3 drafts→published, Blog `mejor-ropa-impermeable-pesca-2026` 5 prendas + push Turso, AE 4 picks (JSFUN 14.95€, Cadence 28.88€, Goture Xceed 35.59€, KUAISHA 26.07€) precio manual verificado → `published 173` (+4, total 203), `pending 0 / approved 25 / rejected 1051`, `price_history 13299`, `backup 2026-09-18`, `clean-expired` 0, `build` 49/49 OK, `test` 177/177 ✓.
### Mantenimiento 19 Sep 2026
- `clean-expired` 0, `backup-db` 2026-09-19 (4.35MB), `sync --no-enrich` 336 rows 2 creados 334 updated 0 errores (239s, sync_log id 72), `scraping_health` 19 Sep 10:17 Amazon 97/0 + AE 45/31 (refresh diario OK), `candidates` 23 pending → 17 dup approved rechazados (B00KM587HQ etc) → **6 pending únicos** (B0CH17B8Z1 60€, B075VCFDKJ 58.85€, B017M320VO 27.9€, B0846PNXKM 37.5€, B0846PLYSZ 39.31€, B0CSDR4MPC 67€, score 70-79) + approved 25 intactos → `pending 6 / approved 25 / rejected 1068`, `price_history 13795 (+496 vs 18 Sep)`, `sitemap` OK (21 posts), `lint` 22 warnings 0 errores, `test` 177/177 ✓, `build` skip (sin cambios código).

---

## Notas técnicas

### Comandos de verificación
```bash
npm run build   # ✓ 18 Sep 2026 (49/49 static, 97s) — 19 Sep skip (sin cambios código)
npm run lint    # 22 warnings, 0 errores (19 Sep)
npm test        # 177/177 ✓ (19 Sep)
npm run sync -- --no-enrich # ✓ 19 Sep 0 errores (336 rows, 2 creados 334 updated)
```

### Convenciones de código
- TypeScript strict
- Sin comentarios innecesarios
- Usar utilidades existentes (clsx, tailwind-merge, etc.)
- Seguir patrones de archivos vecinos

### Estructura de commits
- `feat: ...`, `fix: ...`, `refactor: ...` (ver git log para convención del repo)
