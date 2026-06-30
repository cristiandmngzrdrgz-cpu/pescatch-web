import type { StoreAdapter } from './types'

export const totalFishingTackleAdapter: StoreAdapter = {
  name: 'Total Fishing Tackle',
  id: 'total-fishing-tackle',

  async lookup(_ean: string) {
    return null
  },
}
