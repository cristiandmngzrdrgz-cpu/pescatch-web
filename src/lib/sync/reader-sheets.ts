import type { SyncRow } from './types'
import { readAllRows } from './google-sheets-client'

const CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || ''

function parseCsvRow(row: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < row.length) {
    const ch = row[i]

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
      } else {
        field += ch
      }
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }

    if (ch === ',') {
      fields.push(field)
      field = ''
      i++
      continue
    }

    field += ch
    i++
  }

  fields.push(field)
  return fields
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  const rawRowStrings = text.split(/\r?\n/).filter(line => line.trim() !== '')

  for (const rawRow of rawRowStrings) {
    const fields = parseCsvRow(rawRow)
    if (fields.length > 0 && fields.some(f => f.trim() !== '')) {
      rows.push(fields)
    }
  }

  return rows
}

function toCamelCase(str: string): string {
  return str.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase())
}

function rawRowsToSyncRows(headers: string[], rawRows: string[][]): SyncRow[] {
  const result: SyncRow[] = []

  for (const row of rawRows) {
    const syncRow: Record<string, string | number | boolean | undefined> = {}

    headers.forEach((header: string, index: number) => {
      const raw = row[index]?.trim() ?? ''
      if (raw === '' || raw === undefined || raw === null) return

      const key = toCamelCase(header)

      if (['amazonPrice', 'decathlonPrice', 'aliexpressPrice', 'amazonShipping', 'decathlonShipping', 'aliexpressShipping', 'amazonOriginalPrice', 'decathlonOriginalPrice', 'aliexpressOriginalPrice'].includes(key)) {
        syncRow[key] = parseFloat(raw.replace(',', '.')) || undefined
      } else if (key === 'featured') {
        syncRow[key] = ['si', 'sí', 'yes', 'true', '1'].includes(raw.toLowerCase())
      } else {
        syncRow[key] = raw
      }
    })

    result.push(syncRow as unknown as SyncRow)
  }

  return result.filter(row => {
    const r = row as unknown as Record<string, unknown>
    return typeof r.name === 'string' && r.name.trim() !== ''
  })
}

export async function readGoogleSheets(): Promise<SyncRow[]> {
  // Try API first
  try {
    const { headers, rows } = await readAllRows()
    if (headers.length > 0 && rows.length > 0) {
      console.log(`Read ${rows.length} rows via Google Sheets API`)
      return rawRowsToSyncRows(headers, rows)
    }
  } catch (err) {
    console.log('Google Sheets API failed, falling back to CSV:', (err as Error).message)
  }

  // Fallback to CSV
  if (!CSV_URL) {
    console.log('GOOGLE_SHEET_CSV_URL not configured. Use DATA_FILE=sync-data.json instead.')
    return []
  }

  try {
    const response = await fetch(CSV_URL, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) {
      console.error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
      return []
    }

    const text = await response.text()
    const rawRows = parseCsv(text)

    if (rawRows.length < 2) {
      console.log('CSV has no data rows')
      return []
    }

    const headers = rawRows[0]
    const rows = rawRows.slice(1)
    console.log(`Read ${rows.length} rows via CSV fallback`)
    return rawRowsToSyncRows(headers, rows)
  } catch (err) {
    console.error('Error reading CSV:', (err as Error).message)
    return []
  }
}
