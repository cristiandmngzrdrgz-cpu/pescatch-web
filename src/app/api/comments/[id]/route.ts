import { NextResponse } from 'next/server'
import { deleteComment } from '@/data/queries'
import { adminApiCheck } from '@/lib/admin-auth'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const deleted = await deleteComment(Number(id))
  if (!deleted) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
