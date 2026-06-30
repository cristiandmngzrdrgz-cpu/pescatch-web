import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/data/blog-queries'
import { adminApiCheck } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10') || 10), 100)
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)
  const posts = await getPosts(limit, offset)
  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const data = await request.json()
  const post = await createPost(data)
  return NextResponse.json(post, { status: 201 })
}
