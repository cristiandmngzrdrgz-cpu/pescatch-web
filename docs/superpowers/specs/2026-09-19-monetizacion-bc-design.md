# Monetización PesCatch — Enfoque B+C (300-500€/mes) — Design Spec

**Fecha:** 2026-09-19
**Autor:** Muse Spark + Cristian
**Estado:** Draft → pendiente revisión usuario antes de plan de implementación
**Enfoque aprobado:** B+C mix (5-8h/semana, 1-2 posts/semana, promo ligera, máxima automatización)

---

## 1. Objetivo

Pasar de **~20€** (tracking vacío, 100% Google, Telegram sin audiencia) a **100€ mes 1 → 300-500€ mes 2-3** con ticket medio 30.37€ → 45€ y CTR 1%→3%, manteniendo el pipeline actual (`src/lib/db.ts`, `vercel.json` crons, `discover:auto`).

**No objetivo:** No se busca viral en redes ni ads pagados en esta fase. No se añade nueva store (Decathlon sigue deshabilitado por `DISABLED_STORES` en `src/data/queries.ts`).

---

## 2. Contexto y auditoría (2026-09-19)

**DB local (`data/pescatch.db`):**
- `deals` 207 total / 173 `published` / 34 `draft` — 97 Amazon (avg 35.29€, commission 1.76€, 5% `STORES` en `src/types/index.ts:247`) + 76 AliExpress (24.09€, 1.92€, 8%)
- Ticket medio 30.37€ → comisión media 1.84€ (`matcher.ts:124` `salePrice * commissionRate`). Stradic 179€ → 9€ es 5× la media.
- Categorías: accesorios 57, carretes 52, cañas 30, señuelos 26, ropa 8 — mucho low-ticket lastra comisión.
- `price_history` 13795, `posts` 21, `sync_log` id 72 336 rows 2/334 0 errores (19 Sep), `scraping_health` 19 Sep Amazon 97/0 + AE 45/31 OK
- `pending_candidates` 6 tras dedup 19 Sep (B0CH17B8Z1 60€ ... B0CSDR4MPC 67€ score 70-79), `approved` 25, `rejected` 1068 — blindaje `isFakeBrand`/`isValidForSave` OK

**Tracking roto:**
- `click_tracking` VACÍA (0 filas, 0 en 30 días) aunque `DealCtaButton.tsx:21` (`trackClickLocal` → `POST /api/track-click`) y `price-comparison.tsx:86` + `analytics.ts:3` (`@vercel/analytics`) existen. Ruta `src/app/api/track-click/route.ts:18` hace `INSERT OR IGNORE` con `clickId` único — no hay clicks o Turso local vs producción desalineado (`TURSO_DATABASE_URL` solo en `.env.vercel`/`.env.turso`, no en dev).
- Sin tracking no se puede priorizar high-ticket ni medir CTR por deal/categoría.

**Canales:**
- Solo Google. `sitemap.xml:6` y `robots.txt:1` OK, 21 posts, pero interlinking deal↔post débil. Newsletter (`send-newsletter.ts`) y Telegram (`send-telegram.ts` → `telegram.ts:18` top 10 por `discountPercent`, cron `vercel.json:19` lunes 09:05) operativos pero sin audiencia porque `footer.tsx` y `/api/cron/telegram` no se promocionan.

---

## 3. Métricas de éxito (KPIs)

| KPI | Hoy | Semana 4 | Semana 8 | Cómo se mide |
|-----|-----|----------|----------|--------------|
| Ingresos afiliado (Amazon+AE) | ~20€ | 80-120€ | 300-500€ | Amazon Associates + AE Open Platform panel (fuente verdad) — local `click_tracking` es proxy |
| CTR deal → tienda | desconocido (0 tracked) | 1.5-2% | 2.5-3.5% | `click_tracking` clicks / `deal_view` (`analytics.ts:11` + Vercel Analytics) |
| Ticket medio publicado | 30.37€ | 35€ | 42-48€ | `SELECT avg(salePrice) WHERE status='published'` — subir peso high-ticket |
| Tráfico orgánico | solo Google bajo | +15% impresiones | +40% clicks | GSC + `@vercel/analytics` pageviews |
| Suscriptores Telegram | ~0 | 50 | 150-300 | `@BotFather` channel members |
| Newsletter subs | bajo | +30 | +100 | `subscribers` tabla |
| Posts buyer-intent nuevos | 21 | +4 | +8 | `posts` count + GSC clicks por post |

