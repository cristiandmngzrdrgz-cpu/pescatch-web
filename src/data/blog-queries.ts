import type { BlogPost } from '@/types'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import type { InValue } from '@libsql/client'

function extractFirstProductImage(content: string): string {
  const match = content.match(/<!--\s*PRODUCTS_DATA:\s*(\[.*?\])\s*-->/)
  if (!match) return ''
  try {
    const products = JSON.parse(match[1])
    if (products.length > 0 && products[0].image) return products[0].image
  } catch {}
  return ''
}

function mapRowToPost(row: Record<string, unknown>): BlogPost {
  const content = row.content as string
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: row.excerpt as string,
    content,
    featuredImage: (row.featuredImage as string) || extractFirstProductImage(content),
    author: row.author as string,
    category: row.category as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    relatedAsins: JSON.parse((row.relatedAsins as string) || '[]'),
    status: (row.status as BlogPost['status']) || (Boolean(row.hidden) ? 'draft' : 'published'),
    hidden: Boolean(row.hidden) || ((row.status as string) === 'draft'),
    publishedAt: row.publishedAt as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
    metaTitle: (row.metaTitle as string) || undefined,
    metaDescription: (row.metaDescription as string) || undefined,
    canonicalUrl: (row.canonicalUrl as string) || undefined,
    focusKeyword: (row.focusKeyword as string) || undefined,
  }
}

async function loadPosts(sql: string, params: InValue[] = []): Promise<BlogPost[]> {
  const db = getDb()
  await seedDatabase()
  const result = await db.execute({ sql, args: params })
  return result.rows.map(r => mapRowToPost(r as Record<string, unknown>))
}

async function loadPost(sql: string, params: InValue[]): Promise<BlogPost | undefined> {
  const db = getDb()
  await seedDatabase()
  const result = await db.execute({ sql, args: params })
  if (result.rows.length === 0) return undefined
  return mapRowToPost(result.rows[0] as Record<string, unknown>)
}

export async function getPosts(limit = 10, offset = 0, includeHidden = false): Promise<BlogPost[]> {
  const sql = includeHidden
    ? 'SELECT * FROM posts ORDER BY publishedAt DESC LIMIT ? OFFSET ?'
    : "SELECT * FROM posts WHERE status = 'published' ORDER BY publishedAt DESC LIMIT ? OFFSET ?"
  return loadPosts(sql, [limit, offset])
}

export async function getPostBySlug(slug: string, includeHidden = false): Promise<BlogPost | undefined> {
  const sql = includeHidden
    ? 'SELECT * FROM posts WHERE slug = ?'
    : "SELECT * FROM posts WHERE slug = ? AND status = 'published'"
  return loadPost(sql, [slug])
}

export async function getPostsCount(includeHidden = false): Promise<number> {
  const db = getDb()
  await seedDatabase()
  const sql = includeHidden
    ? 'SELECT COUNT(*) as count FROM posts'
    : "SELECT COUNT(*) as count FROM posts WHERE status = 'published'"
  const result = await db.execute(sql)
  return Number(result.rows[0].count) || 0
}

export async function getPostById(id: string): Promise<BlogPost | undefined> {
  return loadPost('SELECT * FROM posts WHERE id = ?', [id])
}

export async function getPostsByCategory(category: string, limit = 10, includeHidden = false): Promise<BlogPost[]> {
  const sql = includeHidden
    ? 'SELECT * FROM posts WHERE category = ? ORDER BY publishedAt DESC LIMIT ?'
    : "SELECT * FROM posts WHERE category = ? AND status = 'published' ORDER BY publishedAt DESC LIMIT ?"
  return loadPosts(sql, [category, limit])
}

export async function getPostsByAsin(asin: string, limit = 3): Promise<BlogPost[]> {
  const db = getDb()
  await seedDatabase()
  const result = await db.execute({
    sql: "SELECT * FROM posts WHERE status = 'published' AND relatedAsins LIKE ? ORDER BY publishedAt DESC LIMIT ?",
    args: [`%${asin}%`, limit] as InValue[],
  })
  return result.rows.map(r => mapRowToPost(r as Record<string, unknown>))
}

export async function createPost(data: Record<string, unknown>): Promise<BlogPost> {
  const db = getDb()
  await seedDatabase()

  const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  const str = (v: unknown, fallback = ''): string => (v as string) || fallback
  const json = (v: unknown): string => JSON.stringify(v || [])
  const statusVal = data.status || (data.hidden ? 'draft' : 'published')

  await db.execute({
    sql: `INSERT INTO posts (
      id, title, slug, excerpt, content, featuredImage, author, category, tags, relatedAsins, hidden, status,
      metaTitle, metaDescription, canonicalUrl, focusKeyword,
      publishedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, str(data.title), str(data.slug), str(data.excerpt), str(data.content),
      str(data.featuredImage), str(data.author, 'PesCatch'), str(data.category),
      json(data.tags), json(data.relatedAsins),
      statusVal !== 'published' ? 1 : 0, statusVal,
      str(data.metaTitle), str(data.metaDescription), str(data.canonicalUrl), str(data.focusKeyword),
      str(data.publishedAt, now), now, now,
    ] as InValue[],
  })

  return (await getPostById(id))!
}

export async function updatePost(id: string, data: Record<string, unknown>): Promise<BlogPost | undefined> {
  const db = getDb()

  const check = await db.execute({ sql: 'SELECT id FROM posts WHERE id = ?', args: [id] })
  if (check.rows.length === 0) return undefined

  const now = new Date().toISOString()
  const str = (v: unknown, fallback = ''): string => (v as string) || fallback

  const statusVal = data.status || (data.hidden ? 'draft' : 'published')
  await db.execute({
    sql: `UPDATE posts SET
      title = ?, slug = ?, excerpt = ?, content = ?, featuredImage = ?,
      author = ?, category = ?, tags = ?, relatedAsins = ?,
      metaTitle = ?, metaDescription = ?, canonicalUrl = ?, focusKeyword = ?,
      hidden = ?, status = ?, updatedAt = ?
    WHERE id = ?`,
    args: [
      str(data.title), str(data.slug), str(data.excerpt), str(data.content),
      str(data.featuredImage), str(data.author, 'PesCatch'), str(data.category),
      JSON.stringify(data.tags || []), JSON.stringify(data.relatedAsins || []),
      str(data.metaTitle), str(data.metaDescription), str(data.canonicalUrl), str(data.focusKeyword),
      statusVal !== 'published' ? 1 : 0, statusVal, now, id,
    ] as InValue[],
  })

  return getPostById(id)
}

export async function deletePost(id: string): Promise<boolean> {
  const db = getDb()
  const result = await db.execute({ sql: 'DELETE FROM posts WHERE id = ?', args: [id] })
  return result.rowsAffected > 0
}
