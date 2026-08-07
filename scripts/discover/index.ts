import 'dotenv/config'
import * as readline from 'readline'
import { CATEGORIES } from './keywords'
import {
  scrapeAmazonDetails,
  type AmazonCandidate,
} from './amazon'
import { appendRow, readAllRows } from '../../src/lib/sync/google-sheets-client'
import { scrapeAliExpressAll } from './aliexpress-scraper'
import brightdataCache from './brightdata-cache.json'
import { braveAvailable } from './decathlon-scraper'
import { searchAmazonAll, scrapeBestsellersStealth, scrapeNewReleasesStealth } from './amazon-scraper'

interface ScoredCandidate extends AmazonCandidate {
  score: number
  source: string
  isNew: boolean
}

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe',
]

function scoreCandidate(c: AmazonCandidate): number {
  let score = 0

  score += Math.round(c.rating * 6)

  const reviewScore = Math.min(25, Math.round(Math.log10(c.reviews + 1) * 8))
  score += reviewScore

  if (c.originalPrice && c.originalPrice > c.price) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    score += Math.min(25, Math.round(discount * 1.5))
  }

  if (c.brand) {
    const isPopular = POPULAR_BRANDS.some(b => c.brand!.toLowerCase().includes(b))
    if (isPopular) score += 30
  } else {
    score -= 10
  }

  return score
}

async function getExistingUrls(): Promise<Set<string>> {
  try {
    const { headers, rows } = await readAllRows()
    const urlIdx = headers.indexOf('amazonUrl')
    const aliexpressIdx = headers.indexOf('aliexpressUrl')
    const decaIdx = headers.indexOf('decathlonUrl')
    const urls = new Set<string>()

    for (const row of rows) {
      if (urlIdx !== -1 && row[urlIdx]) urls.add(row[urlIdx].toLowerCase().trim())
      if (aliexpressIdx !== -1 && row[aliexpressIdx]) urls.add(row[aliexpressIdx].toLowerCase().trim())
      if (decaIdx !== -1 && row[decaIdx]) urls.add(row[decaIdx].toLowerCase().trim())
    }
    return urls
  } catch {
    return new Set()
  }
}

