// PROPÓSITO: para el deal AE sin imagen que la API no devuelve, sacar og:image de su
//            página de item y actualizarlo en local + Turso.
// FECHA: 2026-08-23
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { resolveProductIdFromUrl } from '../../src/lib/aliexpress-api'

const SLUG = 'caa-de-pescar-fishingfans-con-gua-de-alconita-fuji-asiento-de-carrete-con-sonaje_aliexpress'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'

async function main() {
  const env: Record<string, string> = {}
  for (const l of readFileSync('.env.vercel', 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  const local = createClient({ url: 'file:data/pescatch.db' })
  const row = await local.execute({ sql: `SELECT affiliateUrl FROM deals WHERE slug=?`, args: [SLUG] })
  const url = String(row.rows[0]?.url ?? row.rows[0]?.affiliateUrl ?? (row.rows[0] as any)?.affiliateUrl ?? '')
  const pid = await resolveProductIdFromUrl(url)
  console.log('PID:', pid, '| url:', url.slice(0, 60))
  if (!pid) return

  const res = await fetch(`https://es.aliexpress.com/item/${pid}.html`, {
    headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' },
    redirect: 'follow',
  })
  const html = await res.text()
  const m = html.match(/property="og:image" content="([^"]+)"/i)
  const img = m ? m[1].replace(/&amp;/g, '&') : ''
  console.log('og:image:', img || 'NO ENCONTRADA')
  if (!img || !/^https:\/\//.test(img)) return

  const turso = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  for (const db of [local, turso]) {
    await db.execute({ sql: `UPDATE deals SET imageUrl=? WHERE slug=?`, args: [img, SLUG] })
    await db.execute({
      sql: `UPDATE products SET imageUrl=? WHERE id=(SELECT productId FROM deals WHERE slug=?) AND (imageUrl IS NULL OR imageUrl='')`,
      args: [img, SLUG],
    })
  }
  console.log('✅ Actualizado en local + Turso')
}
main().catch((e) => { console.error(e); process.exit(1) })
