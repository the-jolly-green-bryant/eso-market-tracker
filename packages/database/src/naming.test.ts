import { describe, expect, it } from 'vitest'
import { getItemPath } from './naming'
import { constants } from '@eso-market-tracker/eso'

describe('item to directory', () => {
  it('returns a valid, sharded path', () => {
    expect(getItemPath(constants.SAMPLE_BASE_ITEM)).toBe(
      'data/items/01/00/00/10.json'
    )
  })
})
