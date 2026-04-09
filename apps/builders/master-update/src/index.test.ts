import { describe, expect, it, beforeAll, vi } from 'vitest'
import * as index from './index'
import { TRAIT_INDEX } from '@eso-market-tracker/data'
import fs from 'fs'
import path from 'path'
import * as crawler from '@eso-market-tracker/observations-from-tsc2'

describe('update performance', () => {
  const code = fs
    .readFileSync(
      path.join(
        __dirname,
        '../../../collectors/observations-from-tsc2/docs/TSCPriceDataXBNA.min.lua'
      )
    )
    .toString()
  vi.spyOn(crawler, 'getAddonData').mockResolvedValue([code])

  beforeAll(async () => {
    await TRAIT_INDEX()
  })

  it('prepareDatabase completes within 5 seconds', async () => {
    const start = performance.now()
    index.prepareDatabase().catch(console.error)
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('building database completes within 5 seconds', async () => {
    const start = performance.now()
    index._buildStep().catch(console.error)
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('item retrieval completes within 5 seconds', async () => {
    const start = performance.now()
    index.importItems().catch(console.error)
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('observation retrieval completes within 60 seconds', async () => {
    const start = performance.now()
    index.importObservations().catch(console.error)
    expect(performance.now() - start).toBeLessThan(60_000)
  }, 60_000)

  it('api update completes within 5 seconds', async () => {
    const start = performance.now()
    index.buildApi().catch(console.error)
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)

  it('addon update completes within 5 seconds', async () => {
    const start = performance.now()
    index.buildAddon().catch(console.error)
    expect(performance.now() - start).toBeLessThan(5000)
  }, 10_000)
})