async function discover() {
  console.log()
  console.log('=== PESCatch.es — Descubridor de Chollos ===')
  console.log()

  const existingUrls = await getExistingUrls()
  console.log(`📋 ${existingUrls.size} productos ya en el Sheet`)
  console.log()

  const allCandidates: ScoredCandidate[] = []
  const seenAsins = new Set<string>()

  // Fase 1: Amazon keywords (stealth browser)
  console.log('── FASE 1: Amazon keywords (stealth) ──')
  if (braveAvailable()) {
    console.log('  Lanzando navegador Brave...')
    const amazonResults = await searchAmazonAll(CATEGORIES)
    for (const r of amazonResults) {
      if (seenAsins.has(r.asin)) continue
      seenAsins.add(r.asin)
      allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon: ${r.keyword || 'keywords'}`, isNew: true })
    }
    console.log(`  ${amazonResults.length} productos nuevos`)
  } else {
    console.log('  ❌ Brave no disponible. Saltando.')
  }

  // Fase 2: Amazon bestsellers + new releases (stealth)
  console.log('\n── FASE 2: Amazon Bestsellers + Novedades (stealth) ──')
  if (braveAvailable()) {
    process.stdout.write('  🔥 Más vendidos pesca... ')
    const bestsellers = await scrapeBestsellersStealth('Pesca General')
    const newBestsellers = bestsellers.filter(r => {
      if (seenAsins.has(r.asin)) return false
      seenAsins.add(r.asin)
      return true
    })
    allCandidates.push(
      ...newBestsellers.map(r => ({ ...r, score: scoreCandidate(r), source: 'Amazon Bestsellers', isNew: true }))
    )
    console.log(`${newBestsellers.length} nuevos`)

    process.stdout.write('  🆕 Novedades pesca... ')
    const newReleases = await scrapeNewReleasesStealth('Pesca General')
    const newNewReleases = newReleases.filter(r => {
      if (seenAsins.has(r.asin)) return false
      seenAsins.add(r.asin)
      return true
    })
    allCandidates.push(
      ...newNewReleases.map(r => ({ ...r, score: scoreCandidate(r), source: 'Amazon Novedades', isNew: true }))
    )
    console.log(`${newNewReleases.length} nuevos`)
  } else {
    console.log('  ❌ Brave no disponible. Saltando.')
  }

  // Fase 3: AliExpress vía API + fallback BrightData
  console.log('\n── FASE 3: AliExpress directo ──')
  let aeNew = 0
  let aeFallback = false
  try {
    console.log('  Buscando chollos vía API de AliExpress...')
    const aliexpressProducts = await scrapeAliExpressAll({
      onProgress: (keyword, count) => {
        console.log(`    "${keyword}": +${count}`)
      },
    })
    for (const p of aliexpressProducts) {
      const url = p.url.toLowerCase()
      if (existingUrls.has(url)) continue
      allCandidates.push({
        asin: '',
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        rating: p.rating,
        reviews: p.reviews,
        url: p.url,
        keyword: 'aliexpress',
        category: p.category,
        imageUrl: null,
        brand: p.brand,
        ean: null,
        score: scoreCandidate({
          asin: '', title: p.title, price: p.price, originalPrice: p.originalPrice,
          rating: p.rating, reviews: p.reviews, url: p.url, keyword: 'aliexpress',
          category: p.category, imageUrl: null, brand: p.brand, ean: null,
        }),
        source: 'AliExpress directo',
        isNew: true,
      })
      aeNew++
    }
    console.log(`  ${aeNew} productos desde AliExpress directo`)
  } catch (err) {
    console.log(`  ⚠️ AliExpress scraper falló: ${err instanceof Error ? err.message : err}`)
    aeFallback = true
  }

  if (aeFallback || aeNew === 0) {
    if (aeFallback) console.log('  🔄 Fallback: BrightData cache')
    else console.log('  ⚠️ AliExpress no encontró productos. Fallback: BrightData cache')
    let bdNew = 0
    for (const item of brightdataCache as Array<Record<string, string | number | null>>) {
      const url = String(item.url || '').toLowerCase()
      if (existingUrls.has(url)) continue
      allCandidates.push({
        asin: '',
        title: String(item.title || ''),
        price: Number(item.price) || 0,
        originalPrice: Number(item.originalPrice) || null,
        rating: Number(item.rating) || 0,
        reviews: Number(item.reviews) || 0,
        url: String(item.url || ''),
        keyword: String(item.store || ''),
        category: String(item.category || ''),
        imageUrl: null,
        brand: String(item.brand || '') || null,
        ean: null,
        score: (() => {
          const s = Math.round((Number(item.rating) || 0) * 6) +
            Math.min(25, Math.round(Math.log10((Number(item.reviews) || 1)) * 8))
          const origP = Number(item.originalPrice) || 0
          const saleP = Number(item.price) || 0
          const disc = origP > saleP ? Math.min(25, Math.round(((origP - saleP) / origP) * 100 * 1.5)) : 0
          const brandStr = String(item.brand || '')
          const hasBrand = POPULAR_BRANDS.some(b => brandStr.toLowerCase().includes(b))
          const brandPts = hasBrand ? 30 : (!brandStr ? -10 : 0)
          return s + disc + brandPts
        })(),
        source: `${item.store}: ${item.category || item.brand || ''}`,
        isNew: true,
      })
      bdNew++
    }
    console.log(`  ${bdNew} productos desde BrightData cache`)
  }

  // Fase 4: Decathlon (sin afiliación, excluido)
  // Nota: Decathlon no está afiliado actualmente → no se descubren chollos de esta tienda.

  // Mark existing products
  for (const c of allCandidates) {
    if (c.isNew && existingUrls.has(c.url.toLowerCase())) {
      c.isNew = false
    }
  }

  // Mostrar resultados
  if (allCandidates.length === 0) {
    console.log('\n❌ No se encontraron candidatos.')
    return
  }

  const ranked = allCandidates
    .sort((a, b) => b.score - a.score)
    .filter(c => c.isNew)
    .slice(0, 25)

  if (ranked.length === 0) {
    ranked.push(...allCandidates.sort((a, b) => b.score - a.score).slice(0, 25))
  }

  console.log()
  console.log('=== CANDIDATOS (ordenados por puntuación) ===')
  console.log()

  for (let i = 0; i < ranked.length; i++) {
    const c = ranked[i]
    const discount = c.originalPrice
      ? ` (-${Math.round((1 - c.price / c.originalPrice) * 100)}%)`
      : ''
    const stars = c.rating > 0 ? `${c.rating.toFixed(1)}⭐` : '?⭐'
    const reviewsFmt = c.reviews > 1000
      ? `${(c.reviews / 1000).toFixed(1)}k`
      : `${c.reviews}`
    const brandFmt = c.brand ? `${c.brand} · ` : ''
    const sourceFmt = c.source.padEnd(22)

    console.log(
      `  ${String(i + 1).padStart(2)}. [${sourceFmt}] ${brandFmt}${c.title.slice(0, 48)}`
    )
    console.log(
      `     ${' '.repeat(4)}€${c.price.toFixed(2)}${discount}  ${stars}  ${reviewsFmt} rev.  SCORE: ${c.score}`
    )
    console.log()
  }

  const answer = await ask(
    'Introduce números para añadir (ej: 1,3,5-8) o pulsa Enter para saltar: '
  )

  if (!answer) {
    console.log('\n👋 Nada que añadir.')
    return
  }

  const indices = parseSelection(answer, ranked.length)
  if (indices.length === 0) {
    console.log('\n👋 No se seleccionó nada.')
    return
  }

  const selected = indices.map(i => ranked[i])
  console.log(`\n📦 Obteniendo detalles de ${selected.length} productos...\n`)

  for (const c of selected) {
    process.stdout.write(`  ${c.title.slice(0, 50)}... `)
    if (c.asin) {
      const details = await scrapeAmazonDetails(c.asin)
      if (details.ean) c.ean = details.ean
      if (details.brand && !c.brand) c.brand = details.brand
      console.log(details.ean ? `EAN: ${details.ean}` : 'sin EAN')
    } else {
      console.log('AliExpress (sin ASIN para validar)')
    }
  }

  const amazonWithEan = selected.filter(c => c.asin && c.ean)
  const aliexpressOnly = selected.filter(c => !c.asin)

  if (amazonWithEan.length === 0 && aliexpressOnly.length === 0) {
    console.log('\n❌ No hay productos válidos para añadir.')
    return
  }

  if (amazonWithEan.length > 0) {
    console.log(`\n➕ Añadiendo ${amazonWithEan.length} productos de Amazon al Sheet...`)
    const { headers } = await readAllRows()
    for (const c of amazonWithEan) {
      const row = buildAmazonRow(headers, c)
      try {
        await appendRow(row)
        console.log(`  ✅ ${c.title.slice(0, 50)}`)
      } catch (err) {
        console.log(`  ❌ Error: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  if (aliexpressOnly.length > 0) {
    console.log(`\n⚠️  ${aliexpressOnly.length} productos de AliExpress sin EAN:`)
    for (const c of aliexpressOnly) {
      console.log(`  - ${c.title.slice(0, 60)}`)
    }
    console.log('  No se pueden añadir automáticamente (falta EAN).')
    console.log('  Añádelos manualmente al Sheet si quieres.')
  }

  console.log()
  console.log('✅ Hecho! Ejecuta ahora: npm run sync')
  console.log()
}

function rl(): readline.Interface {
  return readline.createInterface({ input: process.stdin, output: process.stdout })
}

function ask(query: string): Promise<string> {
  const r = rl()
  return new Promise(resolve => r.question(query, a => { r.close(); resolve(a.trim()) }))
}

function parseSelection(input: string, max: number): number[] {
  const parts = input.split(',').map(p => p.trim())
  const result: number[] = []
  const seen = new Set<number>()

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = parseInt(part) - 1
      if (n >= 0 && n < max && !seen.has(n)) {
        result.push(n)
        seen.add(n)
      }
    } else if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split('-').map(n => parseInt(n) - 1)
      const min = Math.max(0, Math.min(a, b))
      const maxN = Math.min(max - 1, Math.max(a, b))
      for (let n = min; n <= maxN; n++) {
        if (!seen.has(n)) {
          result.push(n)
          seen.add(n)
        }
      }
    }
  }

  return result
}

function buildAmazonRow(headers: string[], c: AmazonCandidate): (string | number | boolean)[] {
  const brand = c.brand || ''

  const rowData: Record<string, string | number | boolean | undefined> = {
    ean: c.ean || '',
    name: c.title,
    brand,
    category: c.category,
    subcategory: '',
    description: '',
    imageUrl: c.imageUrl || '',
    tags: '',
    featured: false,
    amazonPrice: c.price,
    amazonUrl: c.url,
    amazonShipping: 0,
    amazonStock: 'in_stock',
  }

  return headers.map(h => {
    const val = rowData[h]
    return val !== undefined ? val : ''
  })
}

discover().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})
