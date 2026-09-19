// PROPÓSITO: Auto-aprobar candidatos curados (score≥75, Shimano/Daiwa/Okuma, reviews≥30) → Sheet
// FECHA: 2026-09-19 — Parte de spec monetización B+C P0.2 (automatización C)
// Uso: npx tsx scripts/auto-approve-curated.ts [--apply] [--dry-run]
import 'dotenv/config'
import { getDb, initSchema, migrateSchema } from '../src/lib/db'
import { readAllRows, appendRow, ensureHeaders } from '../src/lib/sync/google-sheets-client'

const PREMIUM_BRANDS = ['shimano', 'daiwa', 'okuma', 'penn', 'abu garcia']
const CURATED_MIN_SCORE = 75

function isFakeBrand(brand: string | null | undefined): boolean {
  if (!brand) return true
  const b = brand.trim()
  if (b.length < 2) return true
  if (b.includes('€')) return true
  if (b.includes('kg') && b.includes('€')) return true
  if (b.endsWith(':')) return true
  if (/^\d/.test(b)) return true
  if (b.toLowerCase() === 'recomendado:') return true
  return false
}

interface CandidateRow {
  id: number
  asin: string
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  keyword: string
  category: string
  imageUrl: string | null
  brand: string | null
  ean: string | null
  score: number
  source: string
}

function isCurated(c: CandidateRow): boolean {
  if (isFakeBrand(c.brand)) return false
  const b = c.brand!.toLowerCase()
  if (!PREMIUM_BRANDS.some(p => b.includes(p))) return false
  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  if (ratingNorm < 4.2) return false
  if (c.reviews < 30) return false
  if (c.price < 12 || c.price > 450) return false
  if (c.score < CURATED_MIN_SCORE) return false
  if (c.originalPrice != null) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    if (discount < 8) return false
  }
  return true
}

async function main() {
  const apply = process.argv.includes('--apply')
  const dryRun = !apply

  await initSchema()
  await migrateSchema()
  const db = getDb()

  const res = await db.execute("SELECT * FROM pending_candidates WHERE status='pending' ORDER BY score DESC")
  const all = res.rows as unknown as CandidateRow[]
  const curated = all.filter(isCurated)
  const nonCurated = all.filter(c => !isCurated(c))

  console.log(`\n=== Auto-approve curados (score≥${CURATED_MIN_SCORE}, premium, reviews≥30, 12-450€) ===`)
  console.log(`Total pending: ${all.length} | Curados: ${curated.length} | No-curados: ${nonCurated.length}\n`)

  if (curated.length === 0) {
    console.log('No hay curados para auto-aprobar. Revisa manualmente en /admin/candidates.')
    if (nonCurated.length > 0) {
      console.log('\nTop no-curados (quedan pending):')
      for (const c of nonCurated.slice(0, 5)) {
        console.log(`  - ${c.title.slice(0,60)} | ${c.brand} | ${c.reviews} rev ${c.rating}★ | ${c.price}€ | score ${c.score} | ${c.source}`)
      }
    }
    return
  }

  console.log('Curados encontrados:')
  for (const c of curated) {
    console.log(`  ✓ ${c.asin || '(AE)'} | ${c.title.slice(0,65)} | ${c.brand} | ${c.reviews} rev ${c.rating}★ | ${c.price}€ | score ${c.score}`)
  }

  if (dryRun) {
    console.log(`\n[DRY-RUN] ${curated.length} curados NO se han aprobado. Ejecuta con --apply para escribir en Sheet y marcar approved.`)
    console.log(`Quedarán ${nonCurated.length} pending para revisión manual.`)
    return
  }

  await ensureHeaders(['amazonOriginalPrice', 'aliexpressOriginalPrice', 'technicalSpecs', 'review', 'pros', 'cons'])
  const { headers } = await readAllRows()

  let approved = 0
  for (const c of curated) {
    const isAmazon = c.asin && c.asin.length === 10
    const row = headers.map(h => {
      switch (h) {
        case 'ean': return c.ean || ''
        case 'name': return c.title
        case 'brand': return c.brand || ''
        case 'category': return c.category || ''
        case 'imageUrl': return c.imageUrl || ''
        case 'description': return ''
        case 'amazonPrice': return isAmazon ? c.price : ''
        case 'amazonUrl': return isAmazon ? c.url : ''
        case 'amazonStock': return isAmazon ? 'in_stock' : ''
        case 'amazonOriginalPrice': return isAmazon && c.originalPrice ? c.originalPrice : ''
        case 'aliexpressPrice': return !isAmazon ? c.price : ''
        case 'aliexpressUrl': return !isAmazon ? c.url : ''
        case 'aliexpressStock': return !isAmazon ? 'in_stock' : ''
        case 'aliexpressOriginalPrice': return !isAmazon && c.originalPrice ? c.originalPrice : ''
        default: return ''
      }
    })
    try {
      await appendRow(row)
      await db.execute({ sql: "UPDATE pending_candidates SET status='approved', updated_at=datetime('now') WHERE id=?", args: [c.id] })
      console.log(`  ✅ Aprobado y añadido al Sheet: ${c.title.slice(0,55)} — €${c.price}`)
      approved++
    } catch (err) {
      console.log(`  ❌ Error ${c.asin}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n✅ ${approved}/${curated.length} curados auto-aprobados → Sheet`)
  console.log(`Quedan ${nonCurated.length} pending para revisión manual en /admin/candidates`)
  console.log('Siguiente: npm run sync -- --no-enrich (local) → npm run sync:prod → publish:prod --apply')
}

main().catch(e => { console.error(e); process.exit(1) })
