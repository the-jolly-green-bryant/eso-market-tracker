import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import {
  segments,
  constants,
} from '@eso-market-tracker/database'

const servers = new Set([
  constants.XBOX_NA,
  constants.XBOX_EU,
  constants.PS_NA,
  constants.PS_EU,
])
const maximumFilesArgument = process.argv.find((argument) =>
  argument.startsWith('--max-files=')
)
const maximumFiles = maximumFilesArgument
  ? Number(maximumFilesArgument.split('=')[1])
  : Number.POSITIVE_INFINITY
const filePattern =
  /^(?<itemId>\d+)-(?<traitId>\d{2}|--)(?<qualityId>\d{2}|--)\.(?<server>[^.]+)\.historical\.json$/

const files = (
  await fg('data/items/**/*.historical.json', { onlyFiles: true })
).slice(0, maximumFiles)
const batchSize = 500

for (let offset = 0; offset < files.length; offset += batchSize) {
  const batch = files.slice(offset, offset + batchSize)
  const records = (
    await Promise.all(
      batch.map(async (filePath) => {
        const match = filePattern.exec(path.basename(filePath))
        if (!match?.groups || !servers.has(match.groups.server)) {
          throw new Error(`Unexpected historical filename: ${filePath}`)
        }
        const raw = JSON.parse(await fs.readFile(filePath, 'utf8'))
        const stats = Array.isArray(raw) ? raw : Object.values(raw)
        return stats.map((entry) => ({
          itemId: Number(match.groups!.itemId),
          traitId:
            match.groups!.traitId === '--'
              ? null
              : Number(match.groups!.traitId),
          qualityId:
            match.groups!.qualityId === '--'
              ? null
              : Number(match.groups!.qualityId),
          server: match.groups!.server,
          stats: entry as segments.ObservationStats,
        }))
      })
    )
  ).flat()
  await segments.writeObservationSegments(records)
  console.log(`Migrated ${Math.min(offset + batch.length, files.length)}/${files.length} files`)
}
