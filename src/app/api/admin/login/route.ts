import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { safeEqual } from '@/lib/auth-utils'

function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET
}

export async function POST(request: NextRequest) {
  // Si no hay ADMIN_SECRET configurado, no dejamos "pasar" el login:
  // isAdminAuthenticated() ya deja entrar a todo el mundo en ese caso,
  // así que aquí simplemente no montamos ninguna cookie.
  const secret = getAdminSecret()
  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET no configurado en el servidor' }, { status: 500 })
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const allowed = await checkRateLimit(ip, 'login')
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }, { status: 429 })
  }

  const { secret: submitted } = await request.json().catch(() => ({ secret: '' }))

  if (typeof submitted !== 'string' || !safeEqual(submitted, secret)) {
    // Pequeño delay para dificultar el fuerza-bruta básico.
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const store = await cookies()
  store.set('admin_token', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete('admin_token')
  return NextResponse.json({ ok: true })
}
