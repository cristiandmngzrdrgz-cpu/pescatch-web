import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { DISABLED_STORES } from '@/data/queries'
import { isTelegramConfigured, buildTelegramMessage, sendTelegramMessage } from '@/lib/telegram'
import { getCronState, setCronState } from '@/lib/cron-state'

// Vercel Cron invoca con GET + Authorization: Bearer CRON_SECRET.
export const maxDuration = 300

const TELEGRAM_KEY = 'last_telegram_sent'
const TELEGRAM_WINDOW_MS = 20 * 60 * 60 * 1000 // 20h (<24h para permitir reintento al día siguiente si falla el cron)

async function handle(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: 'Telegram no configurado' }, { status: 500 })
  }

  try {
    await seedDatabase()

    const url = new URL(request.url)
    const force = url.searchParams.get('force') === '1'

    if (!force) {
      const last = await getCronState(TELEGRAM_KEY)
      if (last) {
        const lastMs = Date.parse(last)
        if (!Number.isNaN(lastMs) && Date.now() - lastMs < TELEGRAM_WINDOW_MS) {
          return NextResponse.json({ success: true, sent: false, reason: 'idempotent', lastSent: last })
        }
      }
    }

    const db = getDb()

    const storePlaceholders = DISABLED_STORES.map(() => '?').join(',')
    type TgRow = { title: string; salePrice: number; originalPrice: number; discountPercent: number; storeName: string; slug: string; commission: number; storeId: string }
    let result = await db.execute({
      sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.commission, d.storeId
            FROM deals d
            WHERE d.status = 'published' AND d.discountPercent > 0
              AND d.storeId NOT IN (${storePlaceholders})
            ORDER BY d.commission DESC, d.discountPercent DESC
            LIMIT 8`,
      args: DISABLED_STORES,
    })
    // Asegura 1 AE high-commission si top 8 no lo incluye
    const rowsTyped = result.rows as unknown as TgRow[]
    const hasAE = rowsTyped.some(r => r.storeId === 'aliexpress')
    if (!hasAE) {
      const ae = await db.execute({
        sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.commission, d.storeId
              FROM deals d WHERE d.status='published' AND d.storeId='aliexpress' AND d.discountPercent>0
                AND d.storeId NOT IN (${storePlaceholders}) ORDER BY d.commission DESC LIMIT 1`,
        args: DISABLED_STORES,
      })
      const aeRows = ae.rows as unknown as TgRow[]
      if (aeRows.length) result = { rows: [...rowsTyped.slice(0, 7), ...aeRows] } as unknown as typeof result
    }

    const deals = result.rows as unknown as Array<{
      title: string
      salePrice: number
      originalPrice: number
      discountPercent: number
      storeName: string
      slug: string
    }>

    if (deals.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay chollos para publicar', sent: false })
    }

    const message = buildTelegramMessage(deals)
    const res = await sendTelegramMessage(message)

    if (res.ok) {
      await setCronState(TELEGRAM_KEY, new Date().toISOString())
    }

    return NextResponse.json({ success: true, sent: res.ok, dealsCount: deals.length, error: res.error })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en telegram: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}