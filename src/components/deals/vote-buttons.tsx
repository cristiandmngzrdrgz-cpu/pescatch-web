'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoteButtonsProps {
  dealId: string
  initialUp: number
  initialDown: number
}

function getVoteKey(dealId: string) {
  return `pescatch_vote_${dealId}`
}

export function VoteButtons({ dealId, initialUp, initialDown }: VoteButtonsProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [upCount, setUpCount] = useState(initialUp)
  const [downCount, setDownCount] = useState(initialDown)

  useEffect(() => {
    const stored = localStorage.getItem(getVoteKey(dealId))
    if (stored === 'up' || stored === 'down') {
      setVote(stored)
    }
  }, [dealId])

  const handleVote = (type: 'up' | 'down') => {
    if (vote === type) {
      setVote(null)
      localStorage.removeItem(getVoteKey(dealId))
      if (type === 'up') setUpCount(prev => prev - 1)
      else setDownCount(prev => prev - 1)
      return
    }

    if (vote) {
      if (vote === 'up') setUpCount(prev => prev - 1)
      else setDownCount(prev => prev - 1)
    }

    setVote(type)
    localStorage.setItem(getVoteKey(dealId), type)
    if (type === 'up') setUpCount(prev => prev + 1)
    else setDownCount(prev => prev + 1)
  }

  return (
    <div className="flex items-center gap-1">
      <div className="text-sm mr-2" style={{ color: '#8BA3C7' }}>til?</div>
      <Button
        variant="ghost"
        size="sm"
        className={`h-10 w-10 p-0 rounded-xl border ${vote === 'up' ? 'text-green-400' : ''}`}
        style={{
          borderColor: vote === 'up' ? '#26DE81' : '#1E3A5F',
          background: vote === 'up' ? 'rgba(38,222,129,0.1)' : 'transparent',
          color: vote === 'up' ? '#26DE81' : '#4A6080',
        }}
        onClick={() => handleVote('up')}
        title="til"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
      <span className="font-bold text-sm w-6 text-center tabular-nums" style={{ color: '#E8F0FE' }}>{upCount}</span>

      <Button
        variant="ghost"
        size="sm"
        className={`h-10 w-10 p-0 rounded-xl border ml-2 ${vote === 'down' ? 'text-red-400' : ''}`}
        style={{
          borderColor: vote === 'down' ? '#EF4444' : '#1E3A5F',
          background: vote === 'down' ? 'rgba(239,68,68,0.1)' : 'transparent',
          color: vote === 'down' ? '#EF4444' : '#4A6080',
        }}
        onClick={() => handleVote('down')}
        title="No til"
      >
        <ChevronDown className="h-5 w-5" />
      </Button>
      <span className="font-bold text-sm w-6 text-center tabular-nums" style={{ color: '#E8F0FE' }}>{downCount}</span>

      {vote && <span className="text-xs font-medium ml-2" style={{ color: '#00D4FF' }}>Gracias!</span>}
    </div>
  )
}
