export class RateLimiter {
  private lastRequestTime = 0

  constructor(private minDelayMs: number = 3000) {}

  async wait(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    if (elapsed < this.minDelayMs) {
      const waitTime = this.minDelayMs - elapsed
      await new Promise(r => setTimeout(r, waitTime))
    }
    this.lastRequestTime = Date.now()
  }

  setDelay(ms: number): void {
    this.minDelayMs = ms
  }
}
