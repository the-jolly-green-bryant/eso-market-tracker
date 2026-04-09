import { describe, expect, it, vi } from 'vitest'
import { processPageOfData } from './index'
import * as results from './results'
import { logger } from '@eso-market-tracker/logging'
import * as sampleJson from '../docs/sample.json'
import * as sampleHistory from '../docs/sample_history.json'
import { EMTItem } from './results'

describe('ObservationsFromEmt', () => {
  it('does not throw errors', { timeout: 30_000 }, async () => {
    const spy = vi.spyOn(logger, 'info').mockImplementation(() => {})
    vi.spyOn(results, 'makeQuery').mockResolvedValue(
      sampleJson as unknown as { data: { data: EMTItem } }
    )
    vi.spyOn(results, 'getHistoricalItemData').mockResolvedValue([
      sampleHistory,
    ])
    await processPageOfData(0, { skipRecursion: true })
    expect(spy).toHaveBeenCalledTimes(3)

    const [msg] = spy.mock.calls[0]
    expect(msg).toMatch(/with offset/)
  })
})
