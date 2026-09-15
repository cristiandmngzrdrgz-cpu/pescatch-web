// PROPÓSITO: Backfill imágenes vacías del 14/09 usando pending_candidates (fuente fiable) + scrape fallback
// FECHA: 2026-09-15
// Uso: npx tsx scripts/fix-yesterday-images.ts [--apply] [--push-prod]
import 'dotenv/config'
import path from 'path'
import { createClient } from '@libsql/client'
import type { InValue } from '@libsql/client'
import { getDb } from '../src/lib/db'

function localDb() {
  const dbPath = path.resolve(process.cwd(), 'data', 'pescatch.db')
  const fileUrl = dbPath.startsWith('/') ? `file:${dbPath}` : `file:///${dbPath.replace(/\\/g, '/')}`
  return createClient({ url: fileUrl })
}

function extractAsin(url: string): string | null {
  const m = url.match(/(?:dp|product|gp\/product)\/(B0[A-Z0-9]{8,})/i)
  return m?.[1] || null
}

function upgradeImage(url: string): string {
  // Convierte _AC_UL320_ a _AC_SX679_ para mejor resolución sin romper hotlink
  return url.replace(/_AC_UL\d+_\./, '_AC_SX679_.').replace(/_AC_SX\d+_\./, '_AC_SX679_.')
}

