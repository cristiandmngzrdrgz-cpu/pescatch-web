'use client'

import type { PricePoint } from '@/types'
import { formatPrice, formatDateShort } from '@/lib/utils'

interface PriceHistoryChartProps {
  history: PricePoint[]
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  if (history.length < 2) {
    return <p className="text-sm" style={{ color: '#4A6080' }}>No hay suficientes datos históricos.</p>
  }

  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const prices = sorted.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = maxPrice - minPrice || 1

  const width = 300
  const height = 150
  const padding = { top: 10, right: 10, bottom: 25, left: 45 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const xScale = (i: number) => padding.left + (i / (sorted.length - 1)) * chartW
  const yScale = (price: number) => padding.top + chartH - ((price - minPrice) / range) * chartH

  const points = sorted.map((p, i) => `${xScale(i)},${yScale(p.price)}`).join(' ')

  const lastIdx = sorted.length - 1
  const currentPrice = sorted[lastIdx].price
  const firstPrice = sorted[0].price
  const priceChange = currentPrice - firstPrice
  const isDown = priceChange < 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-semibold ${isDown ? 'text-green-400' : 'text-red-400'}`}>
          {isDown ? '▼' : '▲'} {formatPrice(Math.abs(priceChange))}
        </span>
        <span className="text-xs" style={{ color: '#4A6080' }}>desde {formatDateShort(sorted[0].date)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="p-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <polygon
          points={`${xScale(0)},${padding.top + chartH} ${points} ${xScale(lastIdx)},${padding.top + chartH}`}
          fill="url(#p-gradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#00D4FF"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {[0, lastIdx].map((i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(sorted[i].price)}
            r="4"
            fill="#00D4FF"
            style={{ transition: 'r 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.setAttribute('r', '6') }}
            onMouseLeave={(e) => { e.currentTarget.setAttribute('r', '4') }}
          />
        ))}

        {[minPrice, maxPrice].map((price, i) => (
          <text
            key={`y-${i}-${price}`}
            x={padding.left - 5}
            y={yScale(price) + 4}
            textAnchor="end"
            className="text-[10px]"
            fill="#4A6080"
          >
            {formatPrice(price)}
          </text>
        ))}

        {[0, Math.floor(sorted.length / 2), lastIdx].map((i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - 5}
            textAnchor="middle"
            className="text-[10px]"
            fill="#4A6080"
          >
            {formatDateShort(sorted[i].date)}
          </text>
        ))}
      </svg>
    </div>
  )
}
