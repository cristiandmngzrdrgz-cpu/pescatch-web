import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!ADMIN_SECRET) return true
  try {
    const store = await cookies()
    return store.get('admin_token')?.value === ADMIN_SECRET
  } catch {
    return false
  }
}

export async function adminApiCheck(): Promise<NextResponse | null> {
  if (!ADMIN_SECRET) return null
  try {
    const store = await cookies()
    if (store.get('admin_token')?.value === ADMIN_SECRET) return null
  } catch {}
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
