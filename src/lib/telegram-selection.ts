import type { InValue } from '@libsql/client'
import { getDb } from './db'
import { DISABLED_STORES } from '../data/queries'

// Selección compartida por el digest semanal, las novedades del miércoles y
// los scripts locales. Reglas:
// - Solo deals publicados, con precio, en stock y de tiendas activas.
// - Rotación: un deal enviado no vuelve a salir en 21 días.
// - Digest: hasta 5 recientes (14 días) + los mejores antiguos por comisión.
// - Novedades: solo últimos 7 días; si faltan, rellena con el pool del digest.
// - Garantiza al menos 1 Amazon y 1 AliExpress cuando existen candidatos.

export type TelegramSelectionMode = 'digest' | 'fresh'

export interface TelegramDealCandidate {
  id: string
  title: string
  salePrice: number
  originalPrice: number
  discountPercent: number
  storeName: string
  storeId: string
  slug: string
  commission: number
  createdAt: string
  isRecent: number
}

const ROTATION_DAYS = 21
const DIGEST_RECENT_DAYS = 14
const FRESH_DAYS = 7
const DIGEST_RECENT_QUOTA = 5
const MAX_POOL = 200

interface FetchOptions {
  sinceDays?: number
  ignoreRotation?: boolean
  storeId?: string
  order?: 'digest' | 'fresh'
}

async function fetchCandidates(options: FetchOptions = {}): Promise<TelegramDealCandidate[]> {
  const db = getDb()
  const storePlaceholders = DISABLED_STORES.map(() => '?').join(',')
  const where: string[] = [
    `d.status = 'published'`,
    `d.salePrice > 0`,
    `COALESCE(d.stockStatus, 'in_stock') != 'out_of_stock'`,
    `(d.expiresAt IS NULL OR d.expiresAt = '' OR julianday(d.expiresAt) >= julianday('now'))`,
  ]
  const whereArgs: InValue[] = []

  if (DISABLED_STORES.length > 0) {
    where.push(`d.storeId NOT IN (${storePlaceholders})`)
    whereArgs.push(...DISABLED_STORES)
  }
  if (options.storeId) {
    where.push('d.storeId = ?')
    whereArgs.push(options.storeId)
  }
  if (options.sinceDays) {
    where.push(`julianday(d.createdAt) >= julianday('now', ?)`)
    whereArgs.push(`-${options.sinceDays} days`)
  }
  if (!options.ignoreRotation) {
    where.push(`NOT EXISTS (
      SELECT 1 FROM telegram_sent_deals t
      WHERE t.dealId = d.id
        AND julianday(t.sentAt) >= julianday('now', ?)
    )`)
    whereArgs.push(`-${ROTATION_DAYS} days`)
  }

  const order =
    options.order === 'fresh'
      ? `julianday(d.createdAt) DESC,
         CASE WHEN d.originalPrice > d.salePrice THEN 0 ELSE 1 END ASC,
         d.commission DESC`
      : `CASE WHEN d.originalPrice > d.salePrice THEN 0 ELSE 1 END ASC,
         d.commission DESC,
         d.discountPercent DESC,
         julianday(d.createdAt) DESC`

  const result = await db.execute({
    sql: `SELECT d.id, d.title, d.salePrice, d.originalPrice, d.discountPercent,
                 d.storeName, d.storeId, d.slug, d.commission, d.createdAt,
                 CASE WHEN julianday(d.createdAt) >= julianday('now', ?) THEN 1 ELSE 0 END AS isRecent
          FROM deals d
          WHERE ${where.join(' AND ')}
          ORDER BY ${order}
          LIMIT ?`,
    args: [`-${DIGEST_RECENT_DAYS} days`, ...whereArgs, MAX_POOL],
  })

  return result.rows as unknown as TelegramDealCandidate[]
}

