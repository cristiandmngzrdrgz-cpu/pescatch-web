import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!ADMIN_SECRET) return true
  try {
    const store = await cookies()
    const token = store.get('admin_token')?.value
    return !!token && safeEqual(token, ADMIN_SECRET)
  } catch {
    return false
  }
}

export async function adminApiCheck(): Promise<NextResponse | null> {
  if (!ADMIN_SECRET) return null
  try {
    const store = await cookies()
    const token = store.get('admin_token')?.value
    if (token && safeEqual(token, ADMIN_SECRET)) return null
  } catch {}
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
