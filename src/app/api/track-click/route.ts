import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { clickId, dealId, storeId } = await request.json()
    
    if (!clickId || !dealId || !storeId) {
      return NextResponse.json({ error: 'Parámetros requeridos: clickId, dealId, storeId' }, { status: 400 })
    }

    const db = getDb()
    
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    await db.execute({
      sql: `INSERT OR IGNORE INTO click_tracking (clickId, dealId, storeId, timestamp, userAgent, referrer, ip)
            VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`,
      args: [clickId, dealId, storeId, userAgent, referrer, ip],
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al registrar click: ${message}` }, { status: 500 })
  }
}