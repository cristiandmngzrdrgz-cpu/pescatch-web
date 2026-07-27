import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Rate limit: máx 10 votos por IP cada 10 minutos
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `vote:${ip}:${id}`
  const allowed = await checkRateLimit(key, 'votes')
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados votos. Espera un momento.' }, { status: 429 })
  }

  const { vote } = await request.json()

  if (vote !== 'up' && vote !== 'down') {
    return NextResponse.json({ error: 'vote must be "up" or "down"' }, { status: 400 })
  }

  const { voteDeal } = await import('@/data/queries')
  const result = await voteDeal(id, vote)
  if (!result) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(result)
}
