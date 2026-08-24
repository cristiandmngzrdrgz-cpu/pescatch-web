import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { DISABLED_STORES } from '@/data/queries'
import { sendEmail, isEmailConfigured, buildNewsletterHtml } from '@/lib/email'

const BASE_URL = 'https://www.pescatch.es'

// Vercel Cron invoca con GET + Authorization: Bearer CRON_SECRET.
export const maxDuration = 300

async function handle(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'Resend no configurado' }, { status: 500 })
  }

  try {
    await seedDatabase()
    const db = getDb()

    const storePlaceholders = DISABLED_STORES.map(() => '?').join(',')
    const result = await db.execute({
      sql: `SELECT d.title, d.salePrice, d.originalPrice, d.discountPercent, d.storeName, d.slug, d.imageUrl
            FROM deals d
            WHERE d.status = 'published' AND d.discountPercent > 0
              AND d.storeId NOT IN (${storePlaceholders})
            ORDER BY d.discountPercent DESC
            LIMIT 10`,
      args: DISABLED_STORES,
    })

    const deals = result.rows as unknown as Array<{
      title: string
      salePrice: number
      originalPrice: number
      discountPercent: number
      storeName: string
      slug: string
      imageUrl: string | null
    }>

    if (deals.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay chollos para enviar', sent: 0 })
    }

    const subscribers = await db.execute({
      sql: 'SELECT email FROM subscribers',
    })

    const emails = subscribers.rows.map(r => r.email as string)

    let sent = 0
    let failed = 0

    for (const email of emails) {
      const unsubscribeUrl = `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
      const html = buildNewsletterHtml(
        deals.map(d => ({
          title: d.title,
          salePrice: d.salePrice,
          originalPrice: d.originalPrice,
          discountPercent: d.discountPercent,
          storeName: d.storeName,
          slug: d.slug,
          imageUrl: d.imageUrl || undefined,
        })),
        unsubscribeUrl,
      )

      const ok = await sendEmail(email, '🎣 Chollos de la semana — PesCatch', html)
      if (ok) sent++
      else failed++
    }

    return NextResponse.json({ success: true, sent, failed, dealsCount: deals.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en newsletter: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}