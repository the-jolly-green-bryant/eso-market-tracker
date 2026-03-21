import { describe, it, expect } from 'vitest'
import * as cheerio from 'cheerio'
import { _getNthStringFromRow, _getIconFromRow } from './results'

describe('imports', async () => {
  const $ = cheerio.load('<tr><td>test</td><td></td></tr>')
  const el = $('tr').toArray().at(0)!

  it('should fail if no image', async () => {
    await expect(async () => await _getIconFromRow($, el)).rejects.toThrow()
  })

  it('should fail if no text', async () => {
    await expect(
      async () => await _getNthStringFromRow($, el, 2)
    ).rejects.toThrow()
  })
})
