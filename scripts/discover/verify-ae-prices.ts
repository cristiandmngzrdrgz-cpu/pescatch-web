// PROPÓSITO: resolver s.click.aliexpress.com -> URL /item/<PID>.html de cada candidato
//            y marcar cuáles requieren verificar el precio real (BrightData) antes de
//            publicar. La API/el cache dan un precio "desde" distinto del real.
// FECHA: 2026-08-06
// USO: npx tsx scripts/discover/verify-ae-prices.ts [--json path] [--limit N]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const forArg = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const fpath = forArg('--json') || latestCandidate()
const limit = parseInt(forArg('--limit') || '999', 10)

const AGENT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
const ITEM_RE = /\/(?:item|dp)\/(\d+)\.html/i

function latestCandidate(): string {
  const files = readdirSync(resolve('scripts/discover'))
    .filter((f) => /^candidatos-ae-.*\.json$/.test(f))
    .sort()
  const f = files[files.length - 1]
  if (!f) throw new Error('No hay candidatos-ae-*.json en scripts/discover/')
  return resolve('scripts/discover', f)
}

async function resolveClick(url: string): Promise<string> {
  if (!url.includes('s.click.aliexpress.com')) return url
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': AGENT_UA } })
    return r.url || url
  } catch {
    return url
  }
}

async function main() {
  const raw = JSON.parse(readFileSync(fpath, 'utf-8'))
  const ranked: { title: string; price: number; url: string }[] = Array.isArray(raw) ? raw : raw.ranked ?? []
  const items = ranked.slice(0, limit)
  console.log(`Candidatos: ${items.length} (de ${ranked.length})`)

  const out: { pid: string | null; itemUrl: string; title: string; price: number }[] = []
  let i = 0
  async function worker() {
    while (i < items.length) {
      const c = items[i++]
      const itemUrl = await resolveClick(c.url)
      const m = itemUrl.match(ITEM_RE)
      const pid = m ? m[1] : null
      out.push({ pid, itemUrl: pid ? `https://es.aliexpress.com/item/${pid}.html` : itemUrl, title: c.title, price: c.price })
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()))

  out.sort((a, b) => a.price - b.price)
  for (const o of out) {
    console.log(`${String(o.pid ?? 'SIN-PID').padEnd(20)} ${String(o.price).padStart(6)} \u20AC  ${o.title.slice(0, 55)}`)
    if (!o.pid) console.log(`   URL: ${o.itemUrl}`)
  }

  writeFileSync(resolve('scripts/discover/verified-ae-prices.json'), JSON.stringify(out, null, 2))
  const noPid = out.filter((o) => !o.pid).length
  console.log(`\nEscrito scripts/discover/verified-ae-prices.json (${out.length}): ${out.length - noPid} con PID, ${noPid} sin PID (revisar URL).`)
  console.log('Siguiente: para cada item, scrapear la URL real (BrightData) y fijar aliexpressPrice al precio verificado antes de publicar.')
}

main().catch((e) => { console.error(e); process.exit(1) })