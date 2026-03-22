import { logger } from './index'
import { describe, it } from 'vitest'

describe('logging', () => {
  it('should work', async () => {
    logger.warn('Warning: logging')
  })
})
