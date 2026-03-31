#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import * as git from './git'
import { logger } from '@eso-market-tracker/logging'
import { constants, db, naming } from '@eso-market-tracker/database'

for (const [repoPath, platform] of [
  [process.env.TSC_XBOX_ADDON_PATH, constants.XBOX_NA],
  [process.env.TSC_XBOXEU_ADDON_PATH, constants.XBOX_EU],
  [process.env.TSC_PSNA_ADDON_PATH, constants.PS_NA],
  [process.env.TSC_PSEU_ADDON_PATH, constants.PS_EU],
]) {
  const commits = git
    .getHistoricalContentForRepo(repoPath!)
    .filter((i) => i.files.length)
  const observations = await git.getObservationsFromCommit(commits.at(-1)!)
  await Promise.all(
    observations.map((i) => {
      db.throttleFileWrites(async () => {
        const targetPath = naming.getObservationPath(
          i.item,
          i.stats.date,
          platform!
        )
        logger.info(`Logging ${i.item.id} for ${i.stats.date}`)
        await db.writeToFile(i.stats, targetPath)
      })
    })
  )
}
