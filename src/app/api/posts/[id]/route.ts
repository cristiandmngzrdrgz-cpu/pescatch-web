import { NextRequest, NextResponse } from 'next/server'
import { getPostById, updatePost, deletePost } from '@/data/blog-queries'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  const post = await updatePost(id, data)
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deletePost(id)
  if (!deleted) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
