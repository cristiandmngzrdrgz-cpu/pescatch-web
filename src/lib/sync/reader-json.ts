import { readFileSync, existsSync } from 'fs'
import type { SyncRow } from './types'

export function readJsonFile(filePath: string): SyncRow[] {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return []
  }

  const raw = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : []
}
