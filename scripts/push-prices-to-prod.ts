import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'
import * as fs from 'fs'
import { createClient } from '@libsql/client'
import type { Client, InValue } from '@libsql/client'
import { getDb } from '../src/lib/db'

const PRICE_FIELDS = [
  'salePrice', 'originalPrice', 'discountPercent',
  'shippingCost', 'stockStatus', 'priceAlert',
] as const

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

async function syncDeletedDeals(
  prod: Client,
  _local: Client,
  apply: boolean,
): Promise<string[]> {
  const file = path.resolve(process.cwd(), 'data', 'removed-deals.json')
  if (!fs.existsSync(file)) {
    console.log(`\nNo hay deals pendientes de eliminar en producción.`)
    return []
  }

  const removedIds = JSON.parse(fs.readFileSync(file, 'utf8')) as string[]
  if (removedIds.length === 0) {
    console.log(`\nNo hay deals pendientes de eliminar en producción.`)
    return []
  }

  const detail: string[] = []
  let count = 0
  let remaining: string[] = []
  for (const id of removedIds) {
    const prodRes = await prod.execute({ sql: 'SELECT id, slug, title FROM deals WHERE id = ?', args: [id] })
    let prodRow = prodRes.rows[0] as unknown as Record<string, any> | undefined
    if (!prodRow) {
      const slugRes = await prod.execute({ sql: 'SELECT id, slug, title FROM deals WHERE slug = ?', args: [id] })
      prodRow = slugRes.rows[0] as unknown as Record<string, any> | undefined
    }
    if (!prodRow) continue

    const title = String(prodRow.title || '')
    const slug = String(prodRow.slug || '')

    count++
    if (apply) {
      await prod.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: [String(prodRow.id)] })
    } else {
      remaining.push(id)
    }
    detail.push(`🗑️ ${title.slice(0, 40)} (${slug})`)
  }

  if (count > 0) {
    console.log(`\nDeals a ELIMINAR en producción: ${count}`)
  } else {
    console.log(`\nNinguno de los deals pendientes existe en producción.`)
  }

  if (apply) {
    const newList = removedIds.filter(id => remaining.includes(id))
    if (newList.length === 0) {
      fs.unlinkSync(file)
    } else {
      fs.writeFileSync(file, JSON.stringify(newList, null, 2))
    }
  }

  return detail
}

async function main() {
  loadProdEnv()
  const apply = process.argv.includes('--apply')

  const prod = getDb()
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido. Revisa .env.vercel')
    process.exit(1)
  }
  console.log(`Destino: TURSO (${process.env.TURSO_DATABASE_URL.split('?')[0]})`)
  console.log(`Modo: ${apply ? 'APLICADO' : 'DRY-RUN (usar --apply)'}`)

  const local = localDb()
  const localDeals = await local.execute({
    sql: `SELECT id, productId, slug, title, storeId, updatedAt, ${PRICE_FIELDS.join(', ')}
      FROM deals
      WHERE status = 'published'`,
  })

  const today = new Date().toISOString().split('T')[0]
  let withChanges = 0
  let notFound = 0
  const detail: string[] = []

  for (const raw of localDeals.rows) {
    const localRow = raw as unknown as Record<string, any>
    const id = String(localRow.id)
    const slug = String(localRow.slug || '')
    const title = String(localRow.title || '')

    const prodRes = await prod.execute({ sql: 'SELECT id FROM deals WHERE id = ?', args: [id] })
    let prodId = prodRes.rows[0]?.id
    if (!prodId && slug) {
      const bySlug = await prod.execute({ sql: 'SELECT id FROM deals WHERE slug = ?', args: [slug] })
      prodId = bySlug.rows[0]?.id
    }
    if (!prodId && localRow.productId) {
      const byProduct = await prod.execute({
        sql: 'SELECT id FROM deals WHERE productId = ? AND storeId = ?',
        args: [String(localRow.productId), String(localRow.storeId)],
      })
      prodId = byProduct.rows[0]?.id
    }
    if (!prodId) {
      notFound++
      continue
    }

    const prodRowRes = await prod.execute({
      sql: `SELECT ${PRICE_FIELDS.join(', ')} FROM deals WHERE id = ?`,
      args: [String(prodId)],
    })
    if (prodRowRes.rows.length === 0) { notFound++; continue }
    const prodRow = prodRowRes.rows[0] as unknown as Record<string, any>

    const sets: string[] = []
    const args: InValue[] = []
    const changed: string[] = []
    for (const f of PRICE_FIELDS) {
      const lv = localRow[f]
      const pv = prodRow[f]
      const same = String(lv) === String(pv)
      if (same) continue
      sets.push(`${f} = ?`)
      args.push(lv as InValue)
      changed.push(f)
    }

    if (changed.length === 0) {
      const phExists = await prod.execute({
        sql: 'SELECT COUNT(*) as c FROM price_history WHERE dealId = ? AND date = ?',
        args: [String(prodId), today],
      })
      if (Number((phExists.rows[0] as any)?.c ?? 0) === 0) {
        detail.push(`+ ${title.slice(0, 40)} -> price_history ${today} (sin cambio de precio)`)
      }
      continue
    }

    withChanges++

    if (apply) {
      sets.push("updatedAt = datetime('now')")
      args.push(String(prodId))
      await prod.execute({ sql: `UPDATE deals SET ${sets.join(', ')} WHERE id = ?`, args })
    }

    detail.push(`- ${title.slice(0, 40)} -> ${changed.join(', ')}`)

    const phExists = await prod.execute({
      sql: 'SELECT COUNT(*) as c FROM price_history WHERE dealId = ? AND date = ?',
      args: [String(prodId), today],
    })
    if (Number((phExists.rows[0] as any)?.c ?? 0) === 0 && apply) {
      await prod.execute({
        sql: 'INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
        args: [String(prodId), today, Number(localRow.salePrice)],
      })
    }
  }

  console.log(`\nDeals a actualizar en producción: ${withChanges}`)
  console.log(`Deals no encontrados en Turso: ${notFound}`)
  if (detail.length > 0) console.log('\n' + detail.join('\n'))

  const removedDetail = await syncDeletedDeals(prod, local, apply)
  if (removedDetail.length > 0) console.log('\n' + removedDetail.join('\n'))

  if (!apply) console.log('\nEjecuta con --apply para escribir en Turso.')
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
