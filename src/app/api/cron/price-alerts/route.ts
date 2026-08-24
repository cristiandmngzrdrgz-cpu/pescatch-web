import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { seedDatabase } from '@/lib/seed'
import { processPriceAlerts } from '@/lib/price-alerts'

// Vercel Cron invoca con GET + Authorization: Bearer CRON_SECRET.
export const maxDuration = 300

async function handle(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    await seedDatabase()
    const result = await processPriceAlerts()

    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en price-alerts: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
