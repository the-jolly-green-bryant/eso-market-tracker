import 'dotenv/config'
import { Results } from './results'
import { db, naming } from '@eso-market-tracker/database'
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

export const getAddonData = async () => {
  const random = randomUUID()
  const output = `/tmp/${random}.zip`

  await execFileAsync(
    path.join(__dirname, '../../../..', 'ESOAddOnUploaderCli.dmg'),
    ['download', ADDON_ID, `--output=${output}`],
    {
      maxBuffer: 1024 * 1024 * 50, // 50MB in case tool is chatty
      env: process.env,
    }
  )

  const unzipTo = `/tmp/${random}`
  await execFileAsync('unzip', ['-o', output, '-d', unzipTo])
  fs.unlinkSync(output)

  return [
    'Playstation/TSCPriceDataPSEU.min.lua',
    'Playstation/TSCPriceDataPSNA.min.lua',
    'XB1/TSCPriceDataXBEU.min.lua',
    'XB1/TSCPriceDataXBNA.min.lua',
  ].map((f) => {
    const filePath = `${unzipTo}/TSCPriceFetcher2/${f}`
    return fs.readFileSync(filePath, { encoding: 'utf8' })
  })
}

export const collectObservations = async (options?: { maxWrites?: number }) => {
  const rawData = await self.getAddonData()
  const r = await Results.from(rawData, options)
  await Promise.all(
    r.observationsByPlatform.map(([platform, observations]) =>
      observations
        .slice(0, options?.maxWrites ?? observations.length)
        .map((i) => {
          db.throttleFileWrites(async () => {
            logger.info(`Logging ${i.item.meta.name} for ${i.stats.date}`)
            const targetPath = naming.getObservationPath(
              i.item,
              i.stats.date,
              platform
            )
            logger.info(`Logging ${i.item.id} for ${i.stats.date}`)
            await db.writeToFile(i.stats, targetPath)
          })
        })
    )
  )
}
