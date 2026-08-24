// PROPÓSITO: rellenar imageUrl de los deals AliExpress publicados que salieron sin
//            imagen (auto.ts la descartaba). Resuelve el PID desde el enlace de
//            afiliado y usa product_main_image_url de la API de afiliados.
// FECHA: 2026-08-23
// USO: npx tsx scripts/discover/backfill-deal-images.ts [--apply]
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { getProductDetails, resolveProductIdFromUrl } from '../../src/lib/aliexpress-api'

const APPLY = process.argv.includes('--apply')

async function main() {
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  const turso = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  const local = createClient({ url: 'file:data/pescatch.db' })

  const q = `SELECT d.slug slug, d.title title, d.productId productId, d.affiliateUrl url
             FROM deals d WHERE d.storeName='AliExpress' AND d.status='published'
             AND (d.imageUrl IS NULL OR d.imageUrl='')`
  const lr = await local.execute(q)
  console.log(`Deals AE publicados sin imagen (local): ${lr.rows.length}`)

  // resolver PIDs
  const items: { slug: string; title: string; pid: string | null }[] = []
  for (const row of lr.rows) {
    const url = String(row.url ?? '')
    let pid: string | null = null
    try {
      pid = await resolveProductIdFromUrl(url)
    } catch {}
    if (!pid) {
      const m = url.match(/\/item\/(\d+)\.html/i)
      if (m) pid = m[1]
    }
    items.push({ slug: String(row.slug), title: String(row.title), pid })
    await new Promise((r) => setTimeout(r, 400))
  }

  const sinPid = items.filter((i) => !i.pid)
  console.log(`Con PID: ${items.length - sinPid.length} · Sin PID: ${sinPid.length}`)
  for (const i of sinPid) console.log(`  SIN-PID: ${i.slug} | ${i.title.slice(0, 50)} | ${items.find(x=>x.slug===i.slug)!.pid}`)

  // detalle por batches
  const uniqPids = [...new Set(items.map((i) => i.pid!).filter(Boolean))]
  const imgByPid = new Map<string, string>()
  for (let i = 0; i < uniqPids.length; i += 10) {
    const batch = uniqPids.slice(i, i + 10)
    try {
      const details = await getProductDetails(batch)
      for (const d of details) {
        if (d.productId && d.imageUrl) imgByPid.set(String(d.productId), d.imageUrl)
      }
    } catch (e) {
      console.log(`  batch ${i / 10 + 1} falló: ${e instanceof Error ? e.message : e}`)
    }
    console.log(`  batch ${Math.floor(i / 10) + 1}/${Math.ceil(uniqPids.length / 10)}: ${imgByPid.size} imágenes acumuladas`)
    await new Promise((r) => setTimeout(r, 1500))
  }

  let ok = 0, sinImg = 0
  for (const it of items) {
    const img = it.pid ? imgByPid.get(it.pid) : undefined
    if (!img) { sinImg++; console.log(`  SIN-IMG: ${it.slug} | ${it.title.slice(0, 55)}`); continue }
    if (APPLY) {
      for (const db of [local, turso]) {
        await db.execute({ sql: `UPDATE deals SET imageUrl=? WHERE slug=?`, args: [img, it.slug] })
        await db.execute({
          sql: `UPDATE products SET imageUrl=? WHERE id=(SELECT productId FROM deals WHERE slug=?) AND (imageUrl IS NULL OR imageUrl='')`,
          args: [img, it.slug],
        })
      }
    }
    ok++
  }
  console.log(`\n${APPLY ? '✅' : '[DRY-RUN]'} Imágenes asignables: ${ok} · Sin imagen en API: ${sinImg}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
