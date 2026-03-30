import { describe, expect, it } from 'vitest'
import { Results } from './results'
import * as sampleResults from '../docs/sample.json'

describe('observations-from-tsc-web-app', async () => {
  const results = await Results.from(sampleResults)
  it('has results', () => {
    expect(results.observations.length).toBeGreaterThan(10)
  })
})
