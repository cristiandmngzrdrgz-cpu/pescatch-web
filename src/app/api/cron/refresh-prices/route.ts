import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { refreshAllPrices } from '@/lib/price-scraper/refresh-all'
import { migrateSchema } from '@/lib/db'

// Vercel Cron invoca con GET + Authorization: Bearer CRON_SECRET.
// El refresh va por chunks (~20 deals/invocación) para no reventar el timeout
// de la función: el cursor vive en la tabla cron_state. ?limit=N ajusta el chunk,
// ?limit=all fuerza un ciclo completo (no cabe en el timeout de Vercel).
export const maxDuration = 300

const DEFAULT_CHUNK = 20

async function handle(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    await migrateSchema()

    const limitParam = request.nextUrl.searchParams.get('limit')
    let limit: number | undefined = DEFAULT_CHUNK
    if (limitParam === 'all') limit = undefined
    else if (limitParam && Number.isFinite(Number(limitParam))) limit = Math.max(1, Number(limitParam))

    const result = await refreshAllPrices({ limit })

    return NextResponse.json({
      success: true,
      chunk: limit ?? 'full',
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      removed: result.removed,
      alerts: result.alerts,
      removedIds: result.removedIds,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en refresh-prices: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
