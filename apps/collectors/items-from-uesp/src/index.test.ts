import { describe, expect, it } from 'vitest'
import fs from 'fs'
import { MinedResults } from './results'
import { getHtmlFromEndpoint, processNextPageOfLootedResults, processNextPageOfMinedResults, } from './index'

const sampleHtml = fs.readFileSync(
  __dirname + '/../docs/sample-mined-item-summary.html',
  'utf8'
)

describe('results', () => {
  const results = MinedResults.from(sampleHtml)

  it('has parsed items', () => {
    expect(results.items).toHaveLength(177) // Only unbound items
  })

  it('has a next url', () => {
    expect(results.next).equals(
      'https://esolog.uesp.net/viewlog.php?start=21000&record=minedItemSummary'
    )
  })
})

describe.skipIf(process.env.SKIP_SLOW_TESTS || process.env.CI)(
  'crawler',
  async () => {
    const results = await processNextPageOfMinedResults(undefined, true)
    await processNextPageOfLootedResults(undefined, true)

    it('has results', () => {
      expect(results.items).toHaveLength(843) // Only unbound items.
    })

    it('has a next value', () => {
      expect(results.next).equals(
        'https://esolog.uesp.net/viewlog.php?start=1000&record=minedItemSummary'
      )
    })
  }
)

describe('fetching', async () => {
  it('fails with bad cookie', async () => {
    await expect(
      async () =>
        await getHtmlFromEndpoint(
          'https://esolog.uesp.net/viewlog.php?start=1000&record=minedItemSummary',
          { cookie: 'badcookie' }
        )
    ).rejects.toThrow(/403|Failed/)
  })

  it.skipIf(process.env.SKIP_SLOW_TESTS)('fails if no next page', async () => {
    const results = MinedResults.from(sampleHtml.replaceAll('Next', 'blah'))
    await expect(
      async () => await processNextPageOfMinedResults(results, true)
    ).rejects.toThrow(/page|found/)
  })
})
