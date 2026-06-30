import { NextResponse } from 'next/server'
import { getAllComments } from '@/data/queries'
import { adminApiCheck } from '@/lib/admin-auth'

export async function GET() {
  const authError = await adminApiCheck()
  if (authError) return authError

  const comments = await getAllComments()
  return NextResponse.json(comments)
}
