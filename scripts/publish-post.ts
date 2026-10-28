// PROPÓSITO: publicar un post del blog (status=published, hidden=0) y copiarlo a Turso.
// FECHA: 2026-10-28
// Uso: npx tsx scripts/publish-post.ts <slug> [--apply]
// Sin --apply hace dry-run. Sustituye al flujo manual de "UPDATE posts" + push-post-to-prod.
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

const COLUMNS = [
  'id', 'title', 'slug', 'excerpt', 'content', 'featuredImage', 'author', 'category', 'tags',
  'relatedAsins', 'publishedAt', 'createdAt', 'updatedAt', 'hidden', 'status',
  'metaTitle', 'metaDescription', 'canonicalUrl', 'focusKeyword',
]

function localDb(): Client {
  return createClient({ url: 'file:///' + path.resolve('data', 'pescatch.db').replace(/\\/g, '/') })
}

function prodDb(): Client {
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido. Revisa .env.vercel')
    process.exit(1)
  }
  return createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const slug = args.find((a) => !a.startsWith('--'))
  if (!slug) {
    console.error('Uso: npx tsx scripts/publish-post.ts <slug> [--apply]')
    process.exit(1)
  }

  const local = localDb()
  const row = await local.execute({ sql: 'SELECT * FROM posts WHERE slug = ?', args: [slug] })
  if (row.rows.length === 0) {
    console.error(`Post no encontrado en local: ${slug}`)
    process.exit(1)
  }
  const post = row.rows[0] as Record<string, unknown>
  const now = new Date().toISOString()

  console.log(`=== publish-post (${apply ? 'APPLY' : 'DRY-RUN'}) ===`)
  console.log(`Post: ${post.title}`)
  console.log(`Fecha publicada: ${post.publishedAt} | estado actual: ${post.status} | hidden: ${post.hidden}`)

  if (apply) {
    await local.execute({
      sql: "UPDATE posts SET status = 'published', hidden = 0, updatedAt = ? WHERE slug = ?",
      args: [now, slug],
    })
    post.status = 'published'
    post.hidden = 0
    post.updatedAt = now

    const prod = prodDb()
    const existing = await prod.execute({ sql: 'SELECT id FROM posts WHERE slug = ?', args: [slug] })
    const values = COLUMNS.map((c) => (post[c] ?? '') as string | number)

    if (existing.rows.length > 0) {
      const sets = COLUMNS.filter((c) => c !== 'id').map((c) => `${c} = ?`)
      const args2 = COLUMNS.filter((c) => c !== 'id').map((c) => (post[c] ?? '') as string | number)
      await prod.execute({ sql: `UPDATE posts SET ${sets.join(', ')} WHERE slug = ?`, args: [...args2, slug] })
      console.log('✅ Publicado en local + actualizado en Turso')
    } else {
      const placeholders = COLUMNS.map(() => '?').join(', ')
      await prod.execute({ sql: `INSERT INTO posts (${COLUMNS.join(', ')}) VALUES (${placeholders})`, args: values })
      console.log('✅ Publicado en local + insertado en Turso')
    }
  } else {
    console.log('[DRY-RUN] Se marcaría published/hidden=0 y se copiaría a Turso. Añade --apply.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
