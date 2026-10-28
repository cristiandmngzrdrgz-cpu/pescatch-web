import 'dotenv/config'
import { AMAZON_BRAND_KEYWORDS, BESTSELLER_NODES, CATEGORIES, flattenKeywords, groupKeywords, pickBatch, type KeywordEntry } from './keywords'
import { scrapeAmazonBestsellers, scrapeAmazonNewReleases, type AmazonCandidate } from './amazon'
import { scrapeAliExpressAll } from './aliexpress-scraper'
import { braveAvailable } from './decathlon-scraper'
import { searchAmazonAll } from './amazon-scraper'
import { savePendingCandidates } from '../../src/lib/pending-candidates'
import { initSchema, migrateSchema } from '../../src/lib/db'
import { getCronState, setCronState } from '../../src/lib/cron-state'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '../../src/lib/email'

// Rotación: cada ejecución escanea un lote y avanza el cursor (cron_state).
// El ciclo completo del catálogo se cubre en varios días. `--all` escanea todo.
const KEYWORD_BATCH_SIZE = 25
const NODE_BATCH_SIZE = 3
const KEYWORD_CURSOR_KEY = 'discover_keyword_cursor'
const NODE_CURSOR_KEY = 'discover_node_cursor'

interface ScoredCandidate extends AmazonCandidate {
  score: number
  source: string
}

const POPULAR_BRANDS = [
  'shimano', 'daiwa', 'abu garcia', 'mitchell', 'penn',
  'shakespeare', 'okuma', 'rapala', 'savage gear', 'caperlan',
  'ryobi', 'yuki', 'lineaeffe',
]

const PREMIUM_BRANDS = ['shimano', 'daiwa', 'okuma']

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

function isCuratedStrict(c: AmazonCandidate): boolean {
  if (isFakeBrand(c.brand)) return false
  const b = c.brand!.toLowerCase()
  const hasPremium = PREMIUM_BRANDS.some(p => b.includes(p))
  if (!hasPremium) return false
  const ratingNorm = c.rating > 5 ? c.rating / 20 : c.rating
  if (ratingNorm < 4.2) return false
  if (c.reviews < 30) return false
  if (c.price < 12 || c.price > 450) return false
  if (c.originalPrice != null) {
    const discount = ((c.originalPrice - c.price) / c.originalPrice) * 100
    if (discount < 8) return false
  }
  return true
}

// Relevancia pesquera para candidatos de AliExpress (la API devuelve ruido:
// cerámica, acuarios, insecticidas). Mismo criterio que scripts/discover/auto-aliexpress.ts.
const FISHING_TERM_RE = /(pesca|pescar|carrete|ca[ñn]a\b|\bcana\b|se[ñn]uelo|anzuelo|sedal|flotador|\bboya\b|\bplomo|jigging|spinning|surfcasting|carpfishing|\bfeeder\b|eging|vinilo|cucharilla|moscas?\b|cebos?\b|trenzad|monofilamento|fluorocarbono)/i

function isValidForSave(c: ScoredCandidate): boolean {
  if (isFakeBrand(c.brand)) return false
  if (c.reviews < 10) return false
  if (c.score < 50) return false
  if (c.price < 5 || c.price > 600) return false
  return true
}

