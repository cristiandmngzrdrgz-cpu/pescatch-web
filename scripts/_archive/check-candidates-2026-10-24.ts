// PROPÓSITO: Verificar precio/stock reales de los candidatos pendientes Okuma/Daiwa
//            contra la ficha de Amazon antes de aprobarlos. Sin tachado real no se
//            inventa originalPrice (regla del proyecto).
// FECHA: 2026-10-24
// Uso: npx tsx scripts/check-candidates-2026-10-24.ts [--apply]
//   --apply  corrige price/originalPrice en pending_candidates con lo verificado

import 'dotenv/config'
import { initSchema, migrateSchema, getDb } from '../../src/lib/db'
import { scrapeAmazon } from '../../src/lib/price-scraper/amazon'

interface Row {
  id: number
  asin: string
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  category: string
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  const apply = process.argv.includes('--apply')

  await initSchema()
  await migrateSchema()
  const db = getDb()

  const res = await db.execute("SELECT id, asin, title, price, originalPrice, rating, reviews, category FROM pending_candidates WHERE status='pending' ORDER BY score DESC")
  const rows = res.rows as unknown as Row[]

  if (rows.length === 0) {
    console.log('No hay candidatos pendientes.')
    return
  }

  console.log(`Verificando ${rows.length} candidatos contra Amazon...\n`)

  for (const c of rows) {
    const url = `https://www.amazon.es/dp/${c.asin}`
    let out = ''
    try {
      const scraped = await scrapeAmazon(c.asin, c.title, url)
      if (!scraped) {
        out = '❓ sin resultado (bloqueo/timeout) — no se toca'
      } else if (scraped.notAvailable) {
        out = '❌ NO DISPONIBLE — rechazar'
      } else {
        const diff = Math.abs(scraped.price - c.price) >= 0.01
        const pct = scraped.originalPrice
          ? (((scraped.originalPrice - scraped.price) / scraped.originalPrice) * 100).toFixed(1)
          : '0.0'
        out = `${diff ? '⚠️ precio cambia' : '✅ precio OK'} | real ${scraped.price.toFixed(2)}€ | tachado ${scraped.originalPrice ? scraped.originalPrice.toFixed(2) + '€ (−' + pct + '%)' : '—'} | stock ${scraped.stock}`

        if (apply && !scraped.notAvailable) {
          await db.execute({
            sql: "UPDATE pending_candidates SET price=?, originalPrice=?, updated_at=datetime('now') WHERE id=?",
            args: [scraped.price, scraped.originalPrice ?? null, c.id],
          })
          out += ' → actualizado'
        }
      }
    } catch (err) {
      out = `❌ error: ${err instanceof Error ? err.message : String(err)}`
    }

    console.log(`[${c.id}] ${c.asin} ${c.title.slice(0, 55)}`)
    console.log(`      candidato ${c.price.toFixed(2)}€ | ${out}\n`)

    await sleep(3000)
  }

  if (!apply) console.log('DRY-RUN. Ejecuta con --apply para guardar price/originalPrice verificados.')
}

main().catch(e => { console.error(e); process.exit(1) })
