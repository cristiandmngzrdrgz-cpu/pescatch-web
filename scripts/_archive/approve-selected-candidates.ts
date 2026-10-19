// PROPÓSITO: One-shot — aprobar una selección curada de candidatos (--approve=ids) → Sheet + estado local,
//            y marcar los descartes revisados (--reject=ids) como rejected. NO toca Turso:
//            los deals llegan a producción vía sync → sync:prod → publish:prod.
// FECHA: 2026-10-19 — Archivar en scripts/_archive/ tras su uso.
// Uso: npx tsx scripts/approve-selected-candidates.ts --approve=1,2,3 --reject=4,5 [--apply]
import 'dotenv/config'
import { getDb, initSchema, migrateSchema } from '../src/lib/db'
import { readAllRows, appendRow } from '../src/lib/sync/google-sheets-client'
import { dealMatchSimilarity } from '../src/lib/sync/fuzzy-matcher'

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

const AMAZON_ASIN_RE = /\/dp\/(B0[A-Z0-9]{8})/i
const AE_ITEM_RE = /\/item\/(\d+)(?:\.html)?/i

function productKey(url: string): string {
  const s = String(url || '').trim()
  if (!s) return ''
  const asin = s.match(AMAZON_ASIN_RE)?.[1]
  if (asin) return `amz:${asin.toUpperCase()}`
  const ae = s.match(AE_ITEM_RE)?.[1]
  if (ae) return `ae:${ae}`
  return `url:${s.split('?')[0].replace(/\/+$/, '').toLowerCase()}`
}

interface DealIndex {
  keys: Set<string>
  titles: { title: string; brand: string }[]
}

async function loadDealIndex(): Promise<DealIndex> {
  const db = getDb()
  const res = await db.execute('SELECT title, brand, asin, affiliateUrl, storeUrl FROM deals')
  const keys = new Set<string>()
  const titles: DealIndex['titles'] = []

  for (const row of res.rows) {
    const asin = String(row.asin || '').toUpperCase()
    if (asin) keys.add(`amz:${asin}`)
    for (const u of [row.affiliateUrl, row.storeUrl]) {
      const k = productKey(String(u || ''))
      if (k) keys.add(k)
    }
    titles.push({ title: String(row.title || ''), brand: String(row.brand ?? '') })
  }

  return { keys, titles }
}

type DupReason =
  | { type: 'sheet' }
  | { type: 'duplicate' }
  | { type: 'clone'; similarity: number }

function findDuplicate(c: CandidateRow, index: DealIndex, sheetKeys?: Set<string>): DupReason | null {
  const keys = [productKey(c.url)]
  if (c.asin && c.asin.length === 10) keys.push(`amz:${c.asin.toUpperCase()}`)

  for (const key of keys) {
    if (key && index.keys.has(key)) return { type: 'duplicate' }
  }
  if (sheetKeys) {
    for (const key of keys) {
      if (key && sheetKeys.has(key)) return { type: 'sheet' }
    }
  }

  let best = 0
  for (const d of index.titles) {
    const s = dealMatchSimilarity(c.title, c.brand || '', d.title, d.brand)
    if (s > best) best = s
  }
  if (best >= 0.85) return { type: 'clone', similarity: best }

  return null
}

function describeReason(reason: DupReason): string {
  switch (reason.type) {
    case 'sheet': return 'ya está en el Sheet (sync pendiente)'
    case 'duplicate': return 'ya es un deal'
    case 'clone': return `clon de un deal (similitud ${(reason.similarity * 100).toFixed(0)}%)`
  }
}

// Categoría editorial de la selección aprobada (el keyword de origen es "Marcas",
// que normalizeCategory convertiría en "accesorios").
const CATEGORY_OVERRIDES: Record<number, { category: string; subcategory: string }> = {
  2019: { category: 'canas', subcategory: 'spinning' },
  2021: { category: 'canas', subcategory: 'spinning' },
  2023: { category: 'accesorios', subcategory: '' },
  2024: { category: 'accesorios', subcategory: '' },
  2026: { category: 'accesorios', subcategory: '' },
  2028: { category: 'canas', subcategory: 'spinning' },
  2030: { category: 'senuelos', subcategory: 'eging' },
  2037: { category: 'senuelos', subcategory: 'spinning' },
}

function inferCategory(c: CandidateRow): { category: string; subcategory: string } {
  const override = CATEGORY_OVERRIDES[c.id]
  if (override) return override
  const t = (c.title || '').toLowerCase()
  if (/carrete|reel|rolle/.test(t)) return { category: 'carretes', subcategory: '' }
  if (/ca[ñn]a|rod|rute|canne/.test(t)) return { category: 'canas', subcategory: '' }
  return { category: '', subcategory: '' }
}

function buildSheetRow(c: CandidateRow, headers: string[]): (string | number)[] {
  const isAmazon = !!c.asin && c.asin.length === 10
  const cat = inferCategory(c)
  return headers.map(h => {
    switch (h) {
      case 'ean': return c.ean || ''
      case 'name': return c.title
      case 'brand': return c.brand || ''
      case 'category': return cat.category
      case 'subcategory': return cat.subcategory
      case 'imageUrl': return c.imageUrl || ''
      case 'description': return ''
      case 'featured': return ''
      case 'amazonPrice': return isAmazon ? c.price : ''
      case 'amazonUrl': return isAmazon ? c.url : ''
      case 'amazonShipping': return ''
      case 'amazonStock': return isAmazon ? 'in_stock' : ''
      case 'amazonVariantAsin': return ''
      case 'amazonOriginalPrice': return isAmazon && c.originalPrice ? c.originalPrice : ''
      case 'aliexpressPrice': return !isAmazon ? c.price : ''
      case 'aliexpressUrl': return !isAmazon ? c.url : ''
      case 'aliexpressStock': return !isAmazon ? 'in_stock' : ''
      case 'aliexpressOriginalPrice': return !isAmazon && c.originalPrice ? c.originalPrice : ''
      default: return ''
    }
  })
}

