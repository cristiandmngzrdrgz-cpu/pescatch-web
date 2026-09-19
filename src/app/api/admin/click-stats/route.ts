import { NextResponse } from 'next/server'
import { adminApiCheck } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const auth = await adminApiCheck()
  if (auth) return auth

  const db = getDb()
  try {
    const total = await db.execute('SELECT count(*) as c FROM click_tracking')
    const last7 = await db.execute("SELECT count(*) as c FROM click_tracking WHERE timestamp > datetime('now','-7 days')")
    const last30 = await db.execute("SELECT count(*) as c FROM click_tracking WHERE timestamp > datetime('now','-30 days')")
    const byStore = await db.execute('SELECT storeId, count(*) as c FROM click_tracking GROUP BY storeId ORDER BY c DESC')
    const byDeal = await db.execute(`
      SELECT ct.dealId, d.title, d.slug, d.storeId, d.salePrice, d.commission, count(*) as clicks
      FROM click_tracking ct
      LEFT JOIN deals d ON d.id = ct.dealId
      GROUP BY ct.dealId
      ORDER BY clicks DESC
      LIMIT 10
    `)
    const byCategory = await db.execute(`
      SELECT d.category, count(*) as clicks
      FROM click_tracking ct
      LEFT JOIN deals d ON d.id = ct.dealId
      WHERE d.category IS NOT NULL AND d.category != ''
      GROUP BY d.category
      ORDER BY clicks DESC
    `)
    const recent = await db.execute('SELECT clickId, dealId, storeId, timestamp, referrer FROM click_tracking ORDER BY timestamp DESC LIMIT 20')

    return NextResponse.json({
      total: Number(total.rows[0]?.c ?? 0),
      last7: Number(last7.rows[0]?.c ?? 0),
      last30: Number(last30.rows[0]?.c ?? 0),
      byStore: byStore.rows,
      byDeal: byDeal.rows,
      byCategory: byCategory.rows,
      recent: recent.rows,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
