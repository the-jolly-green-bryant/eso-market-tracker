import { describe, it } from 'vitest'
import { processPageOfData } from './index'

describe('ObservationsFromEmt', () => {
  it('does not throw errors', async () => {
    await processPageOfData(0, { skipRecursion: true })
  })
})
