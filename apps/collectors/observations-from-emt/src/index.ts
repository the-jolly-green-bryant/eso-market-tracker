import 'dotenv/config'
import { Results } from './results'
import { constants, db, naming } from '@eso-market-tracker/database'
import { logger } from '@eso-market-tracker/logging'

export const processPageOfData = async (
  offset: number,
  options?: { limit?: number; skipRecursion?: boolean }
) => {
  const r = await Results.from(offset, { limit: options?.limit || 5 })
  await Promise.all(
    r.observations.map((i) => {
      db.throttleFileWrites(async () => {
        const targetPath = naming.getObservationPath(
          i.item,
          i.stats.date,
          constants.XBOX_NA
        )
        logger.info(
          `Logging ${i.item.id} for ${i.stats.date} with offset ${offset}`
        )
        await db.writeToFile(i.stats, targetPath)
      })
    })
  )

  !options?.skipRecursion &&
    r.next &&
    (await processPageOfData(r.next[0], { limit: r.next[1] }))
}
