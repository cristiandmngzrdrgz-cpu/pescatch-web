import { NextRequest, NextResponse } from 'next/server'
import { getComments, addComment } from '@/data/queries'

const rateLimitMap = new Map<string, number>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const last = rateLimitMap.get(ip) || 0
  if (now - last < 10000) return false
  rateLimitMap.set(ip, now)
  if (rateLimitMap.size > 10000) {
    for (const key of rateLimitMap.keys()) {
      rateLimitMap.delete(key)
      if (rateLimitMap.size <= 9000) break
    }
  }
  return true
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await getComments(id)
  return NextResponse.json(comments)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Demasiados comentarios. Espera unos segundos.' }, { status: 429 })
  }

  const { author, content } = await request.json()
  if (!author || !content) {
    return NextResponse.json({ error: 'author and content required' }, { status: 400 })
  }
  if (typeof author !== 'string' || typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  if (author.length > 50 || content.length > 2000) {
    return NextResponse.json({ error: 'author max 50 chars, content max 2000 chars' }, { status: 400 })
  }
  const comments = await addComment(id, author, content)
  return NextResponse.json(comments, { status: 201 })
}
