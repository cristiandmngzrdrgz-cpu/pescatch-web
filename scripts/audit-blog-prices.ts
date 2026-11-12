// PROPÓSITO: auditar y sincronizar precios/ratings de los productos de PRODUCTS_DATA del blog con los deals de la BD.
// FECHA: 2026-11-12
// Uso: npx tsx scripts/audit-blog-prices.ts [--apply] [--json <path>] [--allow-stale] [--only <slug>]
// Sin --apply hace dry-run. Solo aplica a deals vivos y con price_history de hoy (salvo --allow-stale).
// No toca productos cuyo precio viejo aparezca en la prosa (se listan como "manual" para revisión editorial).
import 'dotenv/config'
import { createClient } from '@libsql/client'
import path from 'path'
import fs from 'fs'

type Store = { name: string; url: string; price: string }
type Product = {
  title: string
  rating?: number
  image?: string
  badge?: string
  badgeColor?: string
  scores?: Record<string, number>
  stores: Store[]
  slug?: string
}

type DealRow = {
  id: string
  slug: string
  salePrice: number
  originalPrice: number
  rating: number
  reviewCount: number
  status: string
  stockStatus: string
  storeId: string
  asin: string | null
  affiliateUrl: string | null
}

type Finding = {
  post: string
  product: string
  slug: string | null
  resolvedBy: 'slug' | 'asin' | 'pid' | null
  kind: 'ok' | 'price' | 'rating' | 'missing' | 'dead' | 'no-slug' | 'stale' | 'manual'
  postPrice: number | null
  dbPrice: number | null
  postRating: number | null
  dbRating: number | null
  lastHistory: string | null
  updated: boolean
  slugAdded: boolean
  note?: string
}

const db = createClient({ url: 'file:///' + path.resolve('data', 'pescatch.db').replace(/\\/g, '/') })

