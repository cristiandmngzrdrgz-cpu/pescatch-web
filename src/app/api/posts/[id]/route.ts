import { NextRequest, NextResponse } from 'next/server'
import { getPostById, updatePost, deletePost } from '@/data/blog-queries'
import { adminApiCheck } from '@/lib/admin-auth'
import { postSchema, parseOrThrow, ValidationError } from '@/lib/validation'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const data = await request.json()
  try {
    const parsed = parseOrThrow(postSchema.partial(), data)
    const post = await updatePost(id, parsed)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    throw err
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const { status } = await request.json()
  const db = (await import('@/lib/db')).getDb()

  const check = await db.execute({ sql: 'SELECT id FROM posts WHERE id = ?', args: [id] })
  if (check.rows.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const newStatus = status === 'published' ? 'published' : 'draft'
  await db.execute({
    sql: 'UPDATE posts SET status = ?, hidden = ?, updatedAt = ? WHERE id = ?',
    args: [newStatus, newStatus !== 'published' ? 1 : 0, new Date().toISOString(), id],
  })

  const post = await getPostById(id)
  return NextResponse.json(post)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const deleted = await deletePost(id)
  if (!deleted) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
