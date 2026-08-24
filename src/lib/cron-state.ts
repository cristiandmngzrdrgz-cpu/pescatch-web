import { getDb } from './db'

// Estado persistente de los crons (cursor del refresh chunked, etc.).
// Tabla cron_state: key/value/updated_at. Se crea en initSchema y migrateSchema,
// así que existe tanto en la DB local como en Turso.

export async function getCronState(key: string): Promise<string> {
  const db = getDb()
  const r = await db.execute({
    sql: 'SELECT value FROM cron_state WHERE key = ?',
    args: [key],
  })
  return (r.rows[0]?.value as string) ?? ''
}

export async function setCronState(key: string, value: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT INTO cron_state (key, value, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, value],
  })
}
