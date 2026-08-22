import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '../auth'
import { refreshAllPrices } from '@/lib/price-scraper/refresh-all'
import { migrateSchema } from '@/lib/db'
import * as fs from 'fs'
import * as path from 'path'

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    await migrateSchema()
    const result = await refreshAllPrices()

    if (result.removedIds.length > 0) {
      const file = path.resolve(process.cwd(), 'data', 'removed-deals.json')
      const existing = fs.existsSync(file)
        ? (JSON.parse(fs.readFileSync(file, 'utf8')) as string[])
        : []
      const merged = [...new Set([...existing, ...result.removedIds])]
      fs.writeFileSync(file, JSON.stringify(merged, null, 2))
    }

    return NextResponse.json({
      success: true,
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