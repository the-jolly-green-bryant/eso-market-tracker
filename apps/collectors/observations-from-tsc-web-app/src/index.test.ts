import { describe, expect, it, vi } from 'vitest'
import * as sampleResults from '../docs/sample.json'
import * as index from './index'
import { collectObservations } from './index'

describe('observations-from-tsc-web-app', async () => {
  vi.spyOn(index, 'getAppData').mockResolvedValue(sampleResults)
  it('has no errors', async () => {
    await expect(collectObservations()).resolves.not.toThrow()
  }, 30_000)
})
