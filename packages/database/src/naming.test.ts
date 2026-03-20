import { describe, expect, it } from 'vitest'
import { getItemDirectory } from './naming'
import { Item } from '@eso-market-tracker/eso'

const sampleItem = Item.from({
  canonicalId: 1234,
  variantOf: 1233,
  name: 'Sample Item',
  trait: 4,
})

describe('item to directory', () => {
  it('returns a valid, sharded path', () => {
    expect(getItemDirectory(sampleItem)).toBe('data/items/43/21/00/1234')
  })
})
