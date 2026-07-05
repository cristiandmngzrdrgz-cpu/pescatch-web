import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/data/blog-queries'
import { adminApiCheck } from '@/lib/admin-auth'
import { postSchema, parseOrThrow, ValidationError } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10') || 10), 100)
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)
  const includeHidden = searchParams.get('includeHidden') === 'true'
  
  // Proteger endpoint si se solicitan posts ocultos
  if (includeHidden) {
    const authError = await adminApiCheck()
    if (authError) return authError
  }
  
  const posts = await getPosts(limit, offset, includeHidden)
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const data = await request.json()
  try {
    const parsed = parseOrThrow(postSchema, data)
    const post = await createPost(parsed)
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Datos inválidos', issues: err.issues }, { status: 400 })
    }
    throw err
  }
}
