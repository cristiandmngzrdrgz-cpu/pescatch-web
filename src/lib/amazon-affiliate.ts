const TAG = process.env.AMAZON_PA_TAG || 'pescatch-21'

export function buildAmazonUrl(urlOrAsin: string): string {
  if (!urlOrAsin) return urlOrAsin

  let url: string
  if (urlOrAsin.startsWith('http://') || urlOrAsin.startsWith('https://')) {
    url = urlOrAsin
  } else {
    url = `https://www.amazon.es/dp/${urlOrAsin}`
  }

  if (url.includes('tag=')) return url

  const isProductUrl = /\/dp\/[A-Z0-9]{10}/i.test(url)
  if (isProductUrl && !/[\?&]th=1(&|$)/i.test(url)) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}th=1&psc=1`
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}tag=${TAG}`
}
