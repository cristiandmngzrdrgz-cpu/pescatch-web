export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  captchaDelayMs?: number
  onRetry?: (attempt: number, delay: number, error: Error) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDelayMs: number
}

function isCaptchaError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('captcha') ||
    message.includes('verify') ||
    message.includes('robot') ||
    message.includes('blocked') ||
    message.includes('forbidden') ||
    message.includes('429') ||
    message.includes('too many requests')
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> {
  const maxRetries = options?.maxRetries ?? 3
  const initialDelayMs = options?.initialDelayMs ?? 1000
  const maxDelayMs = options?.maxDelayMs ?? 30000
  const captchaDelayMs = options?.captchaDelayMs ?? 60000
  const onRetry = options?.onRetry

  let lastError: Error | undefined
  let totalDelayMs = 0

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts: attempt,
        totalDelayMs,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt === maxRetries) {
        break
      }

      let delay: number
      if (isCaptchaError(lastError)) {
        delay = captchaDelayMs
      } else {
        delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
      }

      totalDelayMs += delay
      onRetry?.(attempt, delay, lastError)

      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxRetries,
    totalDelayMs,
  }
}
