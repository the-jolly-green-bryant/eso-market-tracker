import { describe, expect, it, beforeAll } from 'vitest'
import { Results } from './results'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { TRAIT_INDEX } from '@eso-market-tracker/data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe.skipIf(process.env.CI)('observations-from-tsc2', async () => {
  let results: Awaited<ReturnType<typeof Results.from>>

  beforeAll(async () => {
    await TRAIT_INDEX()
    const code = fs
      .readFileSync(path.join(__dirname, '../docs/TSCPriceDataXBNA.min.lua'))
      .toString()

    results = await Results.from([code], { maxWrites: 10 })
  }, 60_000)

  it('has results', () => {
    expect(results.observationsByPlatform).toHaveLength(1)
    expect(results.observationsByPlatform.at(0)?.at(1)?.length).toBeGreaterThan(
      10
    )
  })
})
