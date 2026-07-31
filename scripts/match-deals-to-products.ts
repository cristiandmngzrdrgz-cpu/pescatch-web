import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { dealMatchSimilarity } from '../src/lib/sync/fuzzy-matcher'

const MIN_CONFIDENCE = 0.85

interface DealRow {
  id: string
  productId: string
  title: string
  brand: string
  storeId: string
}

export function findGroups(deals: DealRow[]): Array<{ members: DealRow[]; title: string }> {
  const groups: Array<{ members: DealRow[]; title: string }> = []

  for (const deal of deals) {
    let placed = false
    for (const group of groups) {
      const representative = group.members[0]
      if (representative.storeId === deal.storeId) continue

      const similarity = dealMatchSimilarity(
        deal.title, deal.brand,
        representative.title, representative.brand,
      )
      if (similarity >= MIN_CONFIDENCE) {
        group.members.push(deal)
        placed = true
        break
      }
    }
    if (!placed) {
      groups.push({ members: [deal], title: deal.title })
    }
  }

  return groups
}

async function matchDealsToProducts() {
  await seedDatabase()
  const db = getDb()

  console.log('=== Matching de deals entre tiendas ===\n')

  const result = await db.execute(
    `SELECT id, productId, title, brand, storeId
     FROM deals
     WHERE status = 'published'
     ORDER BY title ASC`
  )

  const deals = result.rows as unknown as DealRow[]

  const groups = findGroups(deals).filter(g => g.members.length > 1)

  let linked = 0

  for (const group of groups) {
    const stores = new Set(group.members.map(m => m.storeId))
    if (stores.size < 2) continue

    const withProduct = group.members.find(m => m.productId)
    const targetProductId = withProduct?.productId || group.members[0].productId

    if (!targetProductId) {
      console.log(`  ⚠️ Grupo sin productId (${group.title})`)
      continue
    }

    for (const member of group.members) {
      if (member.productId === targetProductId) continue
      await db.execute({
        sql: 'UPDATE deals SET productId = ? WHERE id = ?',
        args: [targetProductId, member.id],
      })
      linked++
      console.log(`  🔗 "${member.title}" (${member.storeId}) → ${targetProductId}`)
    }
  }

  if (linked === 0) {
    console.log('✅ No se encontraron deals que compartir productId.')
  } else {
    console.log(`\n✅ ${linked} deals actualizados para compartir productId.`)
  }
}

matchDealsToProducts().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
