import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import path from 'path'

const TURSO_URL = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN

function createDbClient(): Client {
  if (TURSO_URL) {
    return createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    })
  }

  const dbPath = path.resolve(process.cwd(), 'data', 'pescatch.db')
  const fileUrl = dbPath.startsWith('/') ? `file:${dbPath}` : `file:///${dbPath.replace(/\\/g, '/')}`
  return createClient({ url: fileUrl })
}

let client: Client | null = null

export function getDb(): Client {
  if (!client) client = createDbClient()
  return client
}

export async function initSchema() {
  const db = getDb()
  await db.batch([
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      ean TEXT NOT NULL DEFAULT '',
      asin TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL DEFAULT '',
      imageUrl TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      category TEXT NOT NULL DEFAULT '',
      subcategory TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      specs TEXT NOT NULL DEFAULT '{}',
      tags TEXT NOT NULL DEFAULT '[]',
      rating REAL NOT NULL DEFAULT 0,
      reviewCount INTEGER NOT NULL DEFAULT 0,
      review TEXT NOT NULL DEFAULT '',
      pros TEXT NOT NULL DEFAULT '[]',
      cons TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      originalPrice REAL NOT NULL,
      salePrice REAL NOT NULL,
      shippingCost REAL NOT NULL DEFAULT 0,
      discountPercent INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT '€',
      imageUrl TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      storeId TEXT NOT NULL DEFAULT '',
      storeName TEXT NOT NULL DEFAULT '',
      storeUrl TEXT NOT NULL DEFAULT '',
      storeReputation TEXT NOT NULL DEFAULT 'good',
      storeCommissionRate REAL NOT NULL DEFAULT 0,
      affiliateUrl TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      subcategory TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      stockStatus TEXT NOT NULL DEFAULT 'in_stock',
      stockCount INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 0,
      reviewCount INTEGER NOT NULL DEFAULT 0,
      technicalSpecs TEXT NOT NULL DEFAULT '{}',
      review TEXT NOT NULL DEFAULT '',
      pros TEXT NOT NULL DEFAULT '[]',
      cons TEXT NOT NULL DEFAULT '[]',
      votesUp INTEGER NOT NULL DEFAULT 0,
      votesDown INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      commission REAL NOT NULL DEFAULT 0,
      publishedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealId TEXT NOT NULL,
      date TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (dealId) REFERENCES deals(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealId TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Anónimo',
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dealId) REFERENCES deals(id) ON DELETE CASCADE
    )`,
    'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)',
    'CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean)',
    'CREATE INDEX IF NOT EXISTS idx_deals_slug ON deals(slug)',
    'CREATE INDEX IF NOT EXISTS idx_deals_category ON deals(category)',
    'CREATE INDEX IF NOT EXISTS idx_deals_featured ON deals(featured)',
    'CREATE INDEX IF NOT EXISTS idx_deals_discount ON deals(discountPercent)',
    'CREATE INDEX IF NOT EXISTS idx_price_history_deal ON price_history(dealId)',
    'CREATE INDEX IF NOT EXISTS idx_comments_deal ON comments(dealId)',
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      featuredImage TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'PesCatch',
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      relatedAsins TEXT NOT NULL DEFAULT '[]',
      publishedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    'CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)',
    'CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(publishedAt)',
  ])
}

export async function migrateSchema() {
  const db = getDb()

  const info = await db.execute("PRAGMA table_info(deals)")
  const columnNames = info.rows.map(r => r.name as string)

  if (!columnNames.includes('productId')) {
    await db.execute("ALTER TABLE deals ADD COLUMN productId TEXT NOT NULL DEFAULT ''")
    await db.execute('CREATE INDEX IF NOT EXISTS idx_deals_product ON deals(productId)')
  }
  if (!columnNames.includes('ean')) {
    await db.execute("ALTER TABLE deals ADD COLUMN ean TEXT NOT NULL DEFAULT ''")
  }
  if (!columnNames.includes('asin')) {
    await db.execute("ALTER TABLE deals ADD COLUMN asin TEXT NOT NULL DEFAULT ''")
  }
}

export async function closeDb() {
  if (client) {
    client.close()
    client = null
  }
}
