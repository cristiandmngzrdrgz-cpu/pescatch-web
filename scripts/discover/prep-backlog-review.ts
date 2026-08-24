// PROPÓSITO: generar lista de revisión numerada del backlog restante (68), agrupando
//            copias internas del mismo producto y marcando basura obvia.
// FECHA: 2026-08-23
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface Item { id: number; t: string; p: number; src: string; url: string }

const JUNK = /(gatito|telar de madera|montessori|arco[ií]ris.*juguet|espina de pescado.*drag|freewing|b-25|plantas artificiales.*acuario|bandejas colgantes|decoraci)/i

const items: Item[] = JSON.parse(readFileSync(resolve('scripts/discover/backlog-revision.json'), 'utf-8'))

// agrupar por prefijo normalizado de título
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const groups = new Map<string, Item[]>()
for (const it of items) {
  const key = norm(it.t).slice(0, 45)
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key)!.push(it)
}

let n = 0
const out: any[] = []
for (const [, g] of groups) {
  n++
  const sorted = [...g].sort((a, b) => a.p - b.p)
  const best = sorted[0]
  const copias = sorted.length - 1
  const isJunk = JUNK.test(best.t)
  out.push({ n, ids: sorted.map(x => x.id), urls: sorted.map(x => x.url), titulo: best.t.replace(/\s*\[.*?€\]$/, ''), precio: best.p, src: best.src, copias, junk: isJunk })
}
out.sort((a, b) => Number(b.junk) - Number(a.junk) || a.precio - b.precio)

writeFileSync(resolve('scripts/discover/backlog-decisiones.json'), JSON.stringify(out, null, 1))

console.log(`Grupos: ${out.length} (de ${items.length} items)\n`)
for (const g of out) {
  const flags = [g.junk ? 'JUNK?' : '', g.copias > 0 ? `x${g.copias + 1}` : ''].filter(Boolean).join(' ')
  console.log(`${String(g.n).padStart(2)} | ${g.src.replace(' directo', '').replace(': ', '.').slice(0, 12).padEnd(12)} | ${g.precio.toFixed(2).padStart(6)} EUR | ${flags.padEnd(7)} | ${g.titulo}`)
}
