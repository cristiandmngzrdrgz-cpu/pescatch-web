'use client'

import { useState, useRef } from 'react'
import { Upload, X, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUploader({ value, onChange, label = 'Imagen' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      toast.error('La imagen no puede superar 4MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al subir')
      }
      const data = await res.json()
      onChange(data.url)
      toast.success('Imagen subida correctamente')
    } catch (err) {
      toast.error((err as Error).message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold" style={{ color: '#E8F0FE' }}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#4A6080' }} />
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://..."
            className="pl-9 h-11 rounded-xl"
            style={{ background: '#0B1120', borderColor: '#1E3A5F', color: '#E8F0FE' }}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-11 px-4 rounded-xl flex-shrink-0"
          style={{ background: '#1A2535', color: '#00D4FF', border: '1px solid #1E3A5F' }}
          aria-label="Subir imagen"
        >
          <Upload className={`h-4 w-4 ${uploading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {value && (
        <div className="relative w-full max-w-[200px] rounded-lg overflow-hidden" style={{ border: '1px solid #1E3A5F' }}>
          <Image src={value} alt="Preview" width={200} height={200} className="object-cover w-full h-32" unoptimized />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <X className="h-3 w-3" style={{ color: '#EF4444' }} />
          </button>
        </div>
      )}
    </div>
  )
}
