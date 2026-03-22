import { describe, expect, it } from 'vitest'
import fs from 'fs'
import { Results } from './results'
import { getHtmlFromEndpoint, processNextPage } from './index'

const sampleHtml = fs.readFileSync(
  __dirname + '/../docs/sample-mined-item-summary.html',
  'utf8'
)

describe('results', () => {
  const results = Results.from(sampleHtml)

  it('has parsed items', () => {
    expect(results.items).toHaveLength(1000)
  })

  it('has a next url', () => {
    expect(results.next).equals(
      'https://esolog.uesp.net/viewlog.php?start=21000&record=minedItemSummary'
    )
  })
})

describe('crawler', async () => {
  const results = await processNextPage(undefined, true)

  it('has results', () => {
    expect(results.items).toHaveLength(1000)
  })

  it('has a next value', () => {
    expect(results.next).equals(
      'https://esolog.uesp.net/viewlog.php?start=1000&record=minedItemSummary'
    )
  })
})

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

  it('fails if no next page', async () => {
    const results = Results.from(sampleHtml.replaceAll('Next', 'blah'))
    await expect(
      async () => await processNextPage(results, true)
    ).rejects.toThrow(/page|found/)
  })
})
