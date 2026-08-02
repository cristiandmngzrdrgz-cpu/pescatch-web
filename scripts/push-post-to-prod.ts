import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import path from 'path'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) process.env[key] = value
  }
}
loadProdEnv()

const LOCAL_COLS = ['id', 'title', 'slug', 'excerpt', 'content', 'featuredImage', 'author', 'category', 'tags', 'relatedAsins', 'publishedAt', 'createdAt', 'updatedAt', 'hidden']
const EXTRA_COLS = ['status', 'metaTitle', 'metaDescription', 'canonicalUrl', 'focusKeyword']

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const slugArg = args.find((a) => !a.startsWith('--'))
  const local = createClient({ url: 'file:///' + path.resolve('data', 'pescatch.db').replace(/\\/g, '/') })

  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido. Revisa .env.vercel')
    process.exit(1)
  }
  const turso: Client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

  const slug = slugArg || process.env.POST_SLUG
  if (!slug) {
    console.error('Uso: npx tsx scripts/push-post-to-prod.ts <slug> [--apply]')
    process.exit(1)
  }

  const lr = await local.execute({ sql: 'SELECT * FROM posts WHERE slug = ?', args: [slug] })
  if (lr.rows.length === 0) {
    console.error(`Post no encontrado en local: ${slug}`)
    process.exit(1)
  }
  const p = lr.rows[0] as Record<string, unknown>

  const tr = await turso.execute({ sql: 'SELECT * FROM posts WHERE slug = ?', args: [slug] })
  const exists = tr.rows.length > 0

  const cols = [...LOCAL_COLS, ...EXTRA_COLS].filter((c) => c in p)
  const values: Array<string | number | null> = cols.map((c) => (p[c] ?? '') as string)
  const placeholders = cols.map(() => '?').join(', ')
  const updateSets = cols.filter((c) => c !== 'id').map((c) => `${c} = ?`).join(', ')

  console.log(`=== push-post-to-prod (${apply ? 'APPLY' : 'DRY-RUN'}) ===`)
  console.log(`Post: ${p.title} | slug: ${slug} | destino: ${exists ? 'EXISTE en Turso (UPDATE)' : 'NUEVO en Turso (INSERT)'}`)
  console.log(`Columnas a copiar: ${cols.length}`)

  if (apply) {
    if (exists) {
      const updateCols = cols.filter((c) => c !== 'id')
      const updateValues: Array<string | number | null> = updateCols.map((c) => (p[c] ?? '') as string)
      await turso.execute({
        sql: `UPDATE posts SET ${updateCols.map((c) => `${c} = ?`).join(', ')} WHERE slug = ?`,
        args: [...updateValues, slug],
      })
    } else {
      await turso.execute({
        sql: `INSERT INTO posts (${cols.join(', ')}) VALUES (${placeholders})`,
        args: values,
      })
    }
    console.log('✅ Post copiado a Turso')
  } else {
    console.log('\n(DRY-RUN: usa --apply para ejecutar)')
  }

  local.close()
  turso.close()
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
