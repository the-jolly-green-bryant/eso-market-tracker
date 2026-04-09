import { describe, it, expect, vi } from 'vitest'
import { __dedupe, __normalize, item, Env } from './index'

describe('api', async () => {
  const env = {
    ESO_MARKET_TRACKER: {
      get: vi.fn(async (key: string) => {
        if (key === '1393740546') {
          return {
            item: {
              internalId: 1393740546,
              name: 'Dreugh Wax',
            },
            pricing: {
              average: 123,
            },
          }
        }
        return null
      }),
    },
  }

  it('fetches data', async () => {
    const r = await item('1393740546', env as unknown as Env)
    const body = (r && (await r.json())) as {
      results: { pricing: { average: number } }[]
    }
    expect(body?.results?.at(0)?.pricing.average).toEqual(123)
  })

  it('dedupes and normalizes', async () => {
    expect(
      __dedupe([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 3 }], (i) =>
        i.a.toString()
      ).map((i) => i.a)
    ).toEqual([1, 2, 3])

    expect(__normalize('cool-thing')).toEqual('cool thing')
  }, 10_000)
})
