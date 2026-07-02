import 'dotenv/config'
import { readAllRows, appendRow } from '../../src/lib/sync/google-sheets-client'
import { scrapeAmazonDetails } from './amazon'
import * as fs from 'fs'

interface Candidate {
  asin: string
  title: string
  price: number
  rating: number
  reviews: number
  url: string
  store: string
  category: string
  brand: string | null
  originalPrice: number | null
  imageUrl: string | null
  description: string
  features: string[]
  score: number
  source: string
}

async function main() {
  const filePath = process.argv[2]
  const selectionStr = process.argv[3]

  if (!filePath || !selectionStr) {
    console.error('Uso: npx tsx scripts/discover/apply.ts <candidatos.json> <indices>')
    console.error('Ejemplo: npx tsx scripts/discover/apply.ts candidatos-123.json 1,3,5-8')
    process.exit(1)
  }

  const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const ranked: Candidate[] = json.ranked || []

  const indices = parseSelection(selectionStr, ranked.length)
  if (indices.length === 0) { console.log('Nada seleccionado'); return }

  const selected = indices.map(i => ranked[i])
  console.log(`${selected.length} productos a añadir\n`)

  // Scrape details + enrich for Amazon products
  for (const c of selected) {
    if (!c.asin || c.store !== 'amazon') continue
    process.stdout.write(`  📷 ${c.title.slice(0, 50)}... `)
    try {
      const details = await scrapeAmazonDetails(c.asin)
      if (details.brand && !c.brand) c.brand = details.brand
      if (details.imageUrl && !c.imageUrl) c.imageUrl = details.imageUrl
      if (details.description && !c.description) c.description = details.description
      if (details.features.length > 0 && c.features.length === 0) c.features = details.features
      console.log(details.imageUrl ? '✅' : 'sin imagen')
    } catch { console.log('error') }
  }

  const { headers } = await readAllRows()

  let added = 0
  for (const c of selected) {
    const row = headers.map(h => {
      switch (h) {
        case 'ean': return ''
        case 'name': return c.title
        case 'brand': return c.brand || ''
        case 'category': return c.category || ''
        case 'imageUrl': return c.imageUrl || ''
        case 'description': return c.description || ''
        case 'amazonPrice': return c.store === 'amazon' ? c.price : ''
        case 'amazonUrl': return c.store === 'amazon' ? c.url : ''
        case 'amazonStock': return c.store === 'amazon' ? 'in_stock' : ''
        case 'decathlonPrice': return c.store === 'decathlon' ? c.price : ''
        case 'decathlonUrl': return c.store === 'decathlon' ? c.url : ''
        case 'decathlonStock': return c.store === 'decathlon' ? 'in_stock' : ''
        case 'aliexpressPrice': return c.store === 'aliexpress' ? c.price : ''
        case 'aliexpressUrl': return c.store === 'aliexpress' ? c.url : ''
        case 'aliexpressStock': return c.store === 'aliexpress' ? 'in_stock' : ''
        default: return ''
      }
    })

    try {
      await appendRow(row)
      console.log(`  ✅ [${c.store}] ${c.title.slice(0, 55)} - €${c.price.toFixed(2)}`)
      added++
    } catch (err) {
      console.log(`  ❌ ${c.title.slice(0, 50)}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n✅ ${added} añadidos al Sheet\n👉 Ejecuta: npm run sync`)
}

function parseSelection(input: string, max: number): number[] {
  const parts = input.split(',').map(p => p.trim())
  const result: number[] = []
  const seen = new Set<number>()
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = parseInt(part) - 1
      if (n >= 0 && n < max && !seen.has(n)) { result.push(n); seen.add(n) }
    } else if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split('-').map(n => parseInt(n) - 1)
      const min = Math.max(0, Math.min(a, b))
      const maxN = Math.min(max - 1, Math.max(a, b))
      for (let n = min; n <= maxN; n++) {
        if (!seen.has(n)) { result.push(n); seen.add(n) }
      }
    }
  }
  return result
}

main().catch(console.error)
