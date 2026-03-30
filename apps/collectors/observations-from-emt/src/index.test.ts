import { describe, expect, it, vi } from 'vitest'
import { processPageOfData } from './index'
import { logger } from '@eso-market-tracker/logging'

describe('ObservationsFromEmt', () => {
  it('does not throw errors', { timeout: 30_000 }, async () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => {})
    await processPageOfData(0, { skipRecursion: true })
    expect(spy).toHaveBeenCalledTimes(128)

    const [msg] = spy.mock.calls[0]
    expect(msg).toMatch(/with offset/)
  })
})
