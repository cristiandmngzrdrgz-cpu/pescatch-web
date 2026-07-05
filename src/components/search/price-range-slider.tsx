'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useCallback } from 'react'
import * as Slider from '@radix-ui/react-slider'

interface PriceRangeSliderProps {
  min: number
  max: number
  step?: number
  basePath?: string
}

export function PriceRangeSlider({ min, max, step = 5, basePath = '/search' }: PriceRangeSliderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentMin = Number(searchParams.get('minPrice')) || min
  const currentMax = Number(searchParams.get('maxPrice')) || max

  const [value, setValue] = useState<[number, number]>([currentMin, currentMax])

  const updateUrl = useCallback((newMin: number, newMax: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newMin > min) params.set('minPrice', String(newMin))
      else params.delete('minPrice')
      if (newMax < max) params.set('maxPrice', String(newMax))
      else params.delete('maxPrice')
      params.delete('page')
      router.push(`${basePath}?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams, min, max, basePath])

  const handleValueCommit = (newValue: number[]) => {
    updateUrl(newValue[0], newValue[1])
  }

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: '#8BA3C7' }}>
          {value[0]}€
        </span>
        <span className="text-xs font-medium" style={{ color: '#8BA3C7' }}>
          {value[1]}€
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        onValueChange={(v) => setValue([v[0], v[1]])}
        onValueCommit={handleValueCommit}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
      >
        <Slider.Track
          className="relative grow rounded-full h-1.5"
          style={{ background: '#1E3A5F' }}
        >
          <Slider.Range
            className="absolute rounded-full h-full"
            style={{ background: '#00D4FF' }}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 rounded-full shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50"
          style={{ background: '#00D4FF', boxShadow: '0 0 10px rgba(0,212,255,0.4)' }}
          aria-label="Precio mínimo"
        />
        <Slider.Thumb
          className="block w-4 h-4 rounded-full shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50"
          style={{ background: '#00D4FF', boxShadow: '0 0 10px rgba(0,212,255,0.4)' }}
          aria-label="Precio máximo"
        />
      </Slider.Root>
      {isPending && (
        <div className="text-xs mt-1 text-center" style={{ color: '#00D4FF' }}>
          Actualizando...
        </div>
      )}
    </div>
  )
}
