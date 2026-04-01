import { execFileSync } from 'node:child_process'
import { orThrow } from '@eso-market-tracker/logging'
import { findItemByName, findItemByGameId } from '@eso-market-tracker/data'
import { Item, ItemMeta, ItemObservation } from '@eso-market-tracker/eso'

const _getPairsFromRawContent = (commit: Commit) => {
  const itemDataFile =
    commit.files.filter((i) => i.path.includes('PriceData')).at(0)! ||
    orThrow(new Error(`No pricing data found for commit ${commit.hash}`))

  return [
    ...itemDataFile.content
      .replace(/.*a.priceData=(.*)/, '$1')
      .matchAll(/\[(.*?)]="(.*?)",/g),
  ].filter(Boolean)
}

const _getProcessedPairs = async ([match, key, values]: [
  string,
  string,
  string,
]): Promise<ItemObservation[]> => {
  try {
    const meta =
      findItemByName(key) ||
      (await findItemByGameId(Number.parseInt(key))) ||
      orThrow(new Error(`Could not find item ${key}`))

    const item = Item.from(meta as unknown as ItemMeta)
    console.log('key', key, values)
    const [average, minimum, maximum] = values
      .split(',')
      .map((i) => Number.parseInt(i))
    return [
      {
        item,
        stats: {
          date: '2026-02-24', // The final date addons were updated.
          average,
          minimum,
          maximum,
          commonQuantity: 1,
        },
      },
    ]
  } catch (err) {
    if (err instanceof Error && err.message.includes('Could not find item')) {
      console.log(`Match ${match} does not represent a known item.`)
      return []
    }

    throw err
  }
}

export const getObservationsFromCommit = async (commit: Commit) => {
  const results = []

  for (const pair of _getPairsFromRawContent(commit)) {
    const processed = await _getProcessedPairs(
      pair as unknown as [string, string, string]
    )
    results.push(...processed)
  }

  return results
}

type Commit = {
  hash: string
  files: { path: string; content: string }[]
}

/**
 * Returns full history of text files for a local repo.
 *
 * @param {string} repoPath
 * @returns {Commit[]}
 */
export const getHistoricalContentForRepo = (repoPath: string): Commit[] => {
  throw new Error(`repoPath: ${repoPath}}`)
  repoPath || orThrow(new Error('Repo path was not provided!'))
  const commits = execFileSync('git', ['rev-list', '--all'], {
    cwd: repoPath,
    encoding: 'utf8',
    maxBuffer: 1000 * 1024 * 1024,
  })
    .toString()
    .trim()
    .split('\n')

  return commits.map((hash) => {
    const results = execFileSync(
      'git',
      ['ls-tree', '-r', '--name-only', hash],
      {
        cwd: repoPath,
        encoding: 'utf8',
        maxBuffer: 1000 * 1024 * 1024,
      }
    ).toString()

    const files = results
      .trim()
      .split('\n')
      .filter(Boolean)
      .flatMap((filePath) => {
        try {
          const content = execFileSync(
            'git',
            ['show', `${hash}:${repoPath.split('/').slice(-1)}/${filePath}`],
            {
              cwd: repoPath,
              encoding: 'utf8',
              maxBuffer: 10 * 1024 * 1024,
            }
          ).toString()

          return [{ path: filePath, content }]
        } catch {
          // Skip binaries, submodules, weird edge cases
          return []
        }
      })

    return { hash, files }
  })
}
