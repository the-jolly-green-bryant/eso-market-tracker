import { describe, it, expect } from 'vitest'
import { getShardedRecord } from './builder'

describe('builder', async () => {
  it('generates nested functions', async () => {
    const results = await getShardedRecord()
    expect(results[6450][47][1393740546]['xbox-eu']).toBeDefined()
  })
})