Gate de decisión al final de semana 4: si CTR <1.5% y Telegram <30, pivotar a enfoque 1 (solo SEO) antes de seguir invirtiendo horas en promo.

---

## 4. Arquitectura

**Stack sin cambios:** Next.js 16.2.9, Tailwind 4, `@libsql/client` (local `data/pescatch.db` / Turso prod), `vercel.json` crons (sync 06:00, price-alerts 08:30, newsletter lun 09:00, telegram lun 09:05, GH Action `cron-refresh-prices.yml` horaria).

**Principios de diseño (isolation):**
- Cada unidad con una sola responsabilidad, interfaz clara, testeable aislada, sin leer internos de otra.
- Reutilizar patrón existente: lazy `playwright`, `buildAmazonUrl` con `?tag=pescatch-21`, firma TOP MD5 en `aliexpress-api.ts:32`.
- Sin nuevas dependencias pesadas. Si se añade, justificada y tras gate.

```
[Google Sheet 336 rows] --sync(06:00)--> [Turso/local deals+products] --publish--> [Web 173 published]
        |                                                          |
        +--> [pending_candidates 6/día] --auto-approve curados--> [Sheet append] --+
        |                                                                          |
[Amazon 33 keywords + AE API searchProducts] --discover:auto 08:00--> [pending] ----+
        |
[price_history 13795] <--refresh-prices GH Action 20/chunk-- [deals published]

[deals published] --buildTelegramMessage(top 10 discount)--> [Telegram channel] --promo CTA--> [Web CTR]
        |--> [click_tracking + @vercel/analytics deal_click] --> [Admin monetización dashboard] --> prioriza high-ticket
        |--> [blog buyer-intent 1/semana] --> [SEO interlink deal<->post] --> [Google traffic]
        |--> [newsletter lun 09:00 top chollos] --> [email CTR]
```

---

## 5. Componentes

### 5.1 Fix tracking (P0, 1 día, desbloquea todo)
**Problema:** `click_tracking` vacía → no sabes qué vende.
**Solución:**
- Verificar `TURSO_DATABASE_URL` en prod vs local: `src/lib/db.ts:6` lee env en tiempo de llamada, pero `POST /api/track-click` en Vercel escribe en Turso, no en local. El audit del 19 Sep leyó local (vacía) — normal. Confirmar en Turso: `SELECT count(*) FROM click_tracking` vía `dotenv` `.env.vercel`.
- Añadir fallback: si `fetch('/api/track-click')` falla, `keepalive:true` ya está; añadir `navigator.sendBeacon` fallback + reintento.
- Añadir `deal_view` tracking (hoy solo `deal_click`): `trackDealView` en `deals/[slug]/page.tsx` (server → client) para denominador CTR.
- **Interfaz:** `POST /api/track-click {clickId, dealId, storeId}` → `click_tracking`, `GET /api/admin/click-stats` (protegido `adminApiCheck`) → `{byDeal, byStore, byCategory, ctr}`.
- **Test:** `vitest` → insert 3 clicks, assert `SELECT count(*)`.

### 5.2 Automatización discover→sync→publish + Telegram (P0, mix C)
**Objetivo C:** que publique solo si puede.
- `discover:auto` ya genera ~6 válidos/día (score≥50, `isValidForSave` `reviews>=10 && 5€≤price≤600€`). Hoy 6 únicos listos.
- **Auto-approve curados:** nuevo `scripts/auto-approve-curated.ts` — criterios: `score>=75 && brand in {Shimano,Daiwa,Okuma,Penn,Abu Garcia} && reviews>=30 && rating>=4.2 && !isFakeBrand` → `status='approved'` → `appendRow` Sheet automáticamente (sin pasar por `/admin/candidates`). Los no-curados (score 50-74) quedan `pending` para tu aprobación manual de 5 min/día en `/admin/candidates`.
- **Sync+publish diario auto:** `vercel.json` ya tiene `sync` 06:00; añadir `auto-approve` antes de `sync` o encadenar `sync:prod` → `publish:prod --apply` (hoy `publish:prod` es manual). En GH Action o Vercel cron, ejecutar `auto-approve --apply` si hay curados.
- **Telegram promo auto pero con gancho:** `telegram.ts:18` hoy lista top 10 por `discountPercent`. Cambiar a top 8 por `commission` ponderado (priorizar high-ticket) + incluir 1 AE high-commission. Mensaje ya usa `escapeTelegram` y `parse_mode HTML` — añadir CTA "⚡ Últimas 24h" + link `/top-chollos`.
- **Seguridad:** `isTelegramConfigured()` gate, idempotencia 20h ya en `cron_state` (`8223f3e`), dry-run por defecto.

