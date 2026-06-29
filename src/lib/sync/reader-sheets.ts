import type { SyncRow } from './types'

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || ''
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT || ''

export async function readGoogleSheets(): Promise<SyncRow[]> {
  if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT) {
    console.log('Google Sheets not configured. Use DATA_FILE=sync-data.json instead.')
    return []
  }

  try {
    const { sheets } = await import('googleapis/build/src/apis/sheets')
    const { JWT } = await import('google-auth-library')

    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT)

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const client = sheets({ version: 'v4', auth: auth as any })

    const meta = await client.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID })
    const firstSheet = meta.data.sheets?.[0]?.properties?.title
    if (!firstSheet) {
      console.log('No sheets found in the spreadsheet')
      return []
    }

    const response = await client.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${firstSheet}!A:O`,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      console.log('Sheet has no data rows')
      return []
    }

    const headers = rows[0].map((h: string) => h.toLowerCase().replace(/\s+/g, '_'))
    const result: SyncRow[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const syncRow: Record<string, string | number | boolean | undefined> = {}

      headers.forEach((header: string, index: number) => {
        const value = row[index]?.toString().trim() || ''
        if (!value) return

        if (['amazon_price', 'decathlon_price', 'aliexpress_price', 'amazon_shipping', 'decathlon_shipping', 'aliexpress_shipping'].includes(header)) {
          syncRow[header] = parseFloat(value.replace(',', '.')) || undefined
        } else if (['featured'].includes(header)) {
          syncRow[header] = value.toLowerCase() === 'si' || value.toLowerCase() === 'yes'
        } else {
          syncRow[header] = value
        }
      })

      if (syncRow.ean) {
        result.push(syncRow as unknown as SyncRow)
      }
    }

    return result
  } catch (err) {
    console.error('Error reading Google Sheets:', (err as Error).message)
    return []
  }
}
