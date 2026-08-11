// PROPÓSITO: Push candidatos de pending_candidates desde la DB local a Turso,
//            para que el panel /admin/candidates (que lee Turso) los vea.
// FECHA: 2026-08-07
import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function localDb(): Client {
  const dbPath = path.resolve(process.cwd(), 'data', 'pescatch.db')
  const fileUrl = dbPath.startsWith('/') ? `file:${dbPath}` : `file:///${dbPath.replace(/\\/g, '/')}`
  return createClient({ url: fileUrl })
}

const FIELDS = [
  'asin', 'title', 'price', 'originalPrice', 'rating', 'reviews',
  'url', 'keyword', 'category', 'imageUrl', 'brand', 'ean', 'score', 'source',
] as const

async function main() {
  loadProdEnv()
  const apply = process.argv.includes('--apply')

  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido. Revisa .env.vercel')
    process.exit(1)
  }
  console.log(`Destino: TURSO (${process.env.TURSO_DATABASE_URL.split('?')[0]})`)
  console.log(`Modo: ${apply ? 'APLICADO' : 'DRY-RUN (usar --apply)'}`)

  const local = localDb()
  const localRows = await local.execute({
    sql: `SELECT * FROM pending_candidates WHERE status = 'pending' ORDER BY score DESC`,
  })

  const prod = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

  let toInsert = 0
  let updated = 0
  let notFound = 0
  const detail: string[] = []

  for (const raw of localRows.rows) {
    const row = raw as unknown as Record<string, any>
    const url = String(row.url || '')
    const title = String(row.title || '').slice(0, 60)

    if (!url) {
      notFound++
      continue
    }

    const existing = await prod.execute({
      sql: 'SELECT * FROM pending_candidates WHERE url = ?',
      args: [url],
    })

    if (existing.rows.length > 0) {
      const prodId = String(existing.rows[0].id)
      const sets: string[] = []
      const args: any[] = []
      for (const f of FIELDS) {
        const lv = row[f]
        const pv = (existing.rows[0] as any)[f]
        if (String(lv) === String(pv)) continue
        sets.push(`${f} = ?`)
        args.push(lv ?? null)
      }
      if (sets.length > 0) {
        updated++
        sets.push("updated_at = datetime('now')")
        args.push(prodId)
        if (apply) {
          await prod.execute({ sql: `UPDATE pending_candidates SET ${sets.join(', ')} WHERE id = ?`, args })
        }
        detail.push(`~ ${title} -> ${sets.slice(0, -1).join(', ')}`)
      }
      continue
    }

    toInsert++
    if (apply) {
      await prod.execute({
        sql: `INSERT INTO pending_candidates (${FIELDS.join(', ')}, status, created_at, updated_at)
              VALUES (${FIELDS.map(() => '?').join(', ')}, 'pending', datetime('now'), datetime('now'))`,
        args: FIELDS.map(f => row[f] ?? null),
      })
    }
    detail.push(`+ ${title}`)
  }

  console.log(`\nCandidatos a INSERTAR en Turso: ${toInsert}`)
  console.log(`Candidatos a ACTUALIZAR: ${updated}`)
  console.log(`Sin URL (saltados): ${notFound}`)
  if (detail.length > 0) console.log('\n' + detail.join('\n'))

  if (!apply) console.log('\nEjecuta con --apply para escribir en Turso.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
