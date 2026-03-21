import { describe, expect, it } from 'vitest'
import { getItemDirectory } from './naming'
import { constants } from '@eso-market-tracker/eso'

describe('item to directory', () => {
  it('returns a valid, sharded path', () => {
    expect(getItemDirectory(constants.SAMPLE_BASE_ITEM)).toBe(
      'data/items/01/00/00/10'
    )
  })
})
