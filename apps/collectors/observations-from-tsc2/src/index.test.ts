import { describe, expect, it } from 'vitest'
import { collectObservations } from './index'

describe('observations-from-tsc-web-app', async () => {
  it('has no errors', async () => {
    await expect(collectObservations()).resolves.not.toThrow()
  })
})
