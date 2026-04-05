import { describe, expect, it, vi } from 'vitest'
import { collectObservations } from './index'
import fs from 'fs'
import path from 'path'
import * as index from './index'

describe('observations-from-tsc2', async () => {
  const code = fs
    .readFileSync(path.join(__dirname, '../docs/TSCPriceDataXBNA.min.lua'))
    .toString()
  vi.spyOn(index, 'getAddonData').mockResolvedValue([code])

  it('has no errors', async () => {
    await expect(collectObservations({ maxWrites: 100 })).resolves.not.toThrow()
  })
})
