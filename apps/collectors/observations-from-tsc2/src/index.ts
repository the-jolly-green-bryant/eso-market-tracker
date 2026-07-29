import 'dotenv/config'
import { Results } from './results'
import { db, naming, segments } from '@eso-market-tracker/database'
import { logger } from '@eso-market-tracker/logging'
import * as self from './index'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'crypto'

const ADDON_ID = '2a88cc14-8e8c-4b73-9605-2e1d7c764e23'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execFileAsync = promisify(execFile)

export const downloadAddon = async (output: string) =>
  execFileAsync(
    process.env.ESO_UPLOADER_CLI ||
      path.join(__dirname, '../../../..', 'ESOAddOnUploaderCli.dmg'),
    ['download', ADDON_ID, `--output=${output}`],
    {
      maxBuffer: 1024 * 1024 * 50, // 50MB in case tool is chatty
      env: process.env,
    }
  )

export const getAddonData = async () => {
  const random = randomUUID()
  const output = `/tmp/${random}.zip`
  await self.downloadAddon(output)
  const unzipTo = `/tmp/${random}`
  await execFileAsync('unzip', ['-o', output, '-d', unzipTo])
  fs.unlinkSync(output)

  return [
    'Playstation/TSCPriceDataPSEU.min.lua',
    'Playstation/TSCPriceDataPSNA.min.lua',
    'XB1/TSCPriceDataXBEU.min.lua',
    'XB1/TSCPriceDataXBNA.min.lua',
  ].flatMap((f) => {
    try {
      const filePath = `${unzipTo}/TSCPriceFetcher2/${f}`
      logger.info(`Reading: ${filePath}, output=${output}`)
      return [fs.readFileSync(filePath, { encoding: 'utf8' })]
    } catch {
      return []
    }
  })
}

export const collectObservations = async (options?: { maxWrites?: number }) => {
  const rawData = await self.getAddonData()
  const r = await Results.from(rawData, options)
  const collected = r.observationsByPlatform.flatMap(
    ([platform, observations]) =>
      observations.slice(0, options?.maxWrites ?? observations.length).map(
        (observation) => ({
          platform,
          observation,
        })
      )
  )
  await Promise.all(
    collected.map(({ platform, observation }) =>
      db.throttleFileWrites(async () => {
        logger.info(
          `Logging ${observation.item.meta.name} for ${observation.stats.date}`
        )
        const targetPath = naming.getObservationPath(
          observation.item,
          observation.stats.date,
          platform
        )
        await db.writeToFile(observation.stats, targetPath)
      })
    )
  )
  await segments.writeObservationSegments(
    collected.map(({ platform, observation }) => ({
      itemId: observation.item.id,
      traitId:
        typeof observation.item.trait === 'number'
          ? observation.item.trait
          : null,
      qualityId: observation.item.quality,
      server: platform,
      stats: observation.stats,
    }))
  )

  return [...new Set(collected.map(({ observation }) => observation.item.id))]
}
