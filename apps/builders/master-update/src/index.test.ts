import { describe, expect, it } from 'vitest'
import * as index from './index'

describe('update performance', () => {
  it('prepareDatabase completes within 5 seconds', async () => {
    const start = performance.now()
    index.prepareDatabase()
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('building database completes within 5 seconds', async () => {
    const start = performance.now()
    index._buildStep()
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('item retrieval completes within 5 seconds', async () => {
    const start = performance.now()
    await index.importItems()
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('observation retrieval completes within 60 seconds', async () => {
    const start = performance.now()
    index.importObservations()
    expect(performance.now() - start).toBeLessThan(60_000)
  }, 60_000)
})
