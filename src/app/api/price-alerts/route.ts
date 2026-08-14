import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { createPriceAlert } from '@/lib/price-alerts'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const allowed = await checkRateLimit(ip, 'price-alerts')
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, dealId, targetPrice } = body as { email?: string; dealId?: string; targetPrice?: number }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }
    if (!dealId || typeof dealId !== 'string') {
      return NextResponse.json({ error: 'Chollo requerido' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
    }

    const target = typeof targetPrice === 'number' && targetPrice > 0 ? targetPrice : 0
    const result = await createPriceAlert(trimmed, dealId, target)

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Error al crear la alerta' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Alerta activada' }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al crear la alerta: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const db = getDb()
  const email = request.nextUrl.searchParams.get('email')
  const dealId = request.nextUrl.searchParams.get('dealId')
  const slug = request.nextUrl.searchParams.get('slug')

  if (!email || !dealId) {
    return NextResponse.json({ error: 'Parámetros email y dealId requeridos' }, { status: 400 })
  }

  const alert = await db.execute({
    sql: 'SELECT status FROM price_alerts WHERE email = ? AND dealId = ?',
    args: [email.toLowerCase(), dealId],
  })

  const active = alert.rows.length > 0 && alert.rows[0].status === 'active'
  return NextResponse.json({ active, dealId, slug })
}