import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_SECRET = process.env.ADMIN_SECRET

// Comparación en tiempo constante para no filtrar el secreto por timing attack.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: NextRequest) {
  // Si no hay ADMIN_SECRET configurado, no dejamos "pasar" el login:
  // isAdminAuthenticated() ya deja entrar a todo el mundo en ese caso,
  // así que aquí simplemente no montamos ninguna cookie.
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'ADMIN_SECRET no configurado en el servidor' }, { status: 500 })
  }

  const { secret } = await request.json().catch(() => ({ secret: '' }))

  if (typeof secret !== 'string' || !safeEqual(secret, ADMIN_SECRET)) {
    // Pequeño delay para dificultar el fuerza-bruta básico.
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const store = await cookies()
  store.set('admin_token', ADMIN_SECRET, {
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
