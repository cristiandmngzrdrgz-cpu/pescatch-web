import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { isTelegramConfigured, buildTelegramMessage, sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  if (!isTelegramConfigured()) {
    return NextResponse.json({ error: 'Telegram no configurado' }, { status: 500 })
  }

  try {
    await seedDatabase()
    const db = getDb()

    const result = await db.execute({
      sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug
            FROM deals d
            WHERE d.status = 'published' AND d.discountPercent > 0
            ORDER BY d.discountPercent DESC
            LIMIT 10`,
    })

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

    return NextResponse.json({ success: true, sent: res.ok, dealsCount: deals.length, error: res.error })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en telegram: ${message}` }, { status: 500 })
  }
}