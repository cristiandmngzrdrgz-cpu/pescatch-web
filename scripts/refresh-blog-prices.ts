import { type Page } from 'playwright'
import { launchBraveContext, setupStealthPage } from '../src/lib/scraping-utils'
import { getDb } from '../src/lib/db'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function scrapeAmazonPrice(page: Page, asin: string): Promise<{ price: number; notFound: boolean }> {
  await page.goto(`https://www.amazon.es/dp/${asin}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await sleep(2500)

  for (let i = 0; i < 120; i++) {
    const state = await page.evaluate(() => {
      const text = document.body?.textContent?.slice(0, 800).toLowerCase() || ''
      if (text.includes('captcha') || text.includes('verificación') || text.includes('verify') || text.includes('robot')) return 'captcha'
      if (document.getElementById('productTitle')) return 'ok'
      if (text.includes('no encontramos') || text.includes('désolé') || text.includes('no longer available')) return 'notfound'
      return 'waiting'
    })
    if (state === 'captcha') {
      console.log(`   ⚠️ Captcha en ${asin}. Resuélvelo (${120 - i}s restantes)...`)
      await sleep(1000)
      continue
    }
    if (state === 'ok') break
    if (state === 'notfound') return { price: 0, notFound: true }
    await sleep(1000)
  }

  await sleep(1500)

  for (let attempt = 0; attempt < 3; attempt++) {
    const price = await page.evaluate(() => {
      const selectors = [
        '#corePrice_feature_div .a-price .a-offscreen',
        '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
        '#apex_desktop #price_inside_buybox',
        '#price_inside_buybox',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#corePrice_feature_div .a-offscreen',
        '#corePriceDisplay_feature_div .a-offscreen',
        '.a-price .a-offscreen',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        const t = el?.textContent?.trim()
        if (!t) continue
        const m = t.match(/[\d.,]+/)
        if (!m) continue
        const num = parseFloat(m[0].replace(/\./g, '').replace(',', '.'))
        if (!isNaN(num) && num > 0) return Math.round(num * 100) / 100
      }
      const whole = document.querySelector('.a-price-whole')
      if (whole) {
        const w = parseInt((whole.textContent || '').replace(/[^0-9]/g, ''), 10)
        const frac = parseInt((document.querySelector('.a-price-fraction')?.textContent || '').replace(/[^0-9]/g, ''), 10) || 0
        if (w > 0) return Math.round((w + frac / 100) * 100) / 100
      }
      return 0
    })
    if (price > 0) return { price, notFound: false }
    await sleep(2000)
  }

  return { price: 0, notFound: false }
}

async function main() {
  const db = getDb()
  const posts = await db.execute("SELECT slug, relatedAsins, content FROM posts WHERE status='published'")

  const asinSet = new Set<string>()
  for (const p of posts.rows) {
    const asins = JSON.parse((p.relatedAsins as string) || '[]')
    asins.forEach((a: string) => a && asinSet.add(a))
  }
  const allAsins = [...asinSet]

  const ph = allAsins.map(() => '?').join(',')
  const deals = await db.execute({
    sql: `SELECT asin, salePrice, discountPercent, originalPrice, storeId, status FROM deals WHERE asin IN (${ph})`,
    args: allAsins,
  })
  const dealPrice = new Map<string, { salePrice: number; originalPrice: number | null }>()
  for (const d of deals.rows) {
    if (!dealPrice.has(d.asin as string)) {
      dealPrice.set(d.asin as string, { salePrice: d.salePrice as number, originalPrice: (d.originalPrice as number) || null })
    }
  }

  const cachePath = 'scripts/blog-price-cache.json'
  const fs = await import('fs')
  const cached: Record<string, number | 'notfound'> = fs.existsSync(cachePath)
    ? JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    : {}

  const toScrape = allAsins.filter((a) => !dealPrice.has(a) && !(a in cached))
  console.log(`ASINs totales: ${allAsins.length}`)
  console.log(`Con deal en DB: ${dealPrice.size}`)
  console.log(`En cache: ${allAsins.length - toScrape.length - dealPrice.size}`)
  console.log(`A scrapear: ${toScrape.length}`)

  if (toScrape.length > 0) {
    console.log('\nLanzando Brave para scrapear precios actuales...')
    const context = await launchBraveContext('brave-amazon-profile')
    try {
      const page = context.pages()[0] || (await context.newPage())
      await setupStealthPage(page)
      for (const asin of toScrape) {
        process.stdout.write(`  ${asin}... `)
        const res = await scrapeAmazonPrice(page, asin)
        if (res.notFound) {
          cached[asin] = 'notfound'
          console.log('NOT FOUND')
        } else if (res.price > 0) {
          cached[asin] = res.price
          console.log(`${res.price}€`)
        } else {
          console.log('SIN PRECIO')
        }
        fs.writeFileSync(cachePath, JSON.stringify(cached, null, 2))
        await sleep(3000)
      }
    } finally {
      await context.close()
    }
  }

  console.log('\n=== RESUMEN PREÇIOS ACTUALES ===')
  for (const a of allAsins) {
    const d = dealPrice.get(a)
    if (d) console.log(`${a} | DB deal: ${d.salePrice}€ (antes ${d.originalPrice ?? '-'}€)`)
    else {
      const c = cached[a]
      console.log(`${a} | ${c === 'notfound' ? 'NOT FOUND' : c ? c + '€ (scraped)' : 'SIN DATO'}`)
    }
  }
  db.close()
}
main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
