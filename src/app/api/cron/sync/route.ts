import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { runSync, insertSyncLog } from '@/lib/run-sync'
import { migrateSchema } from '@/lib/db'

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    await migrateSchema()
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

    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en sync: ${message}` }, { status: 500 })
  }
}