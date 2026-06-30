import type { StoreAdapter } from './types'

export const pureFishingAdapter: StoreAdapter = {
  name: 'Pure Fishing',
  id: 'pure-fishing',

  async lookup(_ean: string) {
    return null
  },
}