### 5.3 Priorización high-ticket (P1, sin código de scraping)
**Problema:** ticket medio 30€ lastra comisión.
**Solución sin tocar scrapers:**
- `getDeals({sortBy:'commission'})` nuevo sort en `src/data/queries.ts` (ya tiene `sortBy` discount/price/popular/newest) → `ORDER BY commission DESC`.
- Homepage `page.tsx`: módulo "Chollos que más te hacen ahorrar" (top 8 por commission, no solo discount) + badge "Gana 9€" vs "0.85€".
- Filtros `search/page.tsx`: slider "comisión mínima" oculto para admin, y normalizar categoría `ropa` (solo 8 deals) → no empujar low-ticket en portada.
- **Regla editorial:** de los 6 pending/día, priorizar aprobación manual de cañas/carretes >50€ sobre kits <20€.

### 5.4 Blog buyer-intent 1/semana (P1, motor SEO)
**Plantilla ya validada:** posts 2026 con `<!-- PRODUCTS_DATA: [...] -->` + CTA "Comprar · precio" (`blog/[slug]/page.tsx` renderer → `blog-renderer.ts`).
- **Calendario 8 semanas (ejemplos):** "Mejor carrete spinning <100€ 2026", "Caña surfcasting 4.20m comparativa", "Señuelos vinilo lubina: 5 que funcionan", "Kit iniciación pesca 50€ vs 150€", "Hilo trenzado 8 hebras: cuál no se deshilacha" — cada uno enlaza a 5-7 deals reales con `?tag=` y a `/categories/[slug]`.
- **Interlinking auto:** en `deals/[slug]/page.tsx` añadir "Aparece en: [post1, post2]" vía `relatedAsins` (`posts.relatedAsins` JSON). Si deal sin post, sugerir crear post.
- **SEO on-page:** `focusKeyword` en `posts.metaTitle/metaDescription`, FAQ JSON-LD ya en categorías, replicar en posts.
- **Definición de hecho:** post con 7 productos precio verificado (scrape `amazon.es/dp/<ASIN>` + AE API), sin tachado inflado >70% (`matcher.ts:118` ya cap), push a Turso `push-post-to-prod.ts <slug> --apply`.

### 5.5 Funnel Telegram + Newsletter (P1, promo 30 min/semana)
**Hoy:** links en `footer.tsx` + `email.ts` pero sin funnel.
- **Página `/telegram`:** explica qué recibe (1 mensaje lunes 09:05, top chollos, sin spam), QR del canal `t.me/pescatch`, testimonios, CTA "Únete gratis".
- **CTA en deal detail:** banner `DealCtaButton.tsx:76` ya tiene trust badges; añadir debajo "🔔 ¿Quieres que te avise cuando baje de 30€? → Únete a Telegram" (link `/telegram` + `price-alert-button.tsx` existente).
- **Newsletter top chollos:** `send-newsletter.ts` lunes 09:00 ya existe; cambiar template para incluir 3 high-ticket + 3 chollos 70%+ + bloque Telegram.
- **Promo semanal 30 min:** 1 post en X/Reddit r/pesca con link a `/top-chollos` (no a Amazon directo, para no perder tag), y fijar mensaje Telegram en canal.

### 5.6 Dashboard monetización en `/admin` (P2, visibilidad)
- Nuevo `/admin/monetizacion` (protegido `isAdminAuthenticated`): tabla `click_tracking` → clicks por deal/store/categoría, CTR (clicks/views), comisión estimada (`clicks * avg conversion 5% * commission` — placeholder hasta datos reales), top 10 deals por clicks y por commission.
- Reutiliza `scraping_health` y `sync_log` ya en `/admin/health`.

---

## 6. Flujo de datos

1. `discover:auto` (GH Action 08:00 o local) → `pending_candidates` (score, `isValidForSave`)
2. `auto-approve-curated.ts` → curados (score≥75) → `pending_candidates status='approved'` → `appendRow` Google Sheet
3. `sync:prod` 06:00 (Vercel cron) → Sheet 336 rows → `products`/`deals` (upsert, `commission` calc, `discountPercent` cap AE 70%) → `sync_log` + `price_history`
4. `publish:prod --apply` → `draft→published` (34 drafts hoy)
5. `refresh-prices` GH Action 20/chunk horario → `deals.salePrice` + `price_history` + `scraping_health`
6. Usuario visita `/` → ve módulo high-ticket (sort commission) → click `DealCtaButton` → `POST /api/track-click` (Turso) + `@vercel/analytics deal_click` + redirect `buildAmazonUrl(?tag=pescatch-21&subId=click_...)` o `s.click AE`
7. Lunes 09:00 newsletter + 09:05 telegram (top commission) → CTR medible
8. Admin mira `/admin/monetizacion` → decide qué curso priorizar en próximo post

