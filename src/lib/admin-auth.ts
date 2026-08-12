import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { safeEqual } from '@/lib/auth-utils'

function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = getAdminSecret()
  if (!secret) return true
  try {
    const store = await cookies()
    const token = store.get('admin_token')?.value
    return !!token && safeEqual(token, secret)
  } catch {
    return false
  }
}

export async function adminApiCheck(): Promise<NextResponse | null> {
  const secret = getAdminSecret()
  if (!secret) return null
  try {
    const store = await cookies()
    const token = store.get('admin_token')?.value
    if (token && safeEqual(token, secret)) return null
  } catch {}
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
