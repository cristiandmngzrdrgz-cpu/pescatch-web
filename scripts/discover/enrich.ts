import 'dotenv/config'
import { getDb } from '../../src/lib/db'
import { scrapeAmazonDetails } from './amazon'

interface EnrichTarget {
  id: string
  productId: string
  title: string
  storeId: string
  affiliateUrl: string
  hasImage: boolean
  hasDescription: boolean
  hasSpecs: boolean
  hasReview: boolean
}

type DbRow = Record<string, unknown>

async function getTargets(): Promise<EnrichTarget[]> {
  const db = getDb()
  const result = await db.execute(`
    SELECT id, productId, title, storeId, affiliateUrl,
      CASE WHEN imageUrl != '' AND imageUrl IS NOT NULL THEN 1 ELSE 0 END as hasImage,
      CASE WHEN description != '' AND description IS NOT NULL THEN 1 ELSE 0 END as hasDescription,
      CASE WHEN technicalSpecs != '{}' AND technicalSpecs IS NOT NULL THEN 1 ELSE 0 END as hasSpecs,
      CASE WHEN review != '' AND review IS NOT NULL THEN 1 ELSE 0 END as hasReview
    FROM deals WHERE hidden = 0
    ORDER BY
      CASE WHEN imageUrl = '' OR imageUrl IS NULL THEN 0 ELSE 1 END,
      CASE WHEN description = '' OR description IS NULL THEN 0 ELSE 1 END
  `)
  return result.rows.map(r => {
    const row = r as DbRow
    return {
      id: row.id as string,
      productId: row.productId as string,
      title: row.title as string,
      storeId: row.storeId as string,
      affiliateUrl: row.affiliateUrl as string,
      hasImage: Boolean(row.hasImage),
      hasDescription: Boolean(row.hasDescription),
      hasSpecs: Boolean(row.hasSpecs),
      hasReview: Boolean(row.hasReview),
    }
  })
}

function extractAsin(url: string): string | null {
  const m = url.match(/(?:dp|product|gp\/product)\/(B0[A-Z0-9]{8,})/i)
  return m?.[1] || null
}

async function enrichDeal(target: EnrichTarget): Promise<string[]> {
  const updated: string[] = []

  if (target.storeId !== 'amazon') return updated

  const asin = extractAsin(target.affiliateUrl)
  if (!asin) return updated

  process.stdout.write(`  scraping ${asin} (${target.title.slice(0, 40)})... `)
  try {
    const details = await scrapeAmazonDetails(asin)
    const db = getDb()

    if (details.imageUrl) {
      await db.execute({
        sql: "UPDATE deals SET imageUrl = ?, images = ?, updatedAt = datetime('now') WHERE id = ? AND (imageUrl IS NULL OR imageUrl = '')",
        args: [details.imageUrl, JSON.stringify(details.images.filter(Boolean)), target.id],
      })
      updated.push('imageUrl')
    }

    if (details.description) {
      const desc = details.description.slice(0, 2000)
      await db.execute({
        sql: "UPDATE deals SET description = ?, updatedAt = datetime('now') WHERE id = ? AND (description IS NULL OR description = '')",
        args: [desc, target.id],
      })
      updated.push('description')
    }

    if (details.features.length > 0) {
      const specs: Record<string, string> = {}
      for (const feat of details.features) {
        const parts = feat.split(/[:：]/)
        if (parts.length >= 2) {
          specs[parts[0].trim()] = parts.slice(1).join(':').trim()
        }
      }
      await db.execute({
        sql: "UPDATE deals SET technicalSpecs = ?, updatedAt = datetime('now') WHERE id = ? AND (technicalSpecs IS NULL OR technicalSpecs = '{}')",
        args: [JSON.stringify(specs), target.id],
      })
      updated.push('technicalSpecs')
    }

    if (details.brand) {
      await db.execute({
        sql: "UPDATE deals SET brand = ?, updatedAt = datetime('now') WHERE id = ? AND (brand IS NULL OR brand = '')",
        args: [details.brand, target.id],
      })
      updated.push('brand')
    }

    if (details.imageUrl) {
      await db.execute({
        sql: "UPDATE products SET imageUrl = ?, images = ?, updatedAt = datetime('now') WHERE id = ? AND (imageUrl IS NULL OR imageUrl = '')",
        args: [details.imageUrl, JSON.stringify(details.images.filter(Boolean)), target.productId],
      })
    }

    console.log(`✅ ${updated.length > 0 ? updated.join(', ') : 'sin novedad'}`)
  } catch (err) {
    console.log(`❌ error: ${(err as Error).message}`)
  }

  return updated
}

async function main() {
  console.log('=== Enrich deals ===\n')

  const targets = await getTargets()
  const incomplete = targets.filter(t => !t.hasImage || !t.hasDescription || !t.hasSpecs || !t.hasReview)
  console.log(`${targets.length} deals total, ${incomplete.length} incompletos\n`)

  if (incomplete.length === 0) {
    console.log('✅ Todos los deals tienen imagen, descripción y specs.')
    return
  }

  let enriched = 0
  let skipped = 0

  for (const target of incomplete) {
    const fields = await enrichDeal(target)
    if (fields.length > 0) enriched++
    else skipped++
  }

  console.log(`\n✅ ${enriched} deals enriquecidos, ${skipped} sin cambios`)
}

main().catch(console.error)
