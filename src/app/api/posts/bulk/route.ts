import { NextResponse } from 'next/server'
import { adminApiCheck } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const { ids, action } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No se proporcionaron IDs' }, { status: 400 })
  }

  const db = getDb()
  const placeholders = ids.map(() => '?').join(',')

  try {
    switch (action) {
      case 'publish':
        await db.execute({
          sql: `UPDATE posts SET status = 'published', hidden = 0 WHERE id IN (${placeholders})`,
          args: ids,
        })
        break
      case 'draft':
        await db.execute({
          sql: `UPDATE posts SET status = 'draft', hidden = 1 WHERE id IN (${placeholders})`,
          args: ids,
        })
        break
      case 'delete':
        await db.execute({
          sql: `DELETE FROM posts WHERE id IN (${placeholders})`,
          args: ids,
        })
        break
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch {
    return NextResponse.json({ error: 'Error al ejecutar acción en lote' }, { status: 500 })
  }
}
