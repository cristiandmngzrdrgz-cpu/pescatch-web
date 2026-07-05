'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  basePath?: string
}

export function SearchPagination({ currentPage, totalPages, total, pageSize, basePath }: SearchPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${basePath || '/search'}?${params.toString()}`)
  }

  const start = Math.min((currentPage - 1) * pageSize + 1, total)
  const end = Math.min(currentPage * pageSize, total)

  return (
    <div className="flex items-center justify-between px-5 py-4 mt-6 rounded-xl" style={{
      background: '#111827',
      border: '1px solid #1E3A5F',
    }}>
      <p className="text-sm" style={{ color: '#4A6080' }}>
        {start}–{end} de {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 rounded-lg"
          style={{ color: '#8BA3C7' }}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center">
              {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1" style={{ color: '#4A6080' }}>...</span>}
              <Button
                variant="ghost" size="sm"
                onClick={() => goToPage(p)}
                className="h-8 min-w-[32px] px-2 rounded-lg text-sm font-medium"
                style={{
                  background: p === currentPage ? 'rgba(0,212,255,0.15)' : 'transparent',
                  color: p === currentPage ? '#00D4FF' : '#8BA3C7',
                }}
              >
                {p}
              </Button>
            </span>
          ))}
        <Button
          variant="ghost" size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 rounded-lg"
          style={{ color: '#8BA3C7' }}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
