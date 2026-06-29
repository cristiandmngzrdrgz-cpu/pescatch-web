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
    let rowStr = rawRow
    if (rowStr.startsWith('"') && rowStr.endsWith('"')) {
      rowStr = rowStr.slice(1, -1)
    }

    const fields = parseCsvRow(rowStr)
    if (fields.length > 0 && fields.some(f => f.trim() !== '')) {
      rows.push(fields)
    }
  }

  return rows
}

function rawRowsToSyncRows(headers: string[], rawRows: string[][]): SyncRow[] {
  const result: SyncRow[] = []

  for (const row of rawRows) {
    const syncRow: Record<string, string | number | boolean | undefined> = {}

    headers.forEach((header: string, index: number) => {
      const value = row[index]?.trim() || ''
      if (!value) return

      if (['amazonPrice', 'decathlonPrice', 'aliexpressPrice', 'amazonShipping', 'decathlonShipping', 'aliexpressShipping'].includes(header)) {
        syncRow[header] = parseFloat(value.replace(',', '.')) || undefined
      } else if (header === 'featured') {
        syncRow[header] = value.toLowerCase() === 'si' || value.toLowerCase() === 'yes'
      } else {
        syncRow[header] = value
      }
    })

    result.push(syncRow as unknown as SyncRow)
  }

  return result
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
    const response = await fetch(CSV_URL)
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
