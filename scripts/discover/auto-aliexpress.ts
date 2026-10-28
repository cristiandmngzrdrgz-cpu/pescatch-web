// PROPÓSITO: One-shot — pasada SOLO AliExpress: busca vía API de afiliados, puntúa y guarda
//            candidatos válidos (score≥50, reviews≥10, marca ok, 5-600€) en pending_candidates.
//            Complementa a discover:auto, cuyo filtro estricto premium (Shimano/Daiwa/Okuma)
//            deja fuera a AliExpress cuando hay ≥3 curados de Amazon.
// FECHA: 2026-10-19
// Uso: npx tsx scripts/discover/auto-aliexpress.ts
import 'dotenv/config'
import { scrapeAliExpressAll } from './aliexpress-scraper'
import { savePendingCandidates } from '../../src/lib/pending-candidates'
import { initSchema, migrateSchema } from '../../src/lib/db'

interface ScoredCandidate {
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

// Copiado de scripts/discover/auto.ts (misma puntuación para no divergir criterios)
const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe',
]

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

function scoreCandidate(c: { rating: number; reviews: number; originalPrice: number | null; price: number; brand: string | null }): number {
  let score = 0

  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  if (c.reviews === 0) {
    // sin reviews el rating es ruido
  } else if (c.reviews < 10) {
    score += Math.round(ratingNorm * 3)
  } else {
    score += Math.round(ratingNorm * 6)
  }

  const reviewScore = Math.min(25, Math.round(Math.log10(c.reviews + 1) * 8))
  score += reviewScore

  if (c.originalPrice && c.originalPrice > c.price) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    // descuentos >80% son fake inflados de AliExpress, cap a 10 pts
    if (discount > 80) score += 10
    else score += Math.min(25, Math.round(discount * 1.5))
  }

  if (isFakeBrand(c.brand)) {
    score -= 20
  } else if (c.brand) {
    const isPopular = POPULAR_BRANDS.some(b => c.brand!.toLowerCase().includes(b))
    if (isPopular) score += 30
  } else {
    score -= 10
  }

  return score
}

// Relevancia pesquera: la búsqueda de AE devuelve ruido (cerámica, insecticidas, acuarios...).
const FISHING_TERM_RE = /(pesca|pescar|carrete|ca[ñn]a\b|\bcana\b|se[ñn]uelo|anzuelo|sedal|flotador|\bboya\b|\bplomo|jigging|spinning|surfcasting|carpfishing|\bfeeder\b|eging|vinilo|cucharilla|moscas?\b|cebos?\b|trenzad|monofilamento|fluorocarbono)/i

function isValidAE(c: ScoredCandidate): boolean {
  if (!FISHING_TERM_RE.test(c.title)) return false
  if (c.price < 5 || c.price > 600) return false
  if (c.reviews < 30) return false                              // pedidos reales (lastest_volume)
  const r = c.rating > 5 ? c.rating / 20 : c.rating             // evaluate_rate % → estrellas
  if (!r || r < 4.4) return false
  // Sin filtro de descuento: la API de AE infla el precio y el original (MSRP falso) y la
  // ficha real da descuentos de 0-9%. Exigir ≥15% seleccionaba justo los precios inventados.
  // El precio y el tachado se verifican a mano en la ficha antes de publicar (AGENTS.md).
  return true
}

