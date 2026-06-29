import { getDb, initSchema } from '../src/lib/db'

async function fix() {
  const db = getDb()
  await initSchema()
  const slug = 'mejores-canas-spinning-2026'
  const post = await db.execute({ sql: 'SELECT content FROM posts WHERE slug = ?', args: [slug] })
  if (post.rows.length === 0) { console.log('not found'); return }

  let content = post.rows[0].content as string

  const placeholderMap: Record<string, string> = {}
  let counter = 0
  content = content.replace(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+._-]+\._AC_SX679_\.jpg/g, (match) => {
    if (!placeholderMap[match]) {
      counter++
      placeholderMap[match] = `https://picsum.photos/seed/spinrod${counter}/400/400`
    }
    return placeholderMap[match]
  })

  content = content.replace(/PRODUCTS_DATA: (\[.*?\])/g, (_match, json) => {
    const prods = JSON.parse(json)
    prods.forEach((p: { image: string }, i: number) => {
      p.image = `https://picsum.photos/seed/spinrod${i + 1}/400/400`
    })
    return `PRODUCTS_DATA: ${JSON.stringify(prods)}`
  })

  await db.execute({ sql: 'UPDATE posts SET content = ? WHERE slug = ?', args: [content, slug] })
  console.log('✅ Images fixed')
}

fix().catch(console.error)
