'use client'

import { useState, useEffect } from 'react'

interface Candidate {
  id: number
  asin: string
  title: string
  price: number
  originalPrice: number | null
  rating: number
  reviews: number
  url: string
  category: string
  imageUrl: string | null
  brand: string | null
  score: number
  source: string
}

interface Counts {
  pending: number
  approved: number
  rejected: number
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/admin/candidates')
        const data = await res.json()
        if (!cancelled) {
          setCandidates(data.candidates)
          setCounts(data.counts)
        }
      } catch (err) {
        console.error('Error fetching candidates:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setActionLoading(id)
    try {
      await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      setCandidates(prev => prev.filter(c => c.id !== id))
      setCounts(prev => ({
        ...prev,
        pending: prev.pending - 1,
        [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1,
      }))
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando candidatos...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Candidatos Pendientes</h1>
        <p className="text-muted-foreground">
          {counts.pending} pendientes · {counts.approved} aprobados · {counts.rejected} rechazados
        </p>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No hay candidatos pendientes. Ejecuta <code>npx tsx scripts/discover/auto.ts</code> para buscar nuevos productos.
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <div key={c.id} className="rounded-lg border p-4 flex gap-4">
              {c.imageUrl && (
                <img src={c.imageUrl} alt={c.title} className="w-20 h-20 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium truncate">{c.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {c.brand && <span className="mr-2">{c.brand} ·</span>}
                      {c.category} · Score: {c.score}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(c.id, 'approve')}
                      disabled={actionLoading === c.id}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleAction(c.id, 'reject')}
                      disabled={actionLoading === c.id}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="font-medium">€{c.price.toFixed(2)}</span>
                  {c.originalPrice && c.originalPrice > c.price && (
                    <span className="text-muted-foreground line-through">€{c.originalPrice.toFixed(2)}</span>
                  )}
                  {c.rating > 0 && <span>{c.rating.toFixed(1)}⭐</span>}
                  {c.reviews > 0 && <span>{c.reviews} rev.</span>}
                  <span className="text-xs text-muted-foreground">{c.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
