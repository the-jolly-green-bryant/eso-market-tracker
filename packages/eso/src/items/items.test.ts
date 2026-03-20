import { describe, expect, it } from 'vitest'
import { Item } from './items'
import { ItemMeta } from './items.types'

export const sampleBaseItem: ItemMeta = {
  canonicalId: 122,
  variantOf: null,
  name: 'Sample Item',
  trait: null,
}

export const sampleTraitItem: ItemMeta = {
  canonicalId: 123,
  variantOf: 122,
  name: 'Sample Item',
  trait: 4,
}

describe('item', () => {
  it('returns the correct id for base and variants', () => {
    expect(Item.from(sampleTraitItem).id).toBe(Item.from(sampleBaseItem).id)
    expect(Item.from(sampleTraitItem).id).toBe(sampleBaseItem.canonicalId)
  })
})
