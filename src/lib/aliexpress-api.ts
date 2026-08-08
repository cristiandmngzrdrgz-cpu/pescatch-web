import crypto from 'crypto'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || ''
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || ''
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID || ''
const TARGET_CURRENCY = process.env.ALIEXPRESS_TARGET_CURRENCY || 'EUR'
const TARGET_LANGUAGE = process.env.ALIEXPRESS_TARGET_LANGUAGE || 'ES'
const API_ENDPOINT =
  process.env.ALIEXPRESS_API_ENDPOINT || 'https://api-sg.aliexpress.com/sync'

export interface AliExpressProductInfo {
  productId: string
  title: string
  price: number
  originalPrice: number | null
  currency: string
  imageUrl: string | null
  productUrl: string
  orders: number | null
  rating: number | null
  storeName: string | null
  discount: string
  availableQuantity: number | null
}

/**
 * Firma TOP (Taobao Open Platform / AliExpress Open Platform).
 * Ordena los parámetros alfabéticamente, concatena clave+valor (sin separadores),
 * envuelve con el app_secret por ambos lados y aplica MD5 en HEX MAYÚSCULAS.
 * NO debe incluirse `sign` en los parámetros que se firman.
 */
export function signRequest(
  params: Record<string, string>,
  secret: string,
): string {
  const sortedKeys = Object.keys(params).sort()
  const sortedString = sortedKeys.map((k) => `${k}${params[k]}`).join('')
  const toSign = `${secret}${sortedString}${secret}`
  return crypto.createHash('md5').update(toSign, 'utf8').digest('hex').toUpperCase()
}

function timestampShanghai(): string {
  const now = new Date()
  const shanghai = new Date(now.getTime() + 8 * 3600 * 1000)
  const d = shanghai.toISOString()
  return `${d.slice(0, 4)}-${d.slice(5, 7)}-${d.slice(8, 10)} ${d.slice(11, 13)}:${d.slice(14, 16)}:${d.slice(17, 19)}`
}

type JsonRecord = Record<string, unknown>

/** Extrae el array de productos del resultado (envuelto en `resp_result.result.products.product`). */
function extractProducts(
  resp: { result?: unknown; resp_result?: { result?: unknown } } | undefined,
): Record<string, unknown>[] {
  const result = (resp?.resp_result?.result ?? resp?.result) as
    | { products?: unknown }
    | undefined
  const products = result?.products
  if (Array.isArray(products)) return products as Record<string, unknown>[]
  if (products && typeof products === 'object' && Array.isArray((products as JsonRecord).product)) {
    return (products as JsonRecord).product as Record<string, unknown>[]
  }
  return []
}

interface CallOptions {
  method: string
  serviceParams: Record<string, string | number | undefined>
}

/**
 * Ejecuta una llamada a la gateway TOP. Devuelve el JSON crudo de la respuesta.
 * La respuesta envuelve el resultado en `{method_snake_case}_response` o en `error_response`.
 */
