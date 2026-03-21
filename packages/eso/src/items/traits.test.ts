import { sanitizeTraitId } from './traits'
import { describe, it, expect } from 'vitest'

describe('sanitizeTraitId', () => {
  it('sanitizes companion traits', () => {
    expect(sanitizeTraitId(58)).toBe(40)
  })
})
