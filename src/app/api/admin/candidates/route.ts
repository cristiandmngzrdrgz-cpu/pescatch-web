import { NextRequest, NextResponse } from 'next/server'
import { adminApiCheck } from '@/lib/admin-auth'
import { approveCandidate, rejectCandidate, getPendingCandidates, getCandidateCount } from '@/lib/pending-candidates'
import { readAllRows, appendRow } from '@/lib/sync/google-sheets-client'

export async function GET() {
  const authError = await adminApiCheck()
  if (authError) return authError

  const candidates = await getPendingCandidates(50)
  const counts = await getCandidateCount()

  return NextResponse.json({ candidates, counts })
}

export async function POST(request: NextRequest) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const body = await request.json()
  const { action, id } = body as { action: 'approve' | 'reject'; id: number }

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
  }

  if (action === 'approve') {
    const ok = await approveCandidate(id)
    if (!ok) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

    try {
      const { headers, rows } = await readAllRows()
      const candidate = (await getPendingCandidates(100)).find(c => c.id === id)
      if (candidate && candidate.asin) {
        const rowData: Record<string, string | number | boolean> = {
          ean: candidate.ean || '',
          name: candidate.title,
          brand: candidate.brand || '',
          category: candidate.category,
          amazonPrice: candidate.price,
          amazonUrl: candidate.url,
          amazonShipping: 0,
          amazonStock: 'in_stock',
        }
        const row = headers.map(h => rowData[h] ?? '')
        await appendRow(row)
      }
    } catch (err) {
      console.error('Error appending to sheet:', err)
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    const ok = await rejectCandidate(id)
    if (!ok) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