function pickDigest(candidates: TelegramDealCandidate[], limit: number): TelegramDealCandidate[] {
  if (limit <= 0) return []
  const recent = candidates.filter(c => Number(c.isRecent) === 1)
  const older = candidates.filter(c => Number(c.isRecent) !== 1)
  const picked: TelegramDealCandidate[] = []

  for (const deal of recent.slice(0, Math.min(DIGEST_RECENT_QUOTA, limit))) {
    picked.push(deal)
  }
  for (const deal of older) {
    if (picked.length >= limit) break
    picked.push(deal)
  }
  for (const deal of recent.slice(DIGEST_RECENT_QUOTA)) {
    if (picked.length >= limit) break
    picked.push(deal)
  }

  return picked
}

function ensureStore(
  picked: TelegramDealCandidate[],
  pool: TelegramDealCandidate[],
  storeId: string,
  limit: number,
  protectedStores: Set<string>,
): TelegramDealCandidate[] {
  if (picked.some(d => d.storeId === storeId)) return picked

  const candidate = pool.find(d => d.storeId === storeId && !picked.some(p => p.id === d.id))
  if (!candidate) return picked

  if (picked.length < limit) return [...picked, candidate]

  for (let i = picked.length - 1; i >= 0; i--) {
    const item = picked[i]
    if (item.storeId === storeId) continue
    // Una tienda protegida solo se puede sustituir si hay más de una unidad:
    // así al añadir AliExpress no nos cargamos el único Amazon.
    if (protectedStores.has(item.storeId)) {
      const sameStoreCount = picked.filter(p => p.storeId === item.storeId).length
      if (sameStoreCount <= 1) continue
    }
    const copy = [...picked]
    copy[i] = candidate
    return copy
  }
  return picked
}

export async function selectTelegramDeals({
  mode,
  limit = 8,
}: {
  mode: TelegramSelectionMode
  limit?: number
}): Promise<TelegramDealCandidate[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 10))
  const allPool = await fetchCandidates()
  let picked: TelegramDealCandidate[]

  if (mode === 'fresh') {
    const fresh = await fetchCandidates({ sinceDays: FRESH_DAYS, order: 'fresh' })
    picked = fresh.slice(0, boundedLimit)
    if (picked.length < boundedLimit) {
      const pickedIds = new Set(picked.map(d => d.id))
      const fill = pickDigest(
        allPool.filter(d => !pickedIds.has(d.id)),
        boundedLimit - picked.length,
      )
      picked.push(...fill)
    }
  } else {
    picked = pickDigest(allPool, boundedLimit)
  }

  // Variedad de tienda: si el pool tiene Amazon/AliExpress, que ambos estén.
  picked = ensureStore(picked, allPool, 'amazon', boundedLimit, new Set())
  picked = ensureStore(picked, allPool, 'aliexpress', boundedLimit, new Set(['amazon']))

  // Último recurso: si la rotación dejó la lista corta, completar con enviados
  // antiguos en vez de publicar un mensaje vacío.
  if (picked.length < boundedLimit) {
    const pickedIds = new Set(picked.map(d => d.id))
    const fallback = await fetchCandidates({ ignoreRotation: true })
    for (const deal of fallback) {
      if (picked.length >= boundedLimit) break
      if (!pickedIds.has(deal.id)) {
        picked.push(deal)
        pickedIds.add(deal.id)
      }
    }
  }

  return picked
}

export async function markTelegramDealsSent(
  deals: Array<{ id: string }>,
  mode: TelegramSelectionMode,
): Promise<void> {
  if (deals.length === 0) return
  const db = getDb()

  for (const deal of deals) {
    await db.execute({
      sql: `INSERT INTO telegram_sent_deals (dealId, sentAt, mode)
            VALUES (?, datetime('now'), ?)
            ON CONFLICT(dealId) DO UPDATE SET
              sentAt = datetime('now'),
              mode = excluded.mode`,
      args: [deal.id, mode],
    })
  }

  // Limpieza oportunista: la rotación solo mira 21 días, no hace falta guardar
  // histórico indefinido.
  await db.execute(
    `DELETE FROM telegram_sent_deals WHERE julianday(sentAt) < julianday('now', '-90 days')`,
  )
}
