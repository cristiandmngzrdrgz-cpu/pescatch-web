import 'dotenv/config'
import { getDb } from '../src/lib/db'

type DbRow = Record<string, unknown>

async function getImageFromDecathlon(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Try JSON-LD first
    const jsonLd = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd[1])
        if (data.image) return Array.isArray(data.image) ? data.image[0] : data.image
      } catch {}
    }

    // Try og:image
    const ogM = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    if (ogM) return ogM[1]

    // Try product image from Decathlon CDN
    const cdnM = html.match(/src="(https:\/\/contents\.mediadecathlon\.com\/[^"]+\/picture\.jpg[^"]*)"/i)
    if (cdnM) return cdnM[1]

    // Try any large image
    const imgM = html.match(/<img[^>]+src="(https:[^"]+\.(jpg|jpeg|png|webp)[^"]*?)"[^>]*style="[^"]*(display\s*:\s*block|visibility\s*:\s*visible)[^"]*"/i)
    if (imgM) return imgM[1]

    return null
  } catch {
    return null
  }
}

async function getImageFromAliExpress(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    const ogM = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    if (ogM) return ogM[1]

    const imgM = html.match(/<img[^>]+class="[^"]*product-img[^"]*"[^>]+src="([^"]+)"/i)
    if (imgM) return imgM[1]

    return null
  } catch {
    return null
  }
}

async function main() {
  const db = getDb()
  const result = await db.execute(`
    SELECT id, productId, title, storeId, affiliateUrl FROM deals
    WHERE (imageUrl = '' OR imageUrl IS NULL) AND hidden = 0
  `)

  console.log(`${result.rows.length} deals to process\n`)

  let ok = 0
  let fail = 0

  for (const row of result.rows) {
    const r = row as DbRow
    const id = r.id as string
    const productId = r.productId as string
    const title = r.title as string
    const storeId = r.storeId as string
    const url = r.affiliateUrl as string

    process.stdout.write(`  ${storeId.slice(0, 10)} | ${(title as string).slice(0, 40)}... `)

    let imageUrl: string | null = null
    if (storeId === 'decathlon') {
      imageUrl = await getImageFromDecathlon(url)
    } else if (storeId === 'aliexpress') {
      imageUrl = await getImageFromAliExpress(url)
    }

    if (imageUrl) {
      await db.execute({
        sql: "UPDATE deals SET imageUrl = ?, images = ?, updatedAt = datetime('now') WHERE id = ?",
        args: [imageUrl, JSON.stringify([imageUrl]), id],
      })
      await db.execute({
        sql: "UPDATE products SET imageUrl = ?, images = ?, updatedAt = datetime('now') WHERE id = ?",
        args: [imageUrl, JSON.stringify([imageUrl]), productId],
      })
      console.log(`✅ ${imageUrl.slice(0, 60)}`)
      ok++
    } else {
      console.log('❌')
      fail++
    }
  }

  console.log(`\n✅ ${ok} imágenes encontradas, ${fail} sin imagen`)
}

main().catch(console.error)
