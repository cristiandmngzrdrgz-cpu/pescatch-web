import { getDb } from './db'

interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
}

const configs: Record<string, RateLimitConfig> = {
  comments: { windowMs: 10_000, maxAttempts: 1 },
  login: { windowMs: 15 * 60_000, maxAttempts: 5 },
}

function getResetAt(windowMs: number): string {
  return new Date(Date.now() + windowMs).toISOString()
}

function isExpired(resetAt: string): boolean {
  return new Date(resetAt) <= new Date()
}

export async function checkRateLimit(key: string, tier: keyof typeof configs): Promise<boolean> {
  const cfg = configs[tier]
  if (!cfg) return true

  const db = getDb()
  const dbKey = `${tier}:${key}`

  const row = await db.execute({
    sql: 'SELECT count, reset_at FROM rate_limits WHERE key = ?',
    args: [dbKey],
  })

  if (row.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)',
      args: [dbKey, getResetAt(cfg.windowMs)],
    })
    return true
  }

  const { count, reset_at } = row.rows[0] as unknown as { count: number; reset_at: string }

  if (isExpired(reset_at)) {
    await db.execute({
      sql: 'UPDATE rate_limits SET count = 1, reset_at = ? WHERE key = ?',
      args: [getResetAt(cfg.windowMs), dbKey],
    })
    return true
  }

  if (count >= cfg.maxAttempts) return false

  await db.execute({
    sql: 'UPDATE rate_limits SET count = count + 1 WHERE key = ?',
    args: [dbKey],
  })
  return true
}

export async function cleanExpiredRateLimits(): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'DELETE FROM rate_limits WHERE reset_at <= ?',
    args: [new Date().toISOString()],
  })
}
