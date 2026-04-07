import { describe, expect, it, vi, beforeAll } from 'vitest'
import { collectObservations } from './index'
import fs from 'fs'
import path from 'path'
import * as index from './index'
import { TRAIT_INDEX } from '@eso-market-tracker/data'

describe('observations-from-tsc2', async () => {
  const code = fs
    .readFileSync(path.join(__dirname, '../docs/TSCPriceDataXBNA.min.lua'))
    .toString()
  vi.spyOn(index, 'getAddonData').mockResolvedValue([code])

  beforeAll(async () => {
    // Preload our trait index  because it takes forever to read.
    await TRAIT_INDEX()
  }, 60_000)

  it('has no errors', async () => {
    await expect(collectObservations({ maxWrites: 10 })).resolves.not.toThrow()
  })
})
