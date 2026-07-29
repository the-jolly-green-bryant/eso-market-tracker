import 'dotenv/config'
import { Results, TSCAppData } from './results'
import { constants, db, naming, segments } from '@eso-market-tracker/database'
import { logger, orThrow } from '@eso-market-tracker/logging'
import * as self from './index'

export const getAppData = async (): Promise<TSCAppData> => {
  const res = await fetch(
    'https://www.appsheet.com/api/template/a78de1a8-a01a-40fb-8e21-5cd32c2b6dff/',
    {
      method: 'POST',
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'if-modified-since': '2025-11-21T01:01:22.7862166Z',
        origin: 'https://www.appsheet.com',
        pragma: 'no-cache',
        priority: 'u=1, i',
        referer:
          'https://www.appsheet.com/start/a78de1a8-a01a-40fb-8e21-5cd32c2b6dff',
        'sec-ch-ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        settings: null,
        getAllTables: true,
        syncsOnConsent: true,
        syncUI: 'Blocking',
        initiatedBy: 'AppStart',
        isPreview: false,
        apiLevel: 2,
        supportsJsonDataSets: true,
        tzOffset: 420,
        locale: 'en-US',
        perTableParams: {},
        lastSyncTime: '2026-03-30T03:59:49.6989272Z',
        appStartTime: '2026-03-30T03:59:49.811Z',
        dataStamp: '2025-03-30T03:59:49.6989272Z',
        clientId: 'e82c5da1-92e6-4120-a095-f3a8ed54a464',
        build: 'aaaaaaaaaaaaaaaaaaaa-1774378276512-b29054b3',
        hasValidPlan: true,
        userConsentedScopes: 'data_input,device_identity,device_io,usage',
        localVersion: '1.000026',
      }),
    }
  )

  return (
    (res.ok && (await res.json())) ||
    orThrow(new Error(`Request failed: ${res.status} ${res.statusText}`))
  )
}

export const collectObservations = async () => {
  const rawData = await self.getAppData()
  logger.info('Collected Web app data')
  const results = await Results.from(rawData)
  await Promise.all(
    results.observations.map((i) =>
      db.throttleFileWrites(async () => {
        logger.info(`Logging ${i.item.meta.name} for ${i.stats.date}`)
        const targetPath = naming.getObservationPath(
          i.item,
          i.stats.date,
          constants.XBOX_NA
        )
        logger.info(`Logging ${i.item.id} for ${i.stats.date}`)
        await db.writeToFile(i.stats, targetPath)
      })
    )
  )
  await segments.writeObservationSegments(
    results.observations.map((observation) => ({
      itemId: observation.item.id,
      traitId:
        typeof observation.item.trait === 'number'
          ? observation.item.trait
          : null,
      qualityId: observation.item.quality,
      server: constants.XBOX_NA,
      stats: observation.stats,
    }))
  )

  return [...new Set(results.observations.map(({ item }) => item.id))]
}
