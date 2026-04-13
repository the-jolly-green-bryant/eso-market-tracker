import { describe, it, expect } from 'vitest'
import { updateKeyValues } from './index'

describe('builder', async () => {
  it('uploads sharded key values', async () => {
    await expect(updateKeyValues({ maxKeys: 1 })).resolves.not.toThrow()
  }, 40_000)
})
