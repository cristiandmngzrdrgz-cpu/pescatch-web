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

export async function savePendingCandidates(candidates: Omit<PendingCandidate, 'id' | 'status' | 'created_at' | 'updated_at'>[]): Promise<number> {
  const db = getDb()
  let saved = 0

  for (const c of candidates) {
    const existing = await db.execute({
      sql: 'SELECT id FROM pending_candidates WHERE url = ? AND status = ?',
      args: [c.url, 'pending'],
    })

    if (existing.rows.length > 0) continue

    await db.execute({
      sql: `INSERT INTO pending_candidates (asin, title, price, originalPrice, rating, reviews, url, keyword, category, imageUrl, brand, ean, score, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        c.asin, c.title, c.price, c.originalPrice, c.rating, c.reviews,
        c.url, c.keyword, c.category, c.imageUrl, c.brand, c.ean, c.score, c.source,
      ],
    })
    saved++
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