async function main() {
  const apply = process.argv.includes('--apply')
  const approveArg = process.argv.find(a => a.startsWith('--approve='))
  const rejectArg = process.argv.find(a => a.startsWith('--reject='))
  const approveIds = approveArg ? approveArg.split('=')[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : []
  const rejectIds = rejectArg ? rejectArg.split('=')[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : []

  if (approveIds.length === 0 && rejectIds.length === 0) {
    console.log('Uso: --approve=1,2,3 --reject=4,5 [--apply]')
    process.exit(1)
  }

  console.log(`\n=== Aprobación selectiva de candidatos (${apply ? 'APLICADO' : 'DRY-RUN'}) ===`)
  console.log(`Aprobar: ${approveIds.join(', ') || '(ninguno)'}`)
  console.log(`Rechazar: ${rejectIds.join(', ') || '(ninguno)'}\n`)

  await initSchema()
  await migrateSchema()
  const db = getDb()

  const ids = [...approveIds, ...rejectIds]
  const res = await db.execute({
    sql: `SELECT * FROM pending_candidates WHERE id IN (${ids.map(() => '?').join(', ')})`,
    args: ids,
  })
  const found = new Map<number, CandidateRow>()
  for (const row of res.rows) found.set(Number(row.id), row as unknown as CandidateRow)

  const missing = ids.filter(id => !found.has(id))
  if (missing.length > 0) console.log(`⚠️ No encontrados en pending_candidates: ${missing.join(', ')}`)

  const approveRows = approveIds.map(id => found.get(id)).filter((c): c is CandidateRow => !!c)
  const rejectRows = rejectIds.map(id => found.get(id)).filter((c): c is CandidateRow => !!c)

  for (const c of rejectRows) {
    console.log(`⤵️ A rechazar: [${c.id}] ${c.title.slice(0, 70)} | ${c.price}€`)
  }

  // 1) Duplicados descartados de la lista de aprobación (solo en modo apply se lee el Sheet)
  const dealIndex = await loadDealIndex()
  let sheetKeys: Set<string> | undefined
  let headers: string[] = []

  if (apply) {
    const sheet = await readAllRows()
    headers = sheet.headers
    sheetKeys = new Set<string>()
    const urlColumns = ['amazonUrl', 'aliexpressUrl'].map(h => headers.indexOf(h)).filter(i => i >= 0)
    for (const row of sheet.rows) {
      for (const idx of urlColumns) {
        const key = productKey(row[idx] ?? '')
        if (key) sheetKeys.add(key)
      }
    }
  }

  const toApprove: CandidateRow[] = []
  const dupes: { c: CandidateRow; reason: DupReason }[] = []
  for (const c of approveRows) {
    const reason = findDuplicate(c, dealIndex, sheetKeys)
    if (reason) dupes.push({ c, reason })
    else toApprove.push(c)
  }

  console.log('Aprobación propuesta:')
  for (const c of toApprove) {
    const cat = inferCategory(c)
    console.log(`  ✅ [${c.id}] ${c.title.slice(0, 70)} | ${c.brand} | ${c.price}€ | ${cat.category}/${cat.subcategory || '-'} | score ${c.score}`)
  }
  if (dupes.length > 0) {
    console.log(`\nDescartados por anti-dup (${dupes.length}):`)
    for (const { c, reason } of dupes) console.log(`  ✗ [${c.id}] ${c.title.slice(0, 65)} | ${describeReason(reason)}`)
  }

  if (!apply) {
    console.log('\n[DRY-RUN] Nada escrito. Ejecuta con --apply para escribir en el Sheet y actualizar estados.')
    return
  }

  // 2) Duplicados: en Sheet → approved sin duplicar fila; duplicado/clon → rejected
  for (const { c, reason } of dupes) {
    const status = reason.type === 'sheet' ? 'approved' : 'rejected'
    await db.execute({ sql: `UPDATE pending_candidates SET status=?, updated_at=datetime('now') WHERE id=?`, args: [status, c.id] })
    console.log(`  📄 [${c.id}] → ${status} (${describeReason(reason)})`)
  }

  // 3) Rechazos explícitos
  for (const c of rejectRows) {
    await db.execute({ sql: `UPDATE pending_candidates SET status='rejected', updated_at=datetime('now') WHERE id=?`, args: [c.id] })
    console.log(`  ⤵️ [${c.id}] rechazado: ${c.title.slice(0, 60)}`)
  }

  // 4) Aprobar: append al Sheet + estado local
  let approved = 0
  for (const c of toApprove) {
    const row = buildSheetRow(c, headers)
    try {
      await appendRow(row)
      await db.execute({ sql: `UPDATE pending_candidates SET status='approved', updated_at=datetime('now') WHERE id=?`, args: [c.id] })
      console.log(`  ✅ [${c.id}] añadido al Sheet: ${c.title.slice(0, 60)} — ${c.price}€`)
      approved++
    } catch (err) {
      console.log(`  ❌ [${c.id}] error al añadir al Sheet: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n✅ ${approved}/${toApprove.length} aprobados → Sheet | ${rejectRows.length + dupes.filter(d => d.reason.type !== 'sheet').length} rechazados`)
  console.log('Siguiente: npm run sync → npm run sync:prod → npm run publish:prod -- --apply')
}

main().catch(e => { console.error(e); process.exit(1) })
