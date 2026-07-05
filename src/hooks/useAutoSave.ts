'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

const DEBOUNCE_MS = 2000

export function useAutoSave<T extends Record<string, unknown>>(key: string, data: T) {
  const savedRef = useRef(false)

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        savedRef.current = true
      } catch {
        // localStorage full or unavailable - silently ignore
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [key, data])

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }, [key])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }, [key])

  const checkAndRestore = useCallback((onRestore: (draft: T) => void) => {
    const draft = restoreDraft()
    if (!draft) return
    // Don't restore if draft is empty (los arrays vacíos son truthy en JS,
    // hay que comprobar su longitud para no disparar el prompt en falso)
    const hasContent = Object.values(draft).some(v => Array.isArray(v) ? v.length > 0 : !!v)
    if (!hasContent) return
    toast('Borrador encontrado', {
      description: '¿Quieres recuperar el borrador guardado?',
      action: { label: 'Recuperar', onClick: () => onRestore(draft) },
      duration: 10000,
      cancel: { label: 'Descartar', onClick: () => clearDraft() },
      onDismiss: () => clearDraft(),
    })
  }, [restoreDraft, clearDraft])

  return { clearDraft, restoreDraft, checkAndRestore }
}
