import { logger, orThrow } from './index'
import { describe, expect, it } from 'vitest'

describe('logging', () => {
  it('should work', async () => {
    logger.warn('Warning: logging')
  })
})

describe('orThrow', () => {
  it('should throw errors', () => {
    const test = () => orThrow(new Error('test'))
    expect(test).toThrow('test')
  })
})
