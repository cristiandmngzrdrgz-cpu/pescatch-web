import { NextRequest, NextResponse } from 'next/server'
import { getDealById, updateDeal, deleteDeal } from '@/data/queries'
import { adminApiCheck } from '@/lib/admin-auth'
import { dealSchema, parseOrThrow, ValidationError } from '@/lib/validation'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = await getDealById(id)
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json(deal)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const data = await request.json()
  try {
    const parsed = parseOrThrow(dealSchema.partial(), data)
    const deal = await updateDeal(id, parsed)
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    return NextResponse.json(deal)
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

  const check = await db.execute({ sql: 'SELECT id FROM deals WHERE id = ?', args: [id] })
  if (check.rows.length === 0) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  const newStatus = status === 'published' ? 'published' : 'draft'
  await db.execute({
    sql: 'UPDATE deals SET status = ?, updatedAt = ? WHERE id = ?',
    args: [newStatus, new Date().toISOString(), id],
  })

  const deal = await getDealById(id)
  return NextResponse.json(deal)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { id } = await params
  const deleted = await deleteDeal(id)
  if (!deleted) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
