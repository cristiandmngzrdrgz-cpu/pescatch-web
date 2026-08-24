import { google, sheets_v4 } from 'googleapis'
import path from 'path'

const SHEET_ID = '1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc'
const SHEET_NAME = 'Hoja 1'
const RANGE = SHEET_NAME

let _sheets: sheets_v4.Resource$Spreadsheets$Values | null = null

function getAuthOptions() {
  if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
    return { credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS) }
  }
  return { keyFilename: path.resolve('.env.google-sheets.json') }
}

async function getClient() {
  if (_sheets) return _sheets
  const auth = new google.auth.GoogleAuth({
    ...getAuthOptions(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const client = google.sheets({ version: 'v4', auth })
  _sheets = client.spreadsheets.values
  return _sheets
}

export type SheetRow = Record<string, string | number | boolean | undefined>

export async function readAllRows(): Promise<{ headers: string[]; rows: string[][] }> {
  const values = await getClient()
  const res = await values.get({ spreadsheetId: SHEET_ID, range: RANGE })
  const data = res.data.values || []
  if (data.length < 2) return { headers: [], rows: [] }
  return { headers: data[0], rows: data.slice(1) }
}

export async function updateCell(rowIndex: number, colIndex: number, value: string | number | boolean) {
  const values = await getClient()
  const cellRange = `${SHEET_NAME}!${colToLetters(colIndex)}${rowIndex + 1}` // +1 because sheet is 1-indexed, row 0 = header
  await values.update({
    spreadsheetId: SHEET_ID,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  })
}

export async function updateRowByEan(ean: string, header: string, value: string | number | boolean) {
  const { headers, rows } = await readAllRows()
  const colIndex = headers.indexOf(header)
  if (colIndex === -1) throw new Error(`Column "${header}" not found`)

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === ean) {
      await updateCell(i + 1, colIndex, value) // +1 for header offset
      return true
    }
  }
  return false
}

export async function updateRowByIndex(rowIndex: number, header: string, value: string | number | boolean) {
  const { headers } = await readAllRows()
  const colIndex = headers.indexOf(header)
  if (colIndex === -1) throw new Error(`Column "${header}" not found`)
  await updateCell(rowIndex + 1, colIndex, value) // +1 for header offset
}

export async function appendRow(values: (string | number | boolean)[]) {
  const sheets = await getClient()
  await sheets.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
}

/**
 * Elimina filas de datos por índice 0-based (fila de hoja = índice + 2, cabecera incluida).
 * Borra de abajo hacia arriba para que los índices no se desplacen.
 */
export async function deleteDataRows(dataIndices: number[]) {
  const auth = new google.auth.GoogleAuth({
    ...getAuthOptions(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const sorted = [...dataIndices].sort((a, b) => b - a)
  for (const idx of sorted) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: idx + 1, // +1 por la fila de cabecera
              endIndex: idx + 2,
            },
          },
        }],
      },
    })
  }
}

export async function ensureHeaders(headers: string[]) {
  let existing: string[]
  try {
    const result = await readAllRows()
    existing = result.headers
  } catch (err) {
    console.error('ensureHeaders: error reading existing headers:', (err as Error).message)
    return
  }
  const missing = headers.filter(h => !existing.includes(h))
  if (missing.length === 0) return

  const values = await getClient()
  const startCol = existing.length
  const endCol = startCol + missing.length - 1
  if (endCol > 25) {
    await ensureGridColumns(endCol + 1)
  }
  for (let i = 0; i < missing.length; i++) {
    const colRange = `${SHEET_NAME}!${colToLetters(startCol + i)}1`
    await values.update({
      spreadsheetId: SHEET_ID,
      range: colRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[missing[i]]] },
    })
  }
}

async function ensureGridColumns(minColumns: number) {
  const auth = new google.auth.GoogleAuth({
    ...getAuthOptions(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { columnCount: minColumns } },
            fields: 'gridProperties.columnCount',
          },
        },
      ],
    },
  })
}

function colToLetters(col: number): string {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode(65 + (col % 26)) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}
