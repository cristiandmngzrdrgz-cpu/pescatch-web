'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ConfirmDeleteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel?: string
}

export default function ConfirmDelete({ open, onOpenChange, onConfirm, title, description, confirmLabel = 'Eliminar' }: ConfirmDeleteProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#E8F0FE' }}>{title}</DialogTitle>
          <DialogDescription style={{ color: '#8BA3C7' }}>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl" style={{ borderColor: '#1E3A5F', color: '#8BA3C7' }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="rounded-xl" style={{ background: '#EF4444', color: '#fff' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {loading ? 'Eliminando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