async function main() {
  const apply = process.argv.includes('--apply')
  const pushProd = process.argv.includes('--push-prod')
  console.log(`Modo: ${apply ? 'APLICADO' : 'DRY-RUN (usa --apply)'} | push-prod=${pushProd}`)

  const db = localDb()

  // 1. Encontrar deals vacíos
  const emptyDeals = await db.execute({
    sql: `SELECT id, productId, title, slug, affiliateUrl, storeId, createdAt, imageUrl FROM deals WHERE (imageUrl = '' OR imageUrl IS NULL) AND storeId = 'amazon'`,
  })
  console.log(`\nDeals vacíos (amazon): ${emptyDeals.rows.length}`)
  for (const r of emptyDeals.rows) {
    console.log(`- ${r.id} | ${r.title} | ${r.affiliateUrl} | asin=${extractAsin(String(r.affiliateUrl || ''))}`)
  }

  // 2. Para cada deal, buscar imagen en pending_candidates por ASIN
  let fixed = 0
  let notFound = 0
  const details: string[] = []

  for (const raw of emptyDeals.rows) {
    const row = raw as unknown as Record<string, unknown>
    const dealId = String(row.id)
    const productId = String(row.productId)
    const affiliateUrl = String(row.affiliateUrl || '')
    const asin = extractAsin(affiliateUrl)
    if (!asin) {
      details.push(`⚠️ ${dealId} sin ASIN en ${affiliateUrl}`)
      notFound++
      continue
    }
    // Buscar en pending_candidates local (preferir approved, luego cualquier)
    let candidateRes = await db.execute({
      sql: `SELECT imageUrl, title FROM pending_candidates WHERE asin = ? AND imageUrl IS NOT NULL AND imageUrl != '' ORDER BY CASE WHEN status='approved' THEN 0 ELSE 1 END, created_at DESC LIMIT 1`,
      args: [asin],
    })
    let imageUrl = candidateRes.rows[0]?.imageUrl as string | undefined
    let source = 'pending_candidates'

    // Fallback: buscar por URL exacta si no hay por ASIN
    if (!imageUrl) {
      candidateRes = await db.execute({
        sql: `SELECT imageUrl FROM pending_candidates WHERE url = ? AND imageUrl IS NOT NULL AND imageUrl != '' LIMIT 1`,
        args: [affiliateUrl],
      })
      imageUrl = candidateRes.rows[0]?.imageUrl as string | undefined
      source = 'pending_candidates:url'
    }

    // Fallback scrapeAmazonDetails si sigue sin imagen
    if (!imageUrl) {
      try {
        const { scrapeAmazonDetails } = await import('./discover/amazon')
        const detailsScraped = await scrapeAmazonDetails(asin)
        if (detailsScraped.imageUrl) {
          imageUrl = detailsScraped.imageUrl
          source = 'scrapeAmazonDetails'
        }
      } catch (e) {
        details.push(`Scrape failed ${asin}: ${(e as Error).message}`)
      }
    }

    if (!imageUrl) {
      details.push(`❌ ${dealId} (${asin}) sin imagen en ningún origen`)
      notFound++
      continue
    }

    const hiRes = upgradeImage(imageUrl)
    details.push(`✅ ${dealId} (${asin}) -> ${hiRes} [${source}]`)

    if (apply) {
      // Actualizar deals
      await db.execute({ sql: `UPDATE deals SET imageUrl = ?, updatedAt = datetime('now') WHERE id = ?`, args: [hiRes, dealId] })
      // Actualizar products si vacío
      const prod = await db.execute({ sql: `SELECT imageUrl FROM products WHERE id = ?`, args: [productId] })
      const prodImg = prod.rows[0]?.imageUrl as string | undefined
      if (!prodImg) {
        await db.execute({ sql: `UPDATE products SET imageUrl = ?, updatedAt = datetime('now') WHERE id = ?`, args: [hiRes, productId] })
      }
      // También actualizar images JSON si está vacío
      const dealImg = await db.execute({ sql: `SELECT images FROM deals WHERE id = ?`, args: [dealId] })
      const imgs = dealImg.rows[0]?.images as string | undefined
      if (!imgs || imgs === '[]' || imgs === '') {
        await db.execute({ sql: `UPDATE deals SET images = ? WHERE id = ?`, args: [JSON.stringify([hiRes]), dealId] })
      }
      fixed++
    } else {
      fixed++
    }
  }

  console.log('\n' + details.join('\n'))
  console.log(`\nResumen: ${fixed} con imagen encontrada, ${notFound} sin origen`)

  if (!apply) {
    console.log('\nEjecuta con --apply para escribir en data/pescatch.db')
    return
  }

  // Verificación post-apply local
  const after = await db.execute({ sql: `SELECT id, imageUrl FROM deals WHERE (imageUrl = '' OR imageUrl IS NULL) AND storeId='amazon'` })
  console.log(`\nTras fix local, vacíos restantes: ${after.rows.length}`)

  if (pushProd) {
    console.log('\n--- Push a Turso ---')
    if (!process.env.TURSO_DATABASE_URL) {
      const { config } = await import('dotenv')
      config({ path: '.env.vercel' })
    }
    if (!process.env.TURSO_DATABASE_URL) {
      console.error('TURSO_DATABASE_URL no definido, no se puede pushear')
      return
    }
    const prod = getDb()
    // Re-leer los deals ahora parcheados en local
    const fixedDeals = await db.execute({ sql: `SELECT id, slug, productId, imageUrl, images FROM deals WHERE imageUrl != '' AND date(createdAt) >= date('2026-09-13')` })
    let pushed = 0
    for (const raw of fixedDeals.rows) {
      const r = raw as unknown as Record<string, unknown>
      const imageUrl = String(r.imageUrl)
      const images = String(r.images || JSON.stringify([imageUrl]))
      const id = String(r.id)
      const slug = String(r.slug)
      // Buscar en Turso por id/slug/productId+store
      let prodId: string | undefined
      let res = await prod.execute({ sql: 'SELECT id FROM deals WHERE id = ?', args: [id] })
      prodId = res.rows[0]?.id as string | undefined
      if (!prodId) {
        res = await prod.execute({ sql: 'SELECT id FROM deals WHERE slug = ?', args: [slug] })
        prodId = res.rows[0]?.id as string | undefined
      }
      if (!prodId) continue
      await prod.execute({ sql: `UPDATE deals SET imageUrl = ?, images = ?, updatedAt = datetime('now') WHERE id = ?`, args: [imageUrl, images, prodId] })
      // products
      const prodProd = await prod.execute({ sql: 'SELECT imageUrl FROM products WHERE id = ?', args: [String(r.productId)] })
      if (prodProd.rows.length > 0 && !prodProd.rows[0].imageUrl) {
        await prod.execute({ sql: `UPDATE products SET imageUrl = ?, updatedAt = datetime('now') WHERE id = ?`, args: [imageUrl, String(r.productId)] })
      }
      pushed++
      console.log(`  pushed ${id} -> ${imageUrl.slice(0, 60)}...`)
    }
    console.log(`\nPusheados a Turso: ${pushed}`)
  } else {
    console.log('\nPara pushear a Turso añade --push-prod (requiere .env.vercel)')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
