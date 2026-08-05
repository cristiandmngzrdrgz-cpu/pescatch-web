import * as fs from 'fs'
import * as path from 'path'
import type { Page } from 'playwright'
import { getDb } from '../src/lib/db'
import { extractAsin } from '../src/lib/enrich-deal'
import { launchBraveContext, setupStealthPage } from '../src/lib/scraping-utils'
import { scrapeAmazonDetailsStealth, type AmazonDetailsStealth } from './discover/amazon-scraper'
import { scrapeDecathlonDetails, type DecathlonDetails } from './discover/decathlon-scraper'

const CACHE_DIR = path.resolve('scripts', 'enrich-cache')

interface CacheData {
  ean?: string | null
  brand?: string | null
  imageUrl?: string | null
  images?: string[]
  description?: string | null
  features?: string[]
  specs?: Record<string, string>
  rating?: number
  reviewCount?: number
}

interface CacheEntry {
  dealId: string
  storeId: string
  title: string
  url: string
  scrapedAt: string
  source: 'amazon-stealth' | 'decathlon-stealth' | 'aliexpress-fetch' | 'none'
  data: CacheData
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function parseArgs(argv: string[]) {
  const only = argv.find(a => a.startsWith('--only='))?.split('=')[1]
  const limitIdx = argv.findIndex(a => a.startsWith('--limit='))
  const limit = limitIdx >= 0 ? parseInt(argv[limitIdx].split('=')[1], 10) || 0 : 0
  const asin = argv.find(a => a.startsWith('--asin='))?.split('=')[1]
  const force = argv.includes('--force')
  return { only, limit, asin, force }
}

async function scrapeAliexpressDirect(url: string): Promise<CacheData> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' },
    })
    if (!res.ok) return {}
    const html = await res.text()
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    let match
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1].trim())
        if (data['@type'] === 'Product') {
          return {
            ean: data.gtin13 || data.gtin || null,
            brand: data.brand?.name || data.brand || null,
            description: data.description || null,
            images: Array.isArray(data.image) ? data.image : data.image ? [data.image] : [],
          }
        }
      } catch {}
    }
    return {}
  } catch {
    return {}
  }
}

async function scrapeAmazonBatch(deals: Array<{ id: string; title: string; url: string }>) {
  const context = await launchBraveContext('brave-amazon-profile')
  try {
    const page = context.pages()[0] || await context.newPage()
    await setupStealthPage(page)
    for (const deal of deals) {
      const asin = extractAsin(deal.url)
      if (!asin) {
        console.log(`[amazon] ${deal.id} ${deal.title.slice(0, 50)}... sin ASIN`)
        await writeCache(deal.id, 'amazon', deal.title, deal.url, 'none', {})
        continue
      }
      const data = await scrapeAmazonDetailsStealth(asin, page)
      const ok = data.imageUrl || data.features.length > 0 || data.brand
      console.log(`[amazon] ${deal.id} ${asin} ${ok ? 'OK' : 'VACÍO'} imgs=${data.images.length} feats=${data.features.length} brand=${data.brand ?? '-'}`)
      await writeCache(deal.id, 'amazon', deal.title, deal.url, ok ? 'amazon-stealth' : 'none', data)
      await sleep(4000)
    }
  } finally {
    await context.close()
  }
}

async function scrapeDecathlonBatch(deals: Array<{ id: string; title: string; url: string }>) {
  const context = await launchBraveContext('brave-decathlon-profile')
  try {
    const page = context.pages()[0] || await context.newPage()
    await setupStealthPage(page)
    for (const deal of deals) {
      const data = await scrapeDecathlonDetails(deal.url, page)
      const ok = data.images.length > 0 || data.description || data.brand
      console.log(`[decathlon] ${deal.id} ${ok ? 'OK' : 'VACÍO'} imgs=${data.images.length} specs=${Object.keys(data.specs).length} brand=${data.brand ?? '-'}`)
      await writeCache(deal.id, 'decathlon', deal.title, deal.url, ok ? 'decathlon-stealth' : 'none', data)
      await sleep(2000)
    }
  } finally {
    await context.close()
  }
}

function writeCache(dealId: string, storeId: string, title: string, url: string, source: CacheEntry['source'], data: CacheData) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
  const entry: CacheEntry = { dealId, storeId, title, url, scrapedAt: new Date().toISOString(), source, data }
  fs.writeFileSync(path.join(CACHE_DIR, `${dealId}.json`), JSON.stringify(entry, null, 2))
}

async function main() {
  const { only, limit, asin, force } = parseArgs(process.argv.slice(2))

  const db = getDb()
  const rows = await db.execute({
    sql: 'SELECT id, title, storeId, storeUrl, affiliateUrl FROM deals WHERE status = ? ORDER BY storeId',
    args: ['published'],
  })

  let deals = rows.rows.map(r => ({
    id: String(r.id),
    title: String(r.title),
    storeId: String(r.storeId),
    storeUrl: String(r.storeUrl || ''),
    affiliateUrl: String(r.affiliateUrl || ''),
  }))

  if (asin) {
    deals = deals.filter(d => extractAsin(d.affiliateUrl) === asin || extractAsin(d.storeUrl) === asin)
  }
  if (!force) {
    deals = deals.filter(d => !fs.existsSync(path.join(CACHE_DIR, `${d.id}.json`)))
  }
  if (limit > 0) deals = deals.slice(0, limit)
  if (only) deals = deals.filter(d => d.storeId === only)

  if (deals.length === 0) {
    console.log('Nada que scrapear (usa --force para re-scrapear o --asin= para uno concreto).')
    return
  }

  const amazon = deals.filter(d => d.storeId === 'amazon').map(d => ({ id: d.id, title: d.title, url: d.affiliateUrl || d.storeUrl }))
  const decathlon = deals.filter(d => d.storeId === 'decathlon').map(d => ({ id: d.id, title: d.title, url: d.affiliateUrl || d.storeUrl }))
  const aliexpress = deals.filter(d => d.storeId === 'aliexpress')

  console.log(`Total: ${deals.length} (amazon=${amazon.length}, decathlon=${decathlon.length}, aliexpress=${aliexpress.length})`)

  if (amazon.length > 0) await scrapeAmazonBatch(amazon)
  if (decathlon.length > 0) await scrapeDecathlonBatch(decathlon)

  for (const deal of aliexpress) {
    const url = deal.affiliateUrl || deal.storeUrl
    const data = await scrapeAliexpressDirect(url)
    const ok = data.brand || data.description
    console.log(`[aliexpress] ${deal.id} ${ok ? 'OK' : 'VACÍO'} imgs=${data.images?.length ?? 0}`)
    await writeCache(deal.id, 'aliexpress', deal.title, url, ok ? 'aliexpress-fetch' : 'none', data)
  }

  console.log('\nCache en: scripts/enrich-cache/')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
