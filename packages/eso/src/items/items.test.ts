import { describe, expect, it } from 'vitest'
import { SAMPLE_BASE_ITEM, SAMPLE_VARIANT_ITEM } from '../constants'

describe('item', () => {
  it('returns the correct id for base and variants', () => {
    expect(SAMPLE_VARIANT_ITEM.id).toBe(SAMPLE_BASE_ITEM.id)
    expect(SAMPLE_VARIANT_ITEM.id).toBe(SAMPLE_BASE_ITEM.meta.canonicalId)
  })
})
