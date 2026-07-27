import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.redirect(new URL('/?unsubscribed=missing-email', request.url))
  }

  const db = getDb()
  await db.execute({
    sql: 'DELETE FROM subscribers WHERE email = ?',
    args: [email],
  })

  return NextResponse.redirect(new URL('/?unsubscribed=true', request.url))
}