function parsePrice(value: string): number | null {
  const m = String(value).replace(/\s/g, '').match(/([\d.,]+)/)
  if (!m) return null
  let t = m[1]
  if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(',', '.')
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

function formatPrice(n: number): string {
  return `${n.toFixed(2).replace('.', ',')}€`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function extractAsin(product: Product): string | null {
  for (const store of product.stores || []) {
    const m = String(store.url).match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/)
    if (m) return m[1]
  }
  return null
}

function extractAePid(product: Product): string | null {
  for (const store of product.stores || []) {
    const m = String(store.url).match(/\/item\/(\d{8,20})\.html/)
    if (m) return m[1]
  }
  return null
}

const DEAL_COLUMNS = 'id, slug, salePrice, originalPrice, rating, reviewCount, status, stockStatus, storeId, asin, affiliateUrl'

async function resolveDeal(product: Product): Promise<{ deal: DealRow | null; by: Finding['resolvedBy'] }> {
  if (product.slug) {
    const res = await db.execute({ sql: `SELECT ${DEAL_COLUMNS} FROM deals WHERE slug = ?`, args: [product.slug] })
    if (res.rows[0]) return { deal: res.rows[0] as unknown as DealRow, by: 'slug' }
  }
  const asin = extractAsin(product)
  if (asin) {
    const res = await db.execute({
      sql: `SELECT ${DEAL_COLUMNS} FROM deals WHERE asin = ? OR affiliateUrl LIKE ? LIMIT 1`,
      args: [asin, `%${asin}%`],
    })
    if (res.rows[0]) return { deal: res.rows[0] as unknown as DealRow, by: 'asin' }
  }
  const pid = extractAePid(product)
  if (pid) {
    const res = await db.execute({
      sql: `SELECT ${DEAL_COLUMNS} FROM deals WHERE affiliateUrl LIKE ? LIMIT 1`,
      args: [`%${pid}%`],
    })
    if (res.rows[0]) return { deal: res.rows[0] as unknown as DealRow, by: 'pid' }
  }
  return { deal: null, by: null }
}

function mentionsOldPrice(contentWithoutBlock: string, price: number | null): boolean {
  if (price === null) return false
  const variants = new Set<string>()
  variants.add(price.toFixed(2).replace('.', ','))
  variants.add(price.toFixed(1).replace('.', ','))
  if (Number.isInteger(price)) variants.add(String(price))
  for (const v of variants) {
    if (contentWithoutBlock.includes(`${v}€`) || contentWithoutBlock.includes(`${v} €`)) return true
  }
  return false
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const allowStale = args.includes('--allow-stale')
  const onlyIdx = args.indexOf('--only')
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null
  const jsonIdx = args.indexOf('--json')
  const jsonPath = jsonIdx >= 0 ? args[jsonIdx + 1] : null
  const deltaIdx = args.indexOf('--max-delta-pct')
  const maxDeltaPct = deltaIdx >= 0 ? Number(args[deltaIdx + 1]) : 10

  const today = todayIso()
  const posts = await db.execute({
    sql: "SELECT slug, title, content FROM posts WHERE status = 'published' ORDER BY publishedAt DESC",
    args: [],
  })

  const findings: Finding[] = []
  const postsToUpdate: { slug: string; content: string }[] = []
  let scannedPosts = 0
  let scannedProducts = 0

  for (const post of posts.rows) {
    const postSlug = String(post.slug)
    if (only && postSlug !== only) continue
    const content = String(post.content)
    const match = content.match(/<!-- PRODUCTS_DATA: ([\s\S]*?) -->/)
    if (!match) continue

    let products: Product[]
    try {
      products = JSON.parse(match[1])
    } catch {
      console.error(`JSON inválido en ${postSlug}`)
      continue
    }

    scannedPosts++
    let changed = false
    const contentWithoutBlock = content.replace(/<!-- PRODUCTS_DATA: [\s\S]*? -->/, '')

    for (const product of products) {
      scannedProducts++
      const { deal, by } = await resolveDeal(product)

      if (!deal) {
        findings.push({
          post: postSlug, product: product.title, slug: product.slug ?? null, resolvedBy: null, kind: 'no-slug',
          postPrice: parsePrice(product.stores?.[0]?.price || ''), dbPrice: null,
          postRating: product.rating ?? null, dbRating: null, lastHistory: null, updated: false, slugAdded: false,
        })
        continue
      }

      const historyRes = await db.execute({
        sql: 'SELECT MAX(date) AS d FROM price_history WHERE dealId = ?',
        args: [deal.id],
      })
      const lastHistory = historyRes.rows[0]?.d ? String(historyRes.rows[0].d).slice(0, 10) : null
      const fresh = lastHistory === today

      const postPrice = parsePrice(product.stores?.[0]?.price || '')
      const priceDiff = postPrice !== null && Math.abs(postPrice - deal.salePrice) > 0.01
      const ratingDiff =
        typeof product.rating === 'number' && deal.rating > 0 && Math.abs(product.rating - deal.rating) > 0.05

      if (deal.status !== 'published' || deal.stockStatus !== 'in_stock') {
        findings.push({
          post: postSlug, product: product.title, slug: deal.slug, resolvedBy: by, kind: 'dead',
          postPrice, dbPrice: deal.salePrice, postRating: product.rating ?? null,
          dbRating: deal.rating, lastHistory, updated: false, slugAdded: false,
        })
        continue
      }

      if (!priceDiff && !ratingDiff) {
        findings.push({
          post: postSlug, product: product.title, slug: deal.slug, resolvedBy: by, kind: 'ok',
          postPrice, dbPrice: deal.salePrice, postRating: product.rating ?? null,
          dbRating: deal.rating, lastHistory, updated: false, slugAdded: false,
        })
        continue
      }

      if (priceDiff && !fresh && !allowStale) {
        findings.push({
          post: postSlug, product: product.title, slug: deal.slug, resolvedBy: by, kind: 'stale',
          postPrice, dbPrice: deal.salePrice, postRating: product.rating ?? null,
          dbRating: deal.rating, lastHistory, updated: false, slugAdded: false,
        })
        continue
      }

      const deltaPct = priceDiff && postPrice ? (Math.abs(deal.salePrice - postPrice) / postPrice) * 100 : 0
      const bigDelta = priceDiff && deltaPct > maxDeltaPct && Math.abs(deal.salePrice - postPrice) > 1
      const oldPriceInProse = priceDiff && mentionsOldPrice(contentWithoutBlock, postPrice)

      if (bigDelta || oldPriceInProse) {
        findings.push({
          post: postSlug, product: product.title, slug: deal.slug, resolvedBy: by, kind: 'manual',
          postPrice, dbPrice: deal.salePrice, postRating: product.rating ?? null,
          dbRating: deal.rating, lastHistory, updated: false, slugAdded: false,
          note: bigDelta ? `delta ${deltaPct.toFixed(0)}%` : 'precio en prosa',
        })
        continue
      }

      const kind: Finding['kind'] = priceDiff ? 'price' : 'rating'
      const finding: Finding = {
        post: postSlug, product: product.title, slug: deal.slug, resolvedBy: by, kind,
        postPrice, dbPrice: deal.salePrice, postRating: product.rating ?? null,
        dbRating: deal.rating, lastHistory, updated: apply, slugAdded: false,
      }
      findings.push(finding)

      if (!apply) continue

      if (!product.slug) {
        product.slug = deal.slug
        finding.slugAdded = true
        changed = true
      }
      if (priceDiff && product.stores?.length) {
        const target =
          product.stores.find((s) => s.name.toLowerCase() === deal.storeId.toLowerCase()) ||
          (product.stores.length === 1 ? product.stores[0] : null)
        if (target) {
          target.price = formatPrice(deal.salePrice)
          changed = true
        }
      }
      if (ratingDiff) {
        product.rating = deal.rating
        changed = true
      }
    }

    if (apply && changed) {
      const newBlock = `<!-- PRODUCTS_DATA: ${JSON.stringify(products)} -->`
      postsToUpdate.push({ slug: postSlug, content: content.replace(match[0], newBlock) })
    }
  }

  const byKind = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.kind] = (acc[f.kind] || 0) + 1
    return acc
  }, {})

  console.log(`=== audit-blog-prices (${apply ? 'APPLY' : 'DRY-RUN'}) — ${today} ===`)
  console.log(`Posts escaneados: ${scannedPosts} | productos: ${scannedProducts}`)
  console.log(`Resumen: ${JSON.stringify(byKind)}`)

  const interesting = findings.filter((f) => f.kind !== 'ok')
  for (const f of interesting) {
    const price = `${f.postPrice ?? '?'} -> ${f.dbPrice ?? '?'}`
    const rating = f.postRating !== f.dbRating ? ` | ${f.postRating ?? '?'}★ -> ${f.dbRating ?? '?'}★` : ''
    const hist = f.lastHistory ? ` | hist ${f.lastHistory}` : ' | sin historial'
    const how = f.resolvedBy && f.resolvedBy !== 'slug' ? ` | match ${f.resolvedBy}` : ''
    const extra = `${f.updated ? ' | ACTUALIZADO' : ''}${f.slugAdded ? ' | slug añadido' : ''}${f.note ? ' | ' + f.note : ''}`
    console.log(`[${f.kind}] ${f.post} :: ${f.product} :: ${price}${rating}${hist}${how}${extra}`)
  }

  if (apply) {
    for (const p of postsToUpdate) {
      await db.execute({
        sql: 'UPDATE posts SET content = ?, updatedAt = ? WHERE slug = ?',
        args: [p.content, new Date().toISOString(), p.slug],
      })
    }
    console.log(`Posts actualizados: ${postsToUpdate.length}${postsToUpdate.length ? ' -> ' + postsToUpdate.map((p) => p.slug).join(', ') : ''}`)
  }

  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify({ today, summary: byKind, findings }, null, 2))
    console.log(`JSON escrito en ${jsonPath}`)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
