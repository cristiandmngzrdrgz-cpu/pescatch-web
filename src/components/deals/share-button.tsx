'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ShareButton({ url, title }: { url: string; title: string }) {
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="flex-1 h-11 rounded-xl transition-all duration-200 hover:border-[#00D4FF]/40"
      style={{ border: '1px solid #1E3A5F', color: '#8BA3C7', background: '#111827' }}
    >
      <Share2 className="h-4 w-4 mr-1.5" />
      Compartir
    </Button>
  )
}
