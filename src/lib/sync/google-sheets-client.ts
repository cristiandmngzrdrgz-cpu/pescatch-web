import { google, sheets_v4 } from 'googleapis'
import path from 'path'

const SHEET_ID = '1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc'
const SHEET_NAME = 'Hoja 1'
const RANGE = `${SHEET_NAME}!A1:R100`

let _sheets: sheets_v4.Resource$Spreadsheets$Values | null = null

async function getClient() {
  if (_sheets) return _sheets
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve('.env.google-sheets.json'),
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

export async function ensureHeaders(headers: string[]) {
  const { headers: existing } = await readAllRows()
  const missing = headers.filter(h => !existing.includes(h))
  if (missing.length === 0) return

  const values = await getClient()
  const startCol = existing.length
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

function colToLetters(col: number): string {
  let result = ''
  while (col >= 0) {
    result = String.fromCharCode(65 + (col % 26)) + result
    col = Math.floor(col / 26) - 1
  }
  return result
}
