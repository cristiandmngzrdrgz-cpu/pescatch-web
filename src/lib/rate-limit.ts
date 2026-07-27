import { getDb } from './db'

interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
}

const configs: Record<string, RateLimitConfig> = {
  comments:   { windowMs: 10_000,          maxAttempts: 1  },
  login:      { windowMs: 15 * 60_000,     maxAttempts: 5  },
  newsletter: { windowMs: 60_000,          maxAttempts: 3  },
  contact:    { windowMs: 60 * 60_000,     maxAttempts: 5  },
  // 1 voto por deal por IP cada 10 minutos (clave incluye el dealId)
  votes:      { windowMs: 10 * 60_000,     maxAttempts: 1  },
}

function getResetAt(windowMs: number): string {
  return new Date(Date.now() + windowMs).toISOString()
}

export async function checkRateLimit(key: string, tier: keyof typeof configs): Promise<boolean> {
  const cfg = configs[tier]
  if (!cfg) return true

  const db = getDb()
  const dbKey = `${tier}:${key}`
  const now = new Date().toISOString()

  // Operación atómica: inserta con count=1 si no existe o expiró,
  // incrementa si existe y no expiró, y en un solo paso comprueba el límite.
  await db.execute({
    sql: `INSERT INTO rate_limits (key, count, reset_at)
          VALUES (?, 1, ?)
          ON CONFLICT(key) DO UPDATE SET
            count = CASE
              WHEN reset_at <= ? THEN 1
              ELSE count + 1
            END,
            reset_at = CASE
              WHEN reset_at <= ? THEN ?
              ELSE reset_at
            END`,
    args: [dbKey, getResetAt(cfg.windowMs), now, now, getResetAt(cfg.windowMs)],
  })

  const row = await db.execute({
    sql: 'SELECT count FROM rate_limits WHERE key = ?',
    args: [dbKey],
  })

  const count = row.rows[0]?.count as number ?? 1
  return count <= cfg.maxAttempts
}

export async function cleanExpiredRateLimits(): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'DELETE FROM rate_limits WHERE reset_at <= ?',
    args: [new Date().toISOString()],
  })
}
