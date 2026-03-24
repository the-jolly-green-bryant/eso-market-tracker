import { describe, expect, it } from 'vitest'
import { getItemPath, getObservationPath } from './naming'
import { constants } from '@eso-market-tracker/eso'

describe('item to directory', () => {
  it('returns a valid, sharded path', () => {
    expect(getItemPath(constants.SAMPLE_BASE_ITEM)).toBe(
      'data/items/89/16/22/2928226198.json'
    )
  })

  it('handles observation quality and trait', () => {
    expect(
      getObservationPath(constants.SAMPLE_VARIANT_ITEM, '2026-01-01')
    ).toEqual(
      `data/observations/89/16/22/2928226198/2928226198-42---/2026/01/01.json`
    )
  })
})
