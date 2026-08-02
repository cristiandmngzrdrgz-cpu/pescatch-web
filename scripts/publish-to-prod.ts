import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import path from 'path'

function loadProdEnv() {
  const prod = config({ path: '.env.vercel' }).parsed || {}
  for (const [key, value] of Object.entries(prod)) {
    if (value !== '' && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadProdEnv()

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function jaccard(a: string, b: string): number {
  const sa = new Set(a.split(' ').filter(Boolean))
  const sb = new Set(b.split(' ').filter(Boolean))
  if (sa.size === 0 || sb.size === 0) return 0
  let inter = 0
  for (const w of sa) if (sb.has(w)) inter++
  return inter / (sa.size + sb.size - inter)
}

interface LocalDeal {
  id: string
  productId: string
  slug: string
  title: string
  storeId: string
}

interface TursoDeal {
  id: string
  productId: string
  slug: string
  title: string
  storeId: string
  status: string
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')

  const local = createClient({
    url: 'file:///' + path.resolve('data', 'pescatch.db').replace(/\\/g, '/'),
  })

  if (!process.env.TURSO_DATABASE_URL) {
    console.error('TURSO_DATABASE_URL no definido. Asegúrate de que .env.vercel existe.')
    process.exit(1)
  }
  const turso: Client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const lr = await local.execute("SELECT id, productId, slug, title, storeId FROM deals WHERE status = 'published'")
  const localDeals: LocalDeal[] = lr.rows.map((r) => ({
    id: r.id as string,
    productId: (r.productId as string) || '',
    slug: r.slug as string,
    title: r.title as string,
    storeId: r.storeId as string,
  }))

  const tr = await turso.execute('SELECT id, productId, slug, title, storeId, status FROM deals')
  const tursoDeals: TursoDeal[] = tr.rows.map((r) => ({
    id: r.id as string,
    productId: (r.productId as string) || '',
    slug: r.slug as string,
    title: r.title as string,
    storeId: r.storeId as string,
    status: r.status as string,
  }))

  const byProductStore = new Map<string, TursoDeal>()
  const bySlug = new Map<string, TursoDeal>()
  const byTitleStore = new Map<string, TursoDeal[]>()

  for (const d of tursoDeals) {
    byProductStore.set(`${d.productId}::${d.storeId}`, d)
    bySlug.set(d.slug, d)
    const key = `${normalize(d.title)}::${d.storeId}`
    if (!byTitleStore.has(key)) byTitleStore.set(key, [])
    byTitleStore.get(key)!.push(d)
  }

  const toPublish: TursoDeal[] = []
  const alreadyPublished: string[] = []
  const notFound: string[] = []

  for (const localDeal of localDeals) {
    let match: TursoDeal | undefined

    if (localDeal.productId) {
      match = byProductStore.get(`${localDeal.productId}::${localDeal.storeId}`)
    }
    if (!match) {
      match = bySlug.get(localDeal.slug)
    }
    if (!match) {
      const key = `${normalize(localDeal.title)}::${localDeal.storeId}`
      const candidates = byTitleStore.get(key) || []
      let best: TursoDeal | undefined
      let bestScore = 0
      for (const c of candidates) {
        const s = jaccard(normalize(c.title), normalize(localDeal.title))
        if (s > bestScore) {
          bestScore = s
          best = c
        }
      }
      if (best && bestScore >= 0.6) match = best
    }

    if (!match) {
      notFound.push(`${localDeal.storeId} | ${localDeal.title} | ${localDeal.slug}`)
      continue
    }

    if (match.status === 'published') {
      alreadyPublished.push(`${match.storeId} | ${match.title.slice(0, 50)}`)
    } else {
      toPublish.push(match)
    }
  }

  console.log(`=== publish-to-prod (${apply ? 'APPLY' : 'DRY-RUN'}) ===`)
  console.log(`Local publicados: ${localDeals.length}`)
  console.log(`Deals en Turso: ${tursoDeals.length}`)
  console.log(`Ya publicados en Turso: ${alreadyPublished.length}`)
  console.log(`A publicar (draft→published): ${toPublish.length}`)
  console.log(`No encontrados en Turso (los creará sync-prod): ${notFound.length}`)

  for (const d of toPublish) {
    console.log(`  -> PUBLICAR: [${d.storeId}] ${d.title.slice(0, 60)} (${d.status} -> published)`)
  }
  for (const nf of notFound) {
    console.log(`  ! NO ENCONTRADO: ${nf}`)
  }

  if (apply && toPublish.length > 0) {
    console.log('\nAplicando cambios en Turso...')
    let done = 0
    for (const d of toPublish) {
      await turso.execute({ sql: "UPDATE deals SET status = 'published' WHERE id = ?", args: [d.id] })
      done++
    }
    console.log(`OK ${done} deals publicados`)
  } else if (apply) {
    console.log('Nada que aplicar.')
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
