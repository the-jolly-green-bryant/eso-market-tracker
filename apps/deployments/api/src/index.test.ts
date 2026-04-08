import { describe, it, expect } from 'vitest'
import { updateKeyValues } from './index'

describe('builder', async () => {
  it('uploads sharded key values', async () => {
    expect(await updateKeyValues()).not.toThrow()
  })
})
