import {
  getBaseItemAndTraitFromItem,
  getTraitIdFromString,
  sanitizeTraitId,
} from './traits'
import { describe, expect, it } from 'vitest'

describe('sanitizeTraitId', () => {
  it('sanitizes companion traits', () => {
    expect(sanitizeTraitId(58)).toBe(40)
  })
})

describe('getBaseItemAndTraitFromItem', () => {
  it('gets trait names', () => {
    expect(getBaseItemAndTraitFromItem('amulet intricate')).toEqual([
      'amulet',
      getTraitIdFromString('intricate'),
    ])
  })
})
