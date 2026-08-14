import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import path from 'path'
import { normalizeCategory, normalizeSubcategory } from './normalize-category'

function createDbClient(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  if (tursoUrl) {
    return createClient({
      url: tursoUrl,
      authToken: tursoToken,
    })
  }

  const dbPath = path.resolve(process.cwd(), 'data', 'pescatch.db')
  const fileUrl = dbPath.startsWith('/') ? `file:${dbPath}` : `file:///${dbPath.replace(/\\/g, '/')}`
  return createClient({ url: fileUrl })
}

let client: Client | null = null

const globalForDb = globalThis as unknown as { _pescatchDb?: Client }

export function getDb(): Client {
  if (process.env.TURSO_DATABASE_URL) {
    if (!globalForDb._pescatchDb) globalForDb._pescatchDb = createDbClient()
    return globalForDb._pescatchDb
  }
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
      currency TEXT NOT NULL DEFAULT 'EUR',
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
      expiresAt TEXT,
      rating REAL NOT NULL DEFAULT 0,
      reviewCount INTEGER NOT NULL DEFAULT 0,
      technicalSpecs TEXT NOT NULL DEFAULT '{}',
      review TEXT NOT NULL DEFAULT '',
      pros TEXT NOT NULL DEFAULT '[]',
      cons TEXT NOT NULL DEFAULT '[]',
      votesUp INTEGER NOT NULL DEFAULT 0,
      votesDown INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      commission REAL NOT NULL DEFAULT 0,
      ean TEXT NOT NULL DEFAULT '',
      asin TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL DEFAULT '',
      metaTitle TEXT NOT NULL DEFAULT '',
      metaDescription TEXT NOT NULL DEFAULT '',
      canonicalUrl TEXT NOT NULL DEFAULT '',
      focusKeyword TEXT NOT NULL DEFAULT '',
      publishedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      priceAlert INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(productId, storeId)
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
      status TEXT DEFAULT 'published',
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
    `CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      reset_at TEXT NOT NULL
    )`,
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
      hidden INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      metaTitle TEXT NOT NULL DEFAULT '',
      metaDescription TEXT NOT NULL DEFAULT '',
      canonicalUrl TEXT NOT NULL DEFAULT '',
      focusKeyword TEXT NOT NULL DEFAULT '',
      publishedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    'CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)',
    'CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(publishedAt)',
    `CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      duration_ms INTEGER NOT NULL DEFAULT 0,
      rows_processed INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL DEFAULT 0,
      updated INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      hidden_orphans INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]'
    )`,
    `CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS scraping_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id TEXT NOT NULL,
      operation TEXT NOT NULL DEFAULT 'refresh',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      success_count INTEGER NOT NULL DEFAULT 0,
      fail_count INTEGER NOT NULL DEFAULT 0,
      avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]'
    )`,
    'CREATE INDEX IF NOT EXISTS idx_scraping_health_store ON scraping_health(store_id)',
    'CREATE INDEX IF NOT EXISTS idx_scraping_health_timestamp ON scraping_health(timestamp)',
    `CREATE TABLE IF NOT EXISTS pending_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asin TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      originalPrice REAL,
      rating REAL NOT NULL DEFAULT 0,
      reviews INTEGER NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      keyword TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      imageUrl TEXT,
      brand TEXT,
      ean TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    'CREATE INDEX IF NOT EXISTS idx_pending_candidates_status ON pending_candidates(status)',
    'CREATE INDEX IF NOT EXISTS idx_pending_candidates_score ON pending_candidates(score)',
    `CREATE TABLE IF NOT EXISTS price_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      dealId TEXT NOT NULL,
      targetPrice REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      triggered_at TEXT,
      UNIQUE(email, dealId)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status)',
    'CREATE INDEX IF NOT EXISTS idx_price_alerts_email ON price_alerts(email)',
  ])
}

const globalForMigrate = globalThis as unknown as { _pescatchMigrated?: boolean }

