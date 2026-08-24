import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '@/lib/email'

// Vercel Cron invoca con GET + Authorization: Bearer CRON_SECRET.
export const maxDuration = 300

async function handle(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    await seedDatabase()
    const db = getDb()

    const now = new Date().toISOString()

    const result = await db.execute({
      sql: `SELECT id, title, slug, expiresAt FROM deals WHERE expiresAt IS NOT NULL AND expiresAt <= ? AND status = 'published'`,
      args: [now],
    })

    const expired = result.rows as unknown as Array<{
      id: string
      title: string
      slug: string
      expiresAt: string
    }>

    if (expired.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay deals expirados', count: 0 })
    }

    const ids = expired.map(d => d.id)

    await db.execute({
      sql: `UPDATE deals SET status = 'draft', updatedAt = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
      args: [now, ...ids],
    })

    if (isEmailConfigured()) {
      const items = expired.slice(0, 10).map(d => `<li>${d.title} (expiró ${d.expiresAt.slice(0, 10)})</li>`).join('')
      await sendAdminNotification(
        `${expired.length} deals expirados`,
        buildAdminNotificationHtml('Deals expirados', `
          <p>Se marcaron ${expired.length} deals como expirados:</p>
          <ul>${items}</ul>
          ${expired.length > 10 ? `<p>...y ${expired.length - 10} más.</p>` : ''}
        `),
      )
    }

    return NextResponse.json({
      success: true,
      count: expired.length,
      deals: expired.map(d => ({ id: d.id, title: d.title, expiresAt: d.expiresAt })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en clean-expired: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}