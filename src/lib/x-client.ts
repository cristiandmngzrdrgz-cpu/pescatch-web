import { createHmac } from 'crypto'

const X_API = 'https://api.twitter.com/2'

export function isXConfigured(): boolean {
  return Boolean(
    process.env.X_API_KEY &&
      process.env.X_API_SECRET &&
      process.env.X_ACCESS_TOKEN &&
      process.env.X_ACCESS_SECRET
  )
}

function getAuthHeader(method: string, url: string, params: Record<string, string>): string {
  // X API v2 con OAuth 1.0a — implementación mínima sin dependencias
  // Si no hay creds, nunca se llama (gate isXConfigured)
  const consumerKey = process.env.X_API_KEY!
  const consumerSecret = process.env.X_API_SECRET!
  const accessToken = process.env.X_ACCESS_TOKEN!
  const accessSecret = process.env.X_ACCESS_SECRET!
  const nonce = Math.random().toString(36).slice(2)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  }
  const all = { ...oauthParams, ...params }
  const sorted = Object.keys(all)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(all[k])}`)
    .join('&')
  const base = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sorted)}`
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessSecret)}`
  const sig = createHmac('sha1', signingKey).update(base).digest('base64')
  const headerPairs = Object.entries({ ...oauthParams, oauth_signature: sig })
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')
  return `OAuth ${headerPairs}`
}

export async function postTweet(text: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isXConfigured()) return { ok: false, error: 'X no configurado (X_API_KEY/SECRET + X_ACCESS_TOKEN/SECRET)' }
  if (text.length > 280) return { ok: false, error: `Tweet ${text.length}c >280` }
  const url = `${X_API}/tweets`
  const body = JSON.stringify({ text })
  try {
    const auth = getAuthHeader('POST', url, {})
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(15000),
    })
    const data = (await res.json()) as { data?: { id: string }; detail?: string; title?: string }
    if (!res.ok) return { ok: false, error: data.detail || data.title || `HTTP ${res.status}` }
    return { ok: true, id: data.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function buildXText(deals: Array<{ title: string; salePrice: number; slug: string }>): string {
  // 280c: gancho + top 2 chollos + CTA dominio propio (no amazon directo)
  const BASE = 'https://www.pescatch.es'
  const top = deals.slice(0, 2)
  const lines = top.map(d => `🎣 ${d.title.slice(0, 42)} — ${d.salePrice.toFixed(2)}€ → ${BASE}/deals/${d.slug}`)
  const tail = `⚡ Más en ${BASE}/top-chollos #pesca #carpfishing`
  const candidate = lines.join('\n') + '\n' + tail
  if (candidate.length <= 280) return candidate
  // recorta títulos si excede
  const short = top.map(d => `🎣 ${d.title.slice(0, 24)}… ${d.salePrice.toFixed(2)}€ ${BASE}/deals/${d.slug}`).join('\n')
  const fallback = short + '\n' + tail
  return fallback.slice(0, 280)
}
