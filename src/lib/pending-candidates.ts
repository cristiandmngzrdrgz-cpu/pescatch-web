import { getDb } from './db'

export interface PendingCandidate {
  id: number
  asin: string
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  keyword: string
  category: string
  imageUrl: string | null
  brand: string | null
  ean: string | null
  score: number
  source: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

const AMAZON_ASIN_RE = /\/dp\/(B0[A-Z0-9]{8})/i
const AE_ITEM_RE = /\/item\/(\d+)(?:\.html)?/i

// Un candidato ya rechazado solo vuelve a entrar si su precio ha caído al menos
// un 10% respecto a la última vez que se vio (evita re-llenar el panel de dups).
const REENTRY_PRICE_DROP = 0.9

interface KnownRow {
  status: PendingCandidate['status']
  price: number
}

function keysFromUrl(url: string): { asin: string; aeId: string } {
  const asin = url.match(AMAZON_ASIN_RE)?.[1]?.toUpperCase() ?? ''
  const aeId = url.match(AE_ITEM_RE)?.[1] ?? ''
  return { asin, aeId }
}

/**
 * Snapshot de lo ya conocido: candidatos en cualquier estado + ASINs/PIDs que
 * ya son deals. Sirve para no volver a guardar lo que ya se trió o publicó.
 */
async function loadKnown(): Promise<{
  byUrl: Map<string, KnownRow>
  byKey: Map<string, KnownRow>
  dealKeys: Set<string>
}> {
  const db = getDb()
  const [candidateRows, dealRows] = await Promise.all([
    db.execute('SELECT url, asin, status, price FROM pending_candidates ORDER BY id DESC'),
    db.execute('SELECT asin, affiliateUrl, storeUrl FROM deals'),
  ])

  const byUrl = new Map<string, KnownRow>()
  const byKey = new Map<string, KnownRow>()

  for (const row of candidateRows.rows) {
    const known: KnownRow = {
      status: row.status as PendingCandidate['status'],
      price: Number(row.price) || 0,
    }
    const url = String(row.url || '').trim().toLowerCase()
    if (url && !byUrl.has(url)) byUrl.set(url, known)

    const { asin, aeId } = keysFromUrl(String(row.url || ''))
    const key = asin || aeId
    if (key && !byKey.has(key)) byKey.set(key, known)
  }

  const dealKeys = new Set<string>()
  for (const row of dealRows.rows) {
    const asinCol = String(row.asin || '').toUpperCase()
    if (asinCol) dealKeys.add(asinCol)
    for (const url of [row.affiliateUrl, row.storeUrl]) {
      const { asin, aeId } = keysFromUrl(String(url || ''))
      if (asin) dealKeys.add(asin)
      if (aeId) dealKeys.add(aeId)
    }
  }

  return { byUrl, byKey, dealKeys }
}

export async function savePendingCandidates(candidates: Omit<PendingCandidate, 'id' | 'status' | 'created_at' | 'updated_at'>[]): Promise<number> {
  const db = getDb()
  const { byUrl, byKey, dealKeys } = await loadKnown()
  let saved = 0

  for (const c of candidates) {
    const urlKey = c.url.trim().toLowerCase()
    const { asin: urlAsin, aeId } = keysFromUrl(c.url)
    const asin = (c.asin || urlAsin).toUpperCase()
    const key = asin || aeId

    // Ya es un deal (publicado o draft): el refresh de precios es el que manda.
    if (key && dealKeys.has(key)) continue

    const known = byUrl.get(urlKey) ?? (key ? byKey.get(key) : undefined)
    let source = c.source

    if (known) {
      const canReenter =
        known.status === 'rejected' &&
        known.price > 0 &&
        c.price > 0 &&
        c.price <= known.price * REENTRY_PRICE_DROP

      if (!canReenter) continue

      const drop = Math.round((1 - c.price / known.price) * 100)
      source = `${c.source} · revisado -${drop}%`
    }

    await db.execute({
      sql: `INSERT INTO pending_candidates (asin, title, price, originalPrice, rating, reviews, url, keyword, category, imageUrl, brand, ean, score, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        c.asin, c.title, c.price, c.originalPrice, c.rating, c.reviews,
        c.url, c.keyword, c.category, c.imageUrl, c.brand, c.ean, c.score, source,
      ],
    })
    saved++

    // Dedup dentro de la misma tanda: el primero que entra gana.
    const seen: KnownRow = { status: 'pending', price: c.price }
    byUrl.set(urlKey, seen)
    if (key) byKey.set(key, seen)
  }

  return saved
}

export async function getPendingCandidates(limit = 50): Promise<PendingCandidate[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT * FROM pending_candidates WHERE status = 'pending' ORDER BY score DESC LIMIT ?`,
    args: [limit],
  })

  return result.rows.map(row => ({
    id: row.id as number,
    asin: row.asin as string,
    title: row.title as string,
    price: row.price as number,
    originalPrice: row.originalPrice as number | null,
    rating: row.rating as number,
    reviews: row.reviews as number,
    url: row.url as string,
    keyword: row.keyword as string,
    category: row.category as string,
    imageUrl: row.imageUrl as string | null,
    brand: row.brand as string | null,
    ean: row.ean as string | null,
    score: row.score as number,
    source: row.source as string,
    status: row.status as PendingCandidate['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))
}

export async function getCandidateById(id: number): Promise<PendingCandidate | null> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM pending_candidates WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as number,
    asin: row.asin as string,
    title: row.title as string,
    price: row.price as number,
    originalPrice: row.originalPrice as number | null,
    rating: row.rating as number,
    reviews: row.reviews as number,
    url: row.url as string,
    keyword: row.keyword as string,
    category: row.category as string,
    imageUrl: row.imageUrl as string | null,
    brand: row.brand as string | null,
    ean: row.ean as string | null,
    score: row.score as number,
    source: row.source as string,
    status: row.status as PendingCandidate['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export async function approveCandidate(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: `UPDATE pending_candidates SET status = 'approved', updated_at = datetime('now') WHERE id = ?`,
    args: [id],
  })
  return (result.rowsAffected ?? 0) > 0
}

export async function rejectCandidate(id: number): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({
    sql: `UPDATE pending_candidates SET status = 'rejected', updated_at = datetime('now') WHERE id = ?`,
    args: [id],
  })
  return (result.rowsAffected ?? 0) > 0
}

export async function getApprovedCandidates(): Promise<PendingCandidate[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT * FROM pending_candidates WHERE status = 'approved' ORDER BY score DESC`,
  })

  return result.rows.map(row => ({
    id: row.id as number,
    asin: row.asin as string,
    title: row.title as string,
    price: row.price as number,
    originalPrice: row.originalPrice as number | null,
    rating: row.rating as number,
    reviews: row.reviews as number,
    url: row.url as string,
    keyword: row.keyword as string,
    category: row.category as string,
    imageUrl: row.imageUrl as string | null,
    brand: row.brand as string | null,
    ean: row.ean as string | null,
    score: row.score as number,
    source: row.source as string,
    status: row.status as PendingCandidate['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))
}

export async function getCandidateCount(): Promise<{ pending: number; approved: number; rejected: number }> {
  const db = getDb()

  const pending = await db.execute({ sql: "SELECT COUNT(*) as count FROM pending_candidates WHERE status = 'pending'" })
  const approved = await db.execute({ sql: "SELECT COUNT(*) as count FROM pending_candidates WHERE status = 'approved'" })
  const rejected = await db.execute({ sql: "SELECT COUNT(*) as count FROM pending_candidates WHERE status = 'rejected'" })

  return {
    pending: Number(pending.rows[0]?.count) || 0,
    approved: Number(approved.rows[0]?.count) || 0,
    rejected: Number(rejected.rows[0]?.count) || 0,
  }
}
