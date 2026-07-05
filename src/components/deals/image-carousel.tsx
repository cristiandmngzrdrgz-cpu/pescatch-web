'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Fish } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface ImageCarouselProps {
  images: string[]
  title: string
  badge?: ReactNode
  stockBadge?: ReactNode
}

export function ImageCarousel({ images, title, badge, stockBadge }: ImageCarouselProps) {
  const validImages = images.filter(Boolean)
  const [activeIndex, setActiveIndex] = useState(0)

  const prev = () => setActiveIndex(i => (i === 0 ? (validImages.length - 1) : i - 1))
  const next = () => setActiveIndex(i => (i === validImages.length - 1 ? 0 : i + 1))

  const mainImage = validImages[activeIndex]

  return (
    <div>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))' }}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Fish className="w-20 h-20" style={{ color: '#00D4FF' }} />
          </div>
        )}

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: 'inset 0 0 60px rgba(0,212,255,0.1)' }} />

        {badge && <div className="absolute top-4 left-4">{badge}</div>}
        {stockBadge && <div className="absolute top-4 right-4">{stockBadge}</div>}

        {validImages.length > 1 && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.preventDefault(); prev() }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(11,17,32,0.7)', backdropFilter: 'blur(8px)' }}
                  aria-label="Imagen anterior">
                  <ChevronLeft className="w-5 h-5" style={{ color: '#E8F0FE' }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Anterior</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.preventDefault(); next() }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(11,17,32,0.7)', backdropFilter: 'blur(8px)' }}
                  aria-label="Siguiente imagen">
                  <ChevronRight className="w-5 h-5" style={{ color: '#E8F0FE' }} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Siguiente</TooltipContent>
            </Tooltip>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {validImages.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); setActiveIndex(i) }}
                  className="w-2 h-2 rounded-full transition-all duration-200"
                  style={{
                    background: i === activeIndex ? '#00D4FF' : 'rgba(255,255,255,0.3)',
                    transform: i === activeIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                  aria-label={`Imagen ${i + 1} de ${validImages.length}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-3 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {validImages.map((img, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.preventDefault(); setActiveIndex(i) }}
                  className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{
                    border: i === activeIndex ? '2px solid #00D4FF' : '2px solid transparent',
                    background: 'linear-gradient(135deg, #1A2535, rgba(0,212,255,0.05))',
                    boxShadow: i === activeIndex ? '0 0 15px rgba(0,212,255,0.35)' : 'none',
                  }}
                  aria-label={`Imagen ${i + 1}`}>
                  <Image src={img} alt={`${title} ${i + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Imagen {i + 1}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}
