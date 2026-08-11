import { google } from 'googleapis'
import path from 'path'

// PROPÓSITO: corregir EANs de 12 (UPC) a 13 dígitos (EAN-13 = "0" + UPC) en el Sheet
// FECHA: 2026-08-10

const SHEET_ID = '1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc'
const SHEET_NAME = 'Hoja 1'

const FIXES: Record<string, string> = {
  // rowIndex (1-indexed en la hoja): nuevo EAN-13
  5: '0022255230759',
  8: '0031324038523',
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve('.env.google-sheets.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  for (const [row, ean] of Object.entries(FIXES)) {
    const cellRange = `${SHEET_NAME}!A${row}`
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: cellRange,
      valueInputOption: 'RAW',
      requestBody: { values: [[ean]] },
    })
    console.log(`A${row} -> ${ean} (${res.status})`)
  }

  const read = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A5:A8`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  })
  console.log('Verificación A5:A8:', JSON.stringify(read.data.values))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})