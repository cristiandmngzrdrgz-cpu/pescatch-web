'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid #1E3A5F' }}>
      <p className="text-sm" style={{ color: '#4A6080' }}>
        {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="sm"
          onClick={() => onPageChange(currentPage - 1)}
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
                onClick={() => onPageChange(p)}
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
          onClick={() => onPageChange(currentPage + 1)}
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
