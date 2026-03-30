import { logger, orThrow } from './index'
import { describe, expect, it, vi } from 'vitest'

describe('logging', () => {
  it('should work', async () => {
    const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    logger.warn('Warning: logging')
    expect(spy).toHaveBeenCalledTimes(1)

    const [msg] = spy.mock.calls[0]
    expect(msg).toMatch(/Warning: logging/)
  })
})

describe('orThrow', () => {
  it('should throw errors', () => {
    const test = () => orThrow(new Error('test'))
    expect(test).toThrow('test')
  })
})
