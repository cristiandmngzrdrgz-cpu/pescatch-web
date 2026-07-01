import { NextRequest, NextResponse } from 'next/server'
import { adminApiCheck } from '@/lib/admin-auth'
import { runSync, insertSyncLog, getLastSync, getSyncLogs, getDbStats } from '@/lib/run-sync'

export async function POST() {
  const authError = await adminApiCheck()
  if (authError) return authError

  try {
    const result = await runSync()

    await insertSyncLog({
      duration_ms: result.durationMs,
      rows_processed: result.rowsProcessed,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      hidden_orphans: result.hiddenOrphans,
      errors: result.errors,
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en sync: ${message}` }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'stats'

  if (mode === 'stats') {
    const [dbStats, lastSync, history] = await Promise.all([
      getDbStats(),
      getLastSync(),
      getSyncLogs(5),
    ])

    return NextResponse.json({
      dbStats,
      lastSync,
      history,
    })
  }

  return NextResponse.json({ error: 'Modo no válido' }, { status: 400 })
}
