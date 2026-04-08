import { getShardedRecord } from '@eso-market-tracker/eso-addon'
import { execFileSync } from 'node:child_process'
import { logger } from '@eso-market-tracker/logging'
import * as fs from 'node:fs'
import path from 'node:path'
import * as os from 'node:os'

const __chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

export const updateKeyValues = async () => {
  const record = (await getShardedRecord()) as Record<
    string,
    Record<string, unknown>
  >
  const flattened = Object.values(record)
    .flatMap(Object.values)
    .flatMap(Object.entries)

  const raw = flattened.map(([key, data]) => ({
    key,
    value: JSON.stringify(data),
  }))

  const batches = __chunk(raw, 10_000)

  for (const [index, batch] of batches.entries()) {
    const filePath = path.join(os.tmpdir(), `kv-${index}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(batch))

    const args = [
      'wrangler',
      'kv',
      'bulk',
      'put',
      filePath,
      '--namespace-id=c1b66d8fb78d4881ab064e462bd5d5f6',
      '--remote',
    ]

    logger.info(args.join(' '))
    execFileSync('npx', args, { stdio: 'inherit' })
  }
}
