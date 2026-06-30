'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FAVORITES_KEY = 'pescatch_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const toggle = (dealId: string) => {
    setFavorites(prev => {
      const next = prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }

  const isFavorite = (dealId: string) => favorites.includes(dealId)

  return { favorites, toggle, isFavorite }
}

interface FavoriteButtonProps {
  dealId: string
}

export function FavoriteButton({ dealId }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(dealId)

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1 h-11 rounded-xl"
      style={{
        borderColor: active ? '#EF4444' : '#1E3A5F',
        color: active ? '#EF4444' : '#8BA3C7',
        background: active ? 'rgba(239,68,68,0.1)' : 'transparent',
      }}
      onClick={() => toggle(dealId)}
    >
      <Heart className={`h-4 w-4 mr-1.5 ${active ? 'fill-[#EF4444]' : ''}`} />
      {active ? 'Guardado' : 'Favorito'}
    </Button>
  )
}
