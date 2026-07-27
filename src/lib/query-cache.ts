import { cache } from 'react'

type CacheKey = string

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<CacheKey, CacheEntry<unknown>>()
const DEFAULT_TTL_MS = 10_000

function getKey(prefix: string, args: unknown[]): string {
  return `${prefix}:${args.map(a => JSON.stringify(a)).join('|')}`
}

export function withCache<T>(prefix: string, ttlMs = DEFAULT_TTL_MS) {
  return function wrapped(fn: (...args: unknown[]) => Promise<T>): (...args: unknown[]) => Promise<T> {
    const reactCached = cache(fn)

    return async (...args: unknown[]): Promise<T> => {
      const key = getKey(prefix, args)
      const now = Date.now()
      const existing = store.get(key) as CacheEntry<T> | undefined

      if (existing && existing.expiresAt > now) {
        return existing.data
      }

      const data = await reactCached(...args)

      store.set(key, { data, expiresAt: now + ttlMs })
      return data
    }
  }
}

export function clearCache() {
  store.clear()
}

export function invalidateCache(prefix?: string) {
  if (prefix) {
    const prefixLen = prefix.length
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key)
    }
  } else {
    clearCache()
  }
}