---

## 7. Manejo de errores y restricciones

- **Sin API keys reales para Amazon PA-API** — `buildAmazonUrl` solo añade `?tag=` sin PA-API; no se promete precios en tiempo real de PA-API. Todo scrape es fetch + `isAmazonNotFoundPage` (`price-scraper/not-available.ts`).
- **AE precio "desde" distinto del real** — ya documentado `AGENTS.md:65` (verificar `es.aliexpress.com/item/<PID>.html` antes de publicar, `manualPrice` manda sobre API `store.manualPrice ?? apiResult.price` en `run-sync.ts`). No revertir.
- **Playwright lazy** — cualquier uso con `await import('playwright')` dentro de función (no romper bundle Vercel).
- **Rate limiting Amazon 3s** — `discover` max 1/hora (`AGENTS.md:55`).
- **Turso vs local:** `discover:auto` escribe local (`.env`), `/admin/candidates` lee Turso (`.env.local`). Por eso `push-candidates:prod --apply` obligatorio antes de revisar admin. `auto-approve` debe respetar esto (escribir local → push).
- **Idempotencia Telegram** (`cron_state` key `telegram_last_sent` 20h, `8223f3e`) — no duplicar lunes.
- **Presupuesto:** 0€ en esta fase. Si se añade ads, fuera de spec.

---

## 8. Testing y verificación

- **Unit:** `matcher.test.ts` commission calc (30€*0.05=1.5, cap AE 70%), `telegram.test.ts` buildTelegramMessage escape HTML, `auto-approve-curated.test.ts` (score 74→pending, 75→approved, fakeBrand→reject)
- **API:** `track-click.test.ts` INSERT + duplicate clickId ignore, `click-stats.test.ts` auth, `admin/monetizacion` render con datos mock
- **E2E manual:** `npm run discover:auto` → 6 pending → `npm run auto-approve-curated -- --dry-run` → `push-candidates:prod --apply` → `/admin/candidates` muestra 6 pending correctos → aprobar 1 → `sync:prod` → deal visible en `/` y en Telegram preview
- **Verificación comandos:** `npm run build` + `npm run lint` (22 warnings baseline) + `npm test` (177 hoy) + `npx tsx scripts/clean-expired-deals.ts` + `npx tsx scripts/sync.ts -- --no-enrich` (0 errores)

---

## 9. Roadmap 8 semanas (5-8h/semana)

**Semana 1 (P0):** Fix tracking + auto-approve curados + `/admin/monetizacion` v0 (solo tabla clicks)
**Semana 2:** Homepage sort commission + CTA Telegram en deal detail + página `/telegram`
**Semana 3-4:** Posts 1 y 2 buyer-intent + newsletter template high-ticket + interlink deal→post
**Semana 5-6:** Posts 3 y 4 + promo 30 min/semana (X/Reddit) + medir CTR y ajustar top Telegram por commission vs discount
**Semana 7-8:** Posts 5 y 6 + revisión métricas gate (¿CTR≥1.5%? ¿Telegram≥30? ¿ticket medio≥35€?) → decidir si escalar o pivotar

---

## 10. Riesgos

- Google no indexa posts en 2 semanas → mitigar con sitemap `sitemap.xml:44` + Search Console manual fetch + internal linking desde homepage.
- Telegram sigue sin suscriptores aunque se promocione → fallback: priorizar newsletter (ya tienes `RESEND_API_KEY` verificada).
- AE bloquea API → fallback a `manualPrice` del Sheet (ya es precedencia).
- Ticket medio no sube porque Amazon bloquea fetch de high-ticket → usar AE high-ticket como contrapeso (ya hay Goture 35€, KUAISHA 26€).

---

## 11. Fuera de alcance (no en este spec)

- Nueva store (Decathlon re-activación, otras UK)
- Ads pagados, TikTok, YouTube
- Cambio de `commissionRate` (negociar con Amazon/AE)
- Migración DB o cambio de hosting

---

**Siguiente paso:** tras tu revisión de este spec, invocar `writing-plans` para plan de implementación detallado por componente con orden y dependencias.
