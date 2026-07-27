import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const allowed = await checkRateLimit(ip, 'contact')
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados mensajes. Espera un momento.' }, { status: 429 })
  }

  try {
    const { name, email, message } = await request.json()
    if (!email || typeof email !== 'string' || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Email y mensaje requeridos' }, { status: 400 })
    }
    const trimmedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Mensaje demasiado largo (máx 5000 caracteres)' }, { status: 400 })
    }

    const db = getDb()
    const cleanName = typeof name === 'string' ? name.trim().slice(0, 100) : ''
    await db.execute({
      sql: 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      args: [cleanName, trimmedEmail, message.trim()],
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al enviar mensaje: ${message}` }, { status: 500 })
  }
}
