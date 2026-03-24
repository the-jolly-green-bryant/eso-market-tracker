import { describe, expect, it } from 'vitest'
import { Results } from './results'

describe('observations-from-emt', async () => {
  const results = await Results.from(15, { limit: 5 })
  it('has quality data', () => {
    expect(
      results.observations.filter((i) => i.item.quality).length
    ).toBeGreaterThan(0)
  })

  it('has trait data', () => {
    expect(
      results.observations.filter(
        (i) => i.item.meta.trait && i.item.meta.canonicalId == 4610
      ).length
    ).toBeGreaterThan(0)
  })
})
