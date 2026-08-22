import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail, isEmailConfigured, buildWelcomeHtml } from '@/lib/email'
import { getDeals } from '@/data/queries'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const allowed = await checkRateLimit(ip, 'newsletter')
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'INSERT INTO subscribers (email) VALUES (?)',
      args: [trimmed],
    })

    // Send welcome email (fire and forget)
    if (isEmailConfigured()) {
      getDeals({ sortBy: 'discount' }).then(async (topDeals) => {
        const welcomeDeals = topDeals.slice(0, 3).map(d => ({
          title: d.title,
          salePrice: d.salePrice,
          originalPrice: d.originalPrice,
          discountPercent: d.discountPercent,
          storeName: d.store.name,
          slug: d.slug,
          imageUrl: d.imageUrl || undefined,
        }))
        const guideUrl = 'https://www.pescatch.es/blog/como-elegir-equipo-pesca'
        const html = buildWelcomeHtml(welcomeDeals, guideUrl)
        await sendEmail(trimmed, '🎣 ¡Bienvenido a PesCatch! Top chollos + Guía gratis', html)
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, message: 'Suscripción exitosa' }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Este email ya está suscrito' }, { status: 409 })
    }
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al suscribir: ${message}` }, { status: 500 })
  }
}
