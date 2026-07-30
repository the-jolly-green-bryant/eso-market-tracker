import { describe, expect, it } from 'vitest'

import { fillDailyHistory } from './daily-history'

describe('fillDailyHistory', () => {
  it('carries the preceding observation through missing calendar days', () => {
    const result = fillDailyHistory([
      { date: '2026-01-31', price: 10, low: 8 },
      { date: '2026-02-03', price: 25, low: 20 },
    ])

    expect(result).toEqual([
      { date: '2026-01-31', price: 10, low: 8 },
      { date: '2026-02-01', price: 10, low: 8 },
      { date: '2026-02-02', price: 10, low: 8 },
      { date: '2026-02-03', price: 25, low: 20 },
    ])
  })

  it('sorts observations and lets the final same-day value win', () => {
    const result = fillDailyHistory([
      { date: '2026-02-03', price: 30 },
      { date: '2026-02-01', price: 10 },
      { date: '2026-02-03', price: 35 },
    ])

    expect(result.map(({ date, price }) => [date, price])).toEqual([
      ['2026-02-01', 10],
      ['2026-02-02', 10],
      ['2026-02-03', 35],
    ])
  })

  it('does not mutate source observations', () => {
    const observation = { date: '2026-02-01T12:00:00Z', price: 10 }

    fillDailyHistory([observation])

    expect(observation.date).toBe('2026-02-01T12:00:00Z')
  })
})
