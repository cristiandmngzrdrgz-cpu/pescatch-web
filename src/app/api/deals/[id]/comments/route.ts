import { NextRequest, NextResponse } from 'next/server'
import { getComments, addComment } from '@/data/queries'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = getComments(id)
  return NextResponse.json(comments)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { author, content } = await request.json()
  if (!author || !content) {
    return NextResponse.json({ error: 'author and content required' }, { status: 400 })
  }
  const comments = addComment(id, author, content)
  return NextResponse.json(comments, { status: 201 })
}
