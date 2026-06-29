<!-- BEGIN:project-status -->
# Project State

Read `TODO.md` in the project root for the full project status, completed items, next steps, and architecture notes.
Update `TODO.md` whenever you complete a task or discover something new.
<!-- END:project-status -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:sheet-workflow -->
# Workflow: poblar el Sheet (corazón del proyecto)

## Estructura del sheet
- Google Sheet ID: `1h1T46ckMSZ73QSnX88ELxRQNiAyURxugOj3QEZH4IZc`
- Nombre hoja: `Hoja 1`
- Service account: `.env.google-sheets.json`
- API client: `src/lib/sync/google-sheets-client.ts` (funciones: readAllRows, updateCell, ensureHeaders)

## Categorías objetivo
| Categoría | NodeId Amazon | Productos actuales |
|-----------|--------------|-------------------|
| carretes  | 2930152031   | DAIWA Ninja LT, Shimano Stradic FL, Penn Spinfisher VI |
| canas     | 2930157031   | Abu Garcia Devil, Daiwa Sweepfire |
| senuelos  | 2930195031   | Vicloon Kit 120pz, Rapala Original Floating |
| accesorios | -           | Berkley Sick Braid |

## Investigación de bestsellers (ya hecha)
Mejor usar BrightData para scrapear:
- `https://www.amazon.es/gp/bestsellers/sports/2930152031` (carretes)
- `https://www.amazon.es/gp/bestsellers/sports/2930157031` (cañas)
- `https://www.amazon.es/gp/bestsellers/sports/2930195031` (señuelos)

## Para cada producto nuevo
1. Buscar ASIN en Amazon.es via BrightData o Playwright
2. Navegar a `https://www.amazon.es/dp/{ASIN}` con Playwright
3. Extraer: `#landingImage` src, `.a-price .a-offscreen` text
4. Buscar equivalente en Decathlon.es via BrightData
5. Escribir en sheet via `updateCell()`
6. Ejecutar `npm run sync`

## Contacto Sheet API
```typescript
import { readAllRows, updateCell, ensureHeaders } from '../src/lib/sync/google-sheets-client'
const { headers, rows } = await readAllRows()
// row es 0-indexed (rows[0]=primera fila de datos), sheet row = row+1
await updateCell(sheetRow, colIndex, value)
```

## Productos actuales (27)
Los primeros 13 tienen datos de Amazon (ASIN, imagen, precio). Los 14 adicionales son productos de Decathlon.

| # | Tipo | Nombre | Categoría |
|---|------|--------|-----------|
| 1-13 | Amazon + Decathlon/AliE | DAIWA Ninja, Abu Garcia Devil, Vicloon Kit, Shimano Stradic, Shimano FX XT, Rapala, Penn Spinfisher, Daiwa Sweepfire, Berkley Sick Braid, Mitchell Mx1 (+AliE 21,76€), Abu Garcia Cardinal X, Abu Garcia Tormentor2, TRUSCEND Kit | carretes, canas, senuelos, accesorios |
| 14-27 | Solo Decathlon | Shimano Ultegra, Sienna FG, Daiwa Crossfire, Caperlan R100, Mitchell Avocet, Caperlan RFT, WXM 500, Shimano Vengeance, WXM 100, Ilicium 500, Daiwa Legalis, Okuma Altera, etc. | carretes, canas |

## Prioridades próximas
1. **Buscar Amazon equivalents** para los 14 productos Decathlon (mejorar multi-tienda)
2. **Buscar más productos** en señuelos y accesorios (actualmente hay pocos)
3. **Buscar más Decathlon** para completar las categorías faltantes
4. **Rediseño conversión** (hero, CTA, badges, pruebas sociales)

## Notas técnicas
- Caperlan = marca propia Decathlon, no tiene equivalentes en Amazon
- Productos Shimano/Daiwa/Mitchell en Decathlon suelen ser modelos distintos a los de Amazon
- Decathlon tiene su propio marketplace (Leurre de la Pêche, etc.) con otras marcas
- Para multi-tienda real, priorizar productos que existan en AMBOS canales

## Problemas conocidos
- Los EAN con leading zeros se corrompen al escribir con USER_ENTERED; usar RAW mode
- Los productos genéricos (sin EAN) generan slug por nombre
- Al borrar DB y re-sync, los productos antiguos quedan huérfanos; mejor eliminar `data/pescatch.db`
<!-- END:sheet-workflow -->
