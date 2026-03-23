import { describe, it } from 'vitest'
import { Results } from './results'

describe('observations-from-emt', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const results = await Results.from(0, { limit: 10 })
  it('converts internal to known names', () => {
    // throw new Error('not implemented')
  })
})
