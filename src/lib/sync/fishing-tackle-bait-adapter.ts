import type { StoreAdapter } from './types'

export const fishingTackleBaitAdapter: StoreAdapter = {
  name: 'Fishing Tackle & Bait',
  id: 'fishing-tackle-bait',

  async lookup(_ean: string) {
    return null
  },
}
