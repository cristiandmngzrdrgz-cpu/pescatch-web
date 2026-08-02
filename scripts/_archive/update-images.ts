import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPREADSHEET_ID = '1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc';
const SHEET_NAME = 'Hoja 1';

async function getSheetsClient() {
  const credentials = JSON.parse(
    readFileSync(path.join(__dirname, '../.env.google-sheets.json'), 'utf-8')
  );
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function colLetter(idx: number): string {
  let letter = '';
  while (idx >= 0) {
    letter = String.fromCharCode((idx % 26) + 65) + letter;
    idx = Math.floor(idx / 26) - 1;
  }
  return letter;
}

async function cleanSombreroDuplicate() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) { console.log('No data'); return; }

  const headers = rows[0];
  const nameIdx = headers.findIndex(h => h === 'name');
  if (nameIdx === -1) { console.log('❌ Columna name no encontrada'); return; }

  // Buscar fila con nombre antiguo del sombrero
  const sombreroOldIdx = rows.findIndex((r, i) => 
    i > 0 && r[nameIdx]?.includes('UPF 50+ Sombrero de Sol de ala Ancha Unisex')
  );

  if (sombreroOldIdx === -1) {
    console.log('✅ No se encontró el duplicado del sombrero');
    return;
  }

  const rowNum = sombreroOldIdx + 1; // 1-indexed
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowNum - 1, // 0-indexed
              endIndex: rowNum,
            },
          },
        },
      ],
    },
  });

  console.log(`✅ Eliminada fila ${rowNum}: sombrero duplicado`);
}

cleanSombreroDuplicate().catch(console.error);
