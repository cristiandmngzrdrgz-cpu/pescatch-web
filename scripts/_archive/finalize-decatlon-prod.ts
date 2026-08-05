import 'dotenv/config'
import { config } from 'dotenv'
import { getDb } from '../src/lib/db'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) process.env[key] = value
  }
}

async function main() {
  loadProdEnv()
  const apply = process.argv.includes('--apply')
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]

  const updates: Record<string, { price: number }> = {
    'https://www.decathlon.es/es/p/asiento-pesca-silla-plegable-essenseat-500-adjust/334474/m8658748': { price: 89.99 },
    'https://www.decathlon.es/es/p/carrete-pesca-mar-premium-pro-black-gold-7000/X8539136/m8539136': { price: 59.99 },
  }
  const deletes = [
    'https://www.decathlon.es/es/p/cana-pesca-senuelos-mar-vengeance-cx-spinning-2-40-m-m-10-35-g/369306/m8952646',
    'https://www.decathlon.es/es/p/cana-pesca-lubina-senuelos-legalis-sb-902-hfs-2-73-m-14-42-g/383832/m9013110',
  ]

  console.log(`Modo: ${apply ? 'APLICADO' : 'DRY-RUN (--apply)'}`)

  const rows = await db.execute(
    "SELECT id, title, salePrice, originalPrice, affiliateUrl FROM deals WHERE storeId='decathlon' AND status='published'"
  )
  const deals = rows.rows as unknown as Record<string, unknown>[]

  for (const deal of deals) {
    const id = String(deal.id)
    const url = String(deal.affiliateUrl || '')
    const title = String(deal.title || '')

    if (deletes.includes(url)) {
      if (apply) await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: [id] })
      console.log(`🗑️ ${title} — borrar (producto no disponible)`)
      continue
    }

    const upd = updates[url]
    if (!upd) continue

    const currentPrice = Number(deal.salePrice)
    const currentOriginalPrice = Number(deal.originalPrice)
    const newPrice = upd.price
    const originalPrice = currentOriginalPrice > newPrice ? currentOriginalPrice : newPrice
    const discountPercent = Math.round(((originalPrice - newPrice) / (originalPrice || 1)) * 100)

    if (apply) {
      await db.execute({
        sql: 'UPDATE deals SET salePrice = ?, originalPrice = ?, discountPercent = ?, updatedAt = datetime(\'now\') WHERE id = ?',
        args: [newPrice, originalPrice, discountPercent, id],
      })
      const ph = await db.execute({
        sql: 'SELECT COUNT(*) as c FROM price_history WHERE dealId = ? AND date = ?',
        args: [id, today],
      })
      if (Number((ph.rows[0] as any)?.c ?? 0) === 0) {
        await db.execute({
          sql: 'INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
          args: [id, today, newPrice],
        })
      }
    }
    console.log(`✅ ${title} — ${currentPrice}€ → ${newPrice}€`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