export async function callAliExpressApi<T = JsonRecord>(
  options: CallOptions,
): Promise<T | null> {
  if (!APP_KEY || !APP_SECRET) return null

  const params: Record<string, string> = {
    method: options.method,
    app_key: APP_KEY,
    sign_method: 'md5',
    timestamp: timestampShanghai(),
    format: 'json',
    v: '2.0',
  }

  for (const [key, value] of Object.entries(options.serviceParams)) {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value)
    }
  }

  const sign = signRequest(params, APP_SECRET)
  const allParams = { ...params, sign }

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams(allParams),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(String(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : null
}

function mapProduct(input: Record<string, unknown>): AliExpressProductInfo {
  const price = toNumber(input.target_app_sale_price) ?? toNumber(input.sale_price) ?? 0
  const original = toNumber(input.original_price) ?? toNumber(input.target_app_sale_price)
  const rating = toNumber(input.evaluate_rate)
  const orders = toNumber(input.orders) ?? toNumber(input.pefer_rate)

  return {
    productId: String(input.product_id ?? ''),
    title: String(input.product_title ?? ''),
    price,
    originalPrice: original && original > price ? original : null,
    currency: String(input.target_app_sale_price_currency ?? input.sale_price_currency ?? TARGET_CURRENCY),
    imageUrl: String(input.product_main_image_url ?? '') || null,
    productUrl: String(input.promotion_link ?? `https://www.aliexpress.com/item/${input.product_id}.html`),
    orders,
    rating,
    storeName: String(input.store_name ?? '') || null,
    discount: String(input.discount ?? ''),
    availableQuantity: toNumber(input.available_quantity),
  }
}

const PRODUCT_DETAIL_FIELDS = [
  'product_detail',
  'product_id',
  'product_title',
  'product_main_image_url',
  'target_app_sale_price',
  'target_app_sale_price_currency',
  'target_app_discount_price',
  'original_price',
  'promotion_link',
  'sale_price',
  'sale_price_currency',
  'available_quantity',
  'evaluate_rate',
  'store_name',
  'orders',
].join(',')

/**
 * `aliexpress.affiliate.productdetail.get` — detalle por ID(s) de producto.
 */
export async function getProductDetails(
  productIds: string[],
): Promise<AliExpressProductInfo[]> {
  if (productIds.length === 0) return []
  const data = await callAliExpressApi({
    method: 'aliexpress.affiliate.productdetail.get',
    serviceParams: {
      product_ids: productIds.join(','),
      fields: PRODUCT_DETAIL_FIELDS,
      target_currency: TARGET_CURRENCY,
      target_language: TARGET_LANGUAGE,
    },
  })
  if (!data) return []
  if ((data as JsonRecord).error_response) return []

  const resp = (data as JsonRecord).aliexpress_affiliate_productdetail_get_response as
    | { result?: unknown; resp_result?: { result?: unknown } }
    | undefined
  return extractProducts(resp).map(mapProduct).filter((p) => p.price > 0)
}

export interface SearchOptions {
  pageNo?: number
  pageSize?: number
  sort?: string
  minPrice?: number
  maxPrice?: number
}

/**
 * `aliexpress.affiliate.product.query` — búsqueda por keyword/palabras.
 */
export async function searchProducts(
  keywords: string,
  options?: SearchOptions,
): Promise<AliExpressProductInfo[]> {
  const data = await callAliExpressApi({
    method: 'aliexpress.affiliate.product.query',
    serviceParams: {
      keywords,
      tracking_id: TRACKING_ID || undefined,
      page_no: options?.pageNo ?? 1,
      page_size: options?.pageSize ?? 40,
      sort: options?.sort,
      min_sale_price: options?.minPrice,
      max_sale_price: options?.maxPrice,
      target_currency: TARGET_CURRENCY,
      target_language: TARGET_LANGUAGE,
    },
  })
  if (!data) return []
  if ((data as JsonRecord).error_response) return []

  const resp = (data as JsonRecord).aliexpress_affiliate_product_query_response as
    | { result?: unknown; resp_result?: { result?: unknown } }
    | undefined
  return extractProducts(resp).map(mapProduct).filter((p) => p.price > 0)
}

/** Extrae el ID numérico de una URL de producto AliExpress (`/item/<id>.html`). */
export function parseProductIdFromUrl(url: string): string | null {
  const match = url.match(/\/item\/(\d+)(?:\.html)?/i)
  return match ? match[1] : null
}

const AGENT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
const ITEM_URL_RE = /\/(?:item|dp)\/(\d+)(?:\.html)?/i

/**
 * Resuelve el productId a partir de una URL de AliExpress.
 * - `/item/<id>.html`: se extrae directamente.
 * - `s.click.aliexpress.com/...`: sigue el redirect HTTP hasta la URL real del item
 *   y extrae el PID (misma técnica que scripts/discover/verify-ae-prices.ts).
 * Devuelve `null` si no se puede extraer.
 */
export async function resolveProductIdFromUrl(url: string): Promise<string | null> {
  const direct = parseProductIdFromUrl(url)
  if (direct) return direct

  if (!url.includes('s.click.aliexpress.com')) return null

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': AGENT_UA },
      signal: AbortSignal.timeout(15000),
    })
    const m = res.url.match(ITEM_URL_RE)
    return m ? m[1] : null
  } catch {
    return null
  }
}