export async function migrateSchema() {
  if (globalForMigrate._pescatchMigrated) return
  globalForMigrate._pescatchMigrated = true

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
  if (!columnNames.includes('brand')) {
    await db.execute("ALTER TABLE deals ADD COLUMN brand TEXT NOT NULL DEFAULT ''")
  }
  if (!columnNames.includes('status')) {
    const hasHidden = columnNames.includes('hidden')
    await db.execute("ALTER TABLE deals ADD COLUMN status TEXT NOT NULL DEFAULT 'published'")
    if (hasHidden) {
      await db.execute("UPDATE deals SET status = 'published' WHERE hidden = 0")
      await db.execute("UPDATE deals SET status = 'draft' WHERE hidden = 1")
    }
    await db.execute("UPDATE deals SET status = 'draft' WHERE status IS NULL")
  }
  if (columnNames.includes('hidden')) {
    await db.execute("ALTER TABLE deals DROP COLUMN hidden")
  }
  if (!columnNames.includes('priceAlert')) {
    await db.execute("ALTER TABLE deals ADD COLUMN priceAlert INTEGER NOT NULL DEFAULT 0")
  }
  if (!columnNames.includes('expiresAt')) {
    await db.execute("ALTER TABLE deals ADD COLUMN expiresAt TEXT")
    await db.execute('CREATE INDEX IF NOT EXISTS idx_deals_expires ON deals(expiresAt)')
  }
  if (!columnNames.includes('metaTitle')) {
    await db.execute("ALTER TABLE deals ADD COLUMN metaTitle TEXT DEFAULT ''")
    await db.execute("ALTER TABLE deals ADD COLUMN metaDescription TEXT DEFAULT ''")
    await db.execute("ALTER TABLE deals ADD COLUMN canonicalUrl TEXT DEFAULT ''")
    await db.execute("ALTER TABLE deals ADD COLUMN focusKeyword TEXT DEFAULT ''")
  }
  if (!columnNames.includes('variantAsin')) {
    await db.execute("ALTER TABLE deals ADD COLUMN variantAsin TEXT DEFAULT ''")
  }

  const postInfo = await db.execute("PRAGMA table_info(posts)")
  const postColumnNames = postInfo.rows.map(r => r.name as string)
  if (!postColumnNames.includes('hidden')) {
    await db.execute("ALTER TABLE posts ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0")
  }
  if (!postColumnNames.includes('status')) {
    await db.execute("ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published'")
    await db.execute("UPDATE posts SET status = 'published' WHERE hidden = 0")
    await db.execute("UPDATE posts SET status = 'draft' WHERE hidden = 1")
  }
  if (!postColumnNames.includes('metaTitle')) {
    await db.execute("ALTER TABLE posts ADD COLUMN metaTitle TEXT DEFAULT ''")
    await db.execute("ALTER TABLE posts ADD COLUMN metaDescription TEXT DEFAULT ''")
    await db.execute("ALTER TABLE posts ADD COLUMN canonicalUrl TEXT DEFAULT ''")
    await db.execute("ALTER TABLE posts ADD COLUMN focusKeyword TEXT DEFAULT ''")
  }

  const logInfo = await db.execute("PRAGMA table_info(sync_log)")
  if (logInfo.rows.length === 0) {
    await db.execute(`CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      duration_ms INTEGER NOT NULL DEFAULT 0,
      rows_processed INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL DEFAULT 0,
      updated INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      hidden_orphans INTEGER NOT NULL DEFAULT 0,
      errors TEXT NOT NULL DEFAULT '[]'
    )`)
  } else {
    const logColumns = logInfo.rows.map(r => r.name as string)
    if (!logColumns.includes('hidden_orphans')) {
      await db.execute("ALTER TABLE sync_log ADD COLUMN hidden_orphans INTEGER NOT NULL DEFAULT 0")
    }
  }

  const commentInfo = await db.execute("PRAGMA table_info(comments)")
  const commentColumns = commentInfo.rows.map(r => r.name as string)
  if (!commentColumns.includes('status')) {
    await db.execute("ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'published'")
    await db.execute("UPDATE comments SET status = 'published' WHERE status IS NULL")
  }

  await normalizeCategoryColumns()
}

async function normalizeCategoryColumns() {
  const db = getDb()

  for (const table of ['deals', 'products']) {
    const info = await db.execute(`PRAGMA table_info(${table})`)
    const columns = info.rows.map(r => r.name as string)
    if (!columns.includes('category')) continue

    const distinct = await db.execute(`SELECT DISTINCT category FROM ${table} WHERE category != ''`)
    const seen = new Map<string, string>()

    for (const row of distinct.rows) {
      const raw = row.category as string
      if (seen.has(raw)) continue
      const canonical = normalizeCategory(raw)
      if (canonical && canonical !== raw) {
        seen.set(raw, canonical)
      }
    }

    for (const [raw, canonical] of seen) {
      await db.execute({
        sql: `UPDATE ${table} SET category = ? WHERE category = ?`,
        args: [canonical, raw],
      })
    }

    if (columns.includes('subcategory')) {
      const subDistinct = await db.execute(`SELECT DISTINCT category, subcategory FROM ${table} WHERE subcategory != ''`)
      const subSeen = new Map<string, string>()

      for (const row of subDistinct.rows) {
        const cat = row.category as string
        const rawSub = row.subcategory as string
        const key = `${cat}\u0000${rawSub}`
        if (subSeen.has(key)) continue
        const canonicalSub = normalizeSubcategory(cat, rawSub)
        if (canonicalSub && canonicalSub !== rawSub) {
          subSeen.set(key, canonicalSub)
        }
      }

      for (const [key, canonicalSub] of subSeen) {
        const [cat, rawSub] = key.split('\u0000')
        await db.execute({
          sql: `UPDATE ${table} SET subcategory = ? WHERE category = ? AND subcategory = ?`,
          args: [canonicalSub, cat, rawSub],
        })
      }
    }
  }
}

export async function closeDb() {
  if (client) {
    client.close()
    client = null
  }
}