function scoreCandidate(c: AmazonCandidate): number {
  let score = 0

  // 0 reviews → rating no fiable, no aporta puntos (evita AliExpress fake 100/0)
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

async function discoverAuto() {
  console.log()
  console.log('=== PESCatch.es — Descubrimiento Automático ===')
  console.log()

  await initSchema()
  await migrateSchema()

  const allCandidates: ScoredCandidate[] = []
  const seenAsins = new Set<string>()
  const seenUrls = new Set<string>()
  const scanAll = process.argv.includes('--all')
  const batchArg = process.argv.find(a => a.startsWith('--batch='))
  const keywordBatchSize = batchArg ? Math.max(1, parseInt(batchArg.split('=')[1], 10) || KEYWORD_BATCH_SIZE) : KEYWORD_BATCH_SIZE

  if (braveAvailable()) {
    try {
      const keywordPool: KeywordEntry[] = [...flattenKeywords(CATEGORIES), ...AMAZON_BRAND_KEYWORDS]
      let keywordBatch = keywordPool
      let nextKeywordCursor: number | null = null

      if (scanAll) {
        console.log(`── FASE 1: Amazon keywords (stealth) — catálogo completo (${keywordPool.length}) ──`)
      } else {
        const cursor = parseInt(await getCronState(KEYWORD_CURSOR_KEY), 10) || 0
        const picked = pickBatch(keywordPool, cursor, keywordBatchSize)
        keywordBatch = picked.batch
        nextKeywordCursor = picked.nextCursor
        console.log(`── FASE 1: Amazon keywords (stealth) — lote ${keywordBatch.length}/${keywordPool.length} ──`)
        console.log(`   Cursor ${cursor} → ${nextKeywordCursor} · ciclo completo en ~${Math.ceil(keywordPool.length / keywordBatchSize)} días (usa --all para escanear todo)`)
      }

      const amazonResults = await searchAmazonAll(groupKeywords(keywordBatch))
      for (const r of amazonResults) {
        if (seenAsins.has(r.asin)) continue
        seenAsins.add(r.asin)
        allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon: ${r.keyword || 'keywords'}` })
      }
      console.log(`  ${amazonResults.length} productos encontrados`)

      if (nextKeywordCursor !== null) await setCronState(KEYWORD_CURSOR_KEY, String(nextKeywordCursor))
    } catch (err) {
      // Un fallo del navegador no debe tumbar el barrido: bestsellers y AliExpress van aparte.
      console.log(`  ⚠️ Keywords Amazon falló (${err instanceof Error ? err.message : err}). Sigo con Fase 2 y 3.`)
    }
  } else {
    console.log('  ❌ Brave no disponible. Saltando scrapers de navegador.')
  }

  console.log('\n── FASE 2: Amazon Bestsellers + Novedades (fetch directo) ──')
  let nodes = BESTSELLER_NODES
  let nextNodeCursor: number | null = null

  if (!scanAll) {
    const cursor = parseInt(await getCronState(NODE_CURSOR_KEY), 10) || 0
    const picked = pickBatch(BESTSELLER_NODES, cursor, NODE_BATCH_SIZE)
    nodes = picked.batch
    nextNodeCursor = picked.nextCursor
    console.log(`   Nodos: ${nodes.map(n => n.label).join(', ')} (cursor ${cursor} → ${nextNodeCursor})`)
  }

  for (const { label, node } of nodes) {
    try {
      const bestsellers = await scrapeAmazonBestsellers(label, node)
      let added = 0
      for (const r of bestsellers) {
        if (seenAsins.has(r.asin)) continue
        seenAsins.add(r.asin)
        allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon Bestsellers: ${label}` })
        added++
      }
      console.log(`   ${label}: ${bestsellers.length} bestsellers (${added} nuevos)`)
    } catch (err) {
      console.log(`   ⚠️ Bestsellers ${label} falló: ${err instanceof Error ? err.message : err}`)
    }

    try {
      const newReleases = await scrapeAmazonNewReleases(label, node)
      let added = 0
      for (const r of newReleases) {
        if (seenAsins.has(r.asin)) continue
        seenAsins.add(r.asin)
        allCandidates.push({ ...r, score: scoreCandidate(r), source: `Amazon Novedades: ${label}` })
        added++
      }
      console.log(`   ${label}: ${newReleases.length} novedades (${added} nuevos)`)
    } catch (err) {
      console.log(`   ⚠️ Novedades ${label} falló: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (nextNodeCursor !== null) await setCronState(NODE_CURSOR_KEY, String(nextNodeCursor))

  console.log('\n── FASE 3: AliExpress directo ──')
  try {
    const aliexpressProducts = await scrapeAliExpressAll()
    for (const p of aliexpressProducts) {
      const url = p.url.toLowerCase()
      if (seenUrls.has(url)) continue
      seenUrls.add(url)
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
        imageUrl: p.imageUrl ?? null,
        brand: p.brand,
        ean: null,
        score: scoreCandidate({
          asin: '', title: p.title, price: p.price, originalPrice: p.originalPrice,
          rating: p.rating, reviews: p.reviews, url: p.url, keyword: 'aliexpress',
          category: p.category, imageUrl: p.imageUrl ?? null, brand: p.brand, ean: null,
        }),
        source: 'AliExpress directo',
      })
    }
    console.log(`  ${aliexpressProducts.length} productos AliExpress`)
  } catch (err) {
    console.log(`  ⚠️ AliExpress falló: ${err instanceof Error ? err.message : err}`)
  }

  if (allCandidates.length === 0) {
    console.log('\n❌ No se encontraron candidatos.')
    return
  }

  const curated = allCandidates.filter(isCuratedStrict)
  const valid = allCandidates.filter(isValidForSave)
  if (valid.length === 0) {
    console.log(`\n❌ 0 candidatos válidos (score>=50, reviews>=10, brand ok). No se guarda junk. Total escaneado: ${allCandidates.length}`)
    console.log(`   Curated premium: ${curated.length} | Válidos: ${valid.length}`)
    return
  }
  // Los curados (Shimano/Daiwa/Okuma) encabezan la cola, pero NO excluyen al resto.
  // Antes, con >=3 curados se descartaban los demás válidos y, si esos 3 eran
  // duplicados, el barrido acababa en 0 guardados (28-oct: 2.400 productos → 0).
  const seenKeys = new Set<string>()
  const pool = [...curated, ...valid].filter(c => {
    // AliExpress devuelve ruido (cerámica, acuarios, insecticidas): exigir término de pesca.
    if (!c.asin && !FISHING_TERM_RE.test(c.title)) return false
    const key = (c.asin || c.url || c.title).toLowerCase()
    if (seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })
  console.log(`\n✓ Pool: ${curated.length} curados (Shimano/Daiwa/Okuma) + ${valid.length} válidos → ${pool.length} únicos`)

  const ranked = pool.sort((a, b) => b.score - a.score).slice(0, 50)

  console.log(`\n📦 Guardando ${ranked.length} candidatos en pending_candidates...`)

  const saved = await savePendingCandidates(
    ranked.map(c => ({
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
    }))
  )

  console.log(`✅ ${saved} nuevos candidatos guardados (${ranked.length - saved} descartados: ya vistos, duplicados o ya publicados)`)

  if (saved > 0 && isEmailConfigured()) {
    const topCandidates = ranked.slice(0, 5)
    const body = topCandidates.map((c: ScoredCandidate) => `
      <div class="deal-card">
        <p class="deal-title">${c.title}</p>
        <p style="color: #FFB800;">${c.price.toFixed(2)}€ ${c.originalPrice ? `<span style="color: #4A6080; text-decoration: line-through;">${c.originalPrice.toFixed(2)}€</span>` : ''}</p>
        <p style="color: #8BA3C7;">${c.source} · Score: ${c.score}</p>
      </div>
    `).join('')

    await sendAdminNotification(
      `${saved} nuevos candidatos`,
      buildAdminNotificationHtml('Nuevos candidatos', `
        <p>Se encontraron ${saved} nuevos productos candidatos:</p>
        ${body}
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://www.pescatch.es/admin/candidates" class="btn">Revisar candidatos</a>
        </div>
      `),
    )
  }

  console.log('\n📋 Revisa y aprueba candidatos en: /admin/candidates')
  console.log()
}

discoverAuto().catch(err => {
  console.error('\n❌ Error fatal:', err)
  process.exit(1)
})
