'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchInput({ className = '' }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [isPending, startTransition] = useTransition()

  const updateUrl = useCallback((query: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set('q', query.trim())
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.push(`/search?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== (searchParams.get('q') ?? '')) {
        updateUrl(value)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [value, searchParams, updateUrl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl(value)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#4A6080' }} />
      <Input
        placeholder="Buscar chollos..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-8 h-9 text-sm rounded-lg transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(30,58,95,0.5)',
          color: '#E8F0FE',
        }}
      />
      {isPending && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" style={{ color: '#00D4FF' }} />
      )}
    </form>
  )
}
