import { NextResponse } from 'next/server'
import { adminApiCheck } from '@/lib/admin-auth'

export async function POST() {
  const authError = await adminApiCheck()
  if (authError) return authError

  try {
    const { execSync } = await import('child_process')
    execSync('npx tsx scripts/sync.ts', {
      cwd: process.cwd(),
      timeout: 60000,
      stdio: 'pipe',
    })
    return NextResponse.json({ message: 'Sync completado correctamente.' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error en sync: ${message}` }, { status: 500 })
  }
}
