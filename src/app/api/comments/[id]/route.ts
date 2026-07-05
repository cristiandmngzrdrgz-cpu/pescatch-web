import { NextResponse } from 'next/server'
import { deleteComment, approveComment, rejectComment } from '@/data/queries'
import { adminApiCheck } from '@/lib/admin-auth'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const deleted = await deleteComment(Number(id))
  if (!deleted) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const { action } = await request.json()

  let ok: boolean
  if (action === 'approve') {
    ok = await approveComment(Number(id))
  } else if (action === 'reject') {
    ok = await rejectComment(Number(id))
  } else {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  if (!ok) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