async function main() {
  console.log()
  console.log('=== PESCatch.es — Pasada solo AliExpress ===')
  console.log()

  await initSchema()
  await migrateSchema()

  console.log('── Buscando en AliExpress (API afiliados) ──')
  const products = await scrapeAliExpressAll()
  console.log(`\n${products.length} productos AliExpress encontrados`)

  const scored: ScoredCandidate[] = products.map(p => ({
    asin: '',
    title: p.title,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating,
    reviews: p.reviews,
    url: p.url,
    keyword: 'aliexpress',
    category: p.category,
    imageUrl: p.imageUrl ?? null,
    brand: p.brand,
    ean: null,
    score: scoreCandidate(p),
    source: 'AliExpress directo',
  }))

  const valid = scored.filter(isValidAE)
  console.log(`Válidos AE (pedidos≥30, 4.4★, relevancia pesquera, 5-600€): ${valid.length}`)

  // Diagnóstico de distribución (señales AE)
  const bucket = (n: number) => n === 0 ? '0' : n < 10 ? '1-9' : n < 30 ? '10-29' : n < 100 ? '30-99' : n < 500 ? '100-499' : '500+'
  const dist: Record<string, number> = {}
  for (const c of scored) dist[bucket(c.reviews)] = (dist[bucket(c.reviews)] ?? 0) + 1
  console.log(`\n── Distribución de pedidos (lastest_volume) ──`)
  console.log(Object.entries(dist).sort((a, b) => ['0','1-9','10-29','30-99','100-499','500+'].indexOf(a[0]) - ['0','1-9','10-29','30-99','100-499','500+'].indexOf(b[0])).map(([k, v]) => `${k}: ${v}`).join(' | '))

  const withRating = scored.filter(c => {
    const r = c.rating > 5 ? c.rating / 20 : c.rating
    return r >= 4.4 && c.reviews >= 30
  })
  const withDiscount = withRating.filter(c => c.originalPrice && c.originalPrice > c.price && ((c.originalPrice - c.price) / c.originalPrice) >= 0.15)
  console.log(`Pedidos≥30 + 4.4★: ${withRating.length} | de esos, con descuento API≥15%: ${withDiscount.length} (informativo, ya no filtra) | válidos finales: ${valid.length}`)

  const seenTitle = new Set<string>()
  const unique = valid.filter(c => {
    const key = c.title.toLowerCase().replace(/\s+/g, ' ').trim()
    if (seenTitle.has(key)) return false
    seenTitle.add(key)
    return true
  })
  const ranked = unique.sort((a, b) => b.score - a.score).slice(0, 50)

  if (valid.length === 0) {
    console.log('\n❌ Ningún candidato AliExpress válido esta pasada.')
    return
  }

  if (process.argv.includes('--dry-run')) {
    console.log(`\n[DRY-RUN] Top ${Math.min(40, ranked.length)} por score (sin guardar):`)
    for (const c of ranked.slice(0, 40)) {
      const disc = c.originalPrice && c.originalPrice > c.price
        ? `orig ${c.originalPrice.toFixed(2)}€, -${(((c.originalPrice - c.price) / c.originalPrice) * 100).toFixed(0)}%`
        : 'sin tachado API'
      console.log(`  [${c.score}] ${c.title.slice(0, 60)} | ${c.brand ?? 'sin marca'} | ${c.price.toFixed(2)}€ (${disc}) | ${(c.rating > 5 ? c.rating / 20 : c.rating).toFixed(1)}★/${c.reviews} | ${c.category}`)
    }
    return
  }


  console.log(`\n📦 Guardando top ${ranked.length} en pending_candidates (con anti-dup)...`)
  const saved = await savePendingCandidates(ranked.map(c => ({
    asin: c.asin,
    title: c.title,
    price: c.price,
    originalPrice: c.originalPrice,
    rating: c.rating,
    reviews: c.reviews,
    url: c.url,
    keyword: c.keyword,
    category: c.category,
    imageUrl: c.imageUrl,
    brand: c.brand,
    ean: c.ean,
    score: c.score,
    source: c.source,
  })))

  console.log(`✅ ${saved} nuevos guardados (${ranked.length - saved} descartados: ya vistos, duplicados o ya publicados)`)
  console.log('\nTop de la pasada (referencia):')
  for (const c of ranked.slice(0, 25)) {
    const disc = c.originalPrice && c.originalPrice > c.price
      ? ((c.originalPrice - c.price) / c.originalPrice * 100).toFixed(0) + '%'
      : '-'
    console.log(`  [${c.score}] ${c.title.slice(0, 62)} | ${c.brand} | ${c.price.toFixed(2)}€ | ${disc} | ${c.rating}★/${c.reviews} | ${c.category}`)
  }
  console.log()
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})
