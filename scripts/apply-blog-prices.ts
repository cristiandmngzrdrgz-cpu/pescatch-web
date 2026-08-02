import * as fs from 'fs'
import { getDb } from '../src/lib/db'

function getAsinFromItem(item: any): string | null {
  if (item.asin) return item.asin
  const url = item.stores?.[0]?.url || ''
  const m = url.match(/\/dp\/([A-Z0-9]{10})/)
  return m ? m[1] : null
}

function formatPrice(price: number, original: string | null): string {
  if (original && original.includes(',')) {
    return price.toFixed(2).replace('.', ',') + '€'
  }
  if (original && original.includes('~')) {
    return '~' + Math.round(price) + '€'
  }
  if (original && original.includes('-')) {
    return Math.round(price) + '€'
  }
  if (Number.isInteger(price)) return price + '€'
  return price.toFixed(2).replace('.', ',') + '€'
}

async function main() {
  const db = getDb()

  const cachePath = 'scripts/blog-price-cache.json'
  const cached: Record<string, number | 'notfound'> = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))

  const deals = await db.execute("SELECT asin, salePrice, originalPrice FROM deals WHERE status='published' AND asin != ''")
  const dealMap = new Map<string, { salePrice: number; originalPrice: number | null }>()
  for (const d of deals.rows) dealMap.set(d.asin as string, { salePrice: d.salePrice as number, originalPrice: (d.originalPrice as number) || null })

  function currentPrice(asin: string): { price: number; originalPrice: number | null } | null {
    const d = dealMap.get(asin)
    if (d) return { price: d.salePrice, originalPrice: d.originalPrice }
    const c = cached[asin]
    if (typeof c === 'number') return { price: c, originalPrice: null }
    return null
  }

  const posts = await db.execute("SELECT slug, content FROM posts WHERE status='published'")
  let totalChanges = 0

  for (const p of posts.rows) {
    const slug = p.slug as string
    let content = p.content as string
    const match = content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
    if (!match) continue

    const items = JSON.parse(match[1])
    const updated: any[] = []
    const log: string[] = []

    for (const item of items) {
      const asin = getAsinFromItem(item)
      const cur = asin ? currentPrice(asin) : null
      if (!cur) {
        updated.push(item)
        log.push(`  [${item.title}] SIN DATO (asin=${asin ?? '-'})`)
        continue
      }
      const oldPrice = item.price || item.stores?.[0]?.price || ''
      const newPriceStr = formatPrice(cur.price, oldPrice ? String(oldPrice) : null)
      const newItem = JSON.parse(JSON.stringify(item))
      newItem.price = newPriceStr
      if (newItem.stores && newItem.stores[0]) newItem.stores[0].price = newPriceStr
      updated.push(newItem)
      log.push(`  [${item.title}] ${oldPrice} -> ${newPriceStr} (asin=${asin})`)
      totalChanges++
    }

    const newProductsData = JSON.stringify(updated)
    const newContent = content.replace(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/, `<!-- PRODUCTS_DATA: ${newProductsData} -->`)

    await db.execute({
      sql: 'UPDATE posts SET content = ? WHERE slug = ?',
      args: [newContent, slug],
    })
    console.log(`\n=== ${slug}`)
    log.forEach((l) => console.log(l))
  }

  console.log(`\nTotal cambios: ${totalChanges}`)
  db.close()
}
main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
