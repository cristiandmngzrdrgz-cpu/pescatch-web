'use client'

import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

const DEBOUNCE_MS = 2000

export function useAutoSave<T extends Record<string, unknown>>(prefix: string, data: T) {
  const keyRef = useRef<string | null>(null)

  useEffect(() => {
    if (keyRef.current === null) {
      keyRef.current = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
  }, [prefix])

  useEffect(() => {
    if (!data || Object.keys(data).length === 0 || !keyRef.current) return
    const key = keyRef.current
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch {
        // localStorage full or unavailable - silently ignore
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [data])

  const restoreDraft = useCallback((): T | null => {
    try {
      // Backward compat: check exact old-style key
      const oldRaw = localStorage.getItem(prefix)
      if (oldRaw) {
        try { return JSON.parse(oldRaw) as T } catch { /* ignore and continue */ }
      }

      const matchingKeys: { k: string; time: number }[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(prefix + '-') && k !== prefix) {
          const rest = k.slice(prefix.length + 1)
          const time = parseInt(rest.split('-')[0], 10)
          if (!isNaN(time)) matchingKeys.push({ k, time })
        }
      }
      if (matchingKeys.length === 0) return null
      matchingKeys.sort((a, b) => b.time - a.time)
      const raw = localStorage.getItem(matchingKeys[0].k)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }, [prefix])

  const clearDraft = useCallback(() => {
    try {
      const toRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(prefix + '-')) {
          toRemove.push(k)
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  }, [prefix])

  const checkAndRestore = useCallback((onRestore: (draft: T) => void) => {
    const draft = restoreDraft()
    if (!draft) return
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