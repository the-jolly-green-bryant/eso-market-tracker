import { describe, it, expect } from 'vitest'
import { __dedupe, __normalize } from './index'

describe('api', async () => {
  it('dedupes and normalizes', async () => {
    expect(
      __dedupe([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 3 }], (i) =>
        i.a.toString()
      ).map((i) => i.a)
    ).toEqual([1, 2, 3])

    expect(__normalize('cool-thing')).toEqual('cool thing')
  }, 10_000)
})
