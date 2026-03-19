import { describe, expect, it } from 'vitest'
import { buildDatabase } from './index'

describe('buildDatabase', () => {
  // TODO - Temporary
  it('returns the expected message', () => {
    expect(buildDatabase()).toBe('TODO - Cool Stuff here')
  })
})
