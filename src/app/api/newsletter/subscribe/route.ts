import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ success: true, message: 'Suscripción exitosa' }, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Este email ya está suscrito' }, { status: 409 })
    }
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al suscribir: ${message}` }, { status: 500 })
  }
}
