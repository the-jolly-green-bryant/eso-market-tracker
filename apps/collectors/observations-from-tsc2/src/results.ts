import 'dotenv/config'
import { Item, ItemObservation } from '@eso-market-tracker/eso'
import { logger, orThrow } from '@eso-market-tracker/logging'
import { LuaFactory } from 'wasmoon'
import { fileURLToPath } from 'node:url'
import path from 'path'
import fs from 'fs'
import { findItemByGameId, TRAIT_INDEX } from '@eso-market-tracker/data'
import * as database from '@eso-market-tracker/database'
import pLimit from 'p-limit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ParserOptions = {
  maxWrites?: number
}

// language=Lua
const MOCKS = (platform: string) => `
print = function(...)
  local n = select('#', ...)
  local args = {}
  for i = 1, n do
    args[i] = tostring(select(i, ...))
  end
  console_log(table.concat(args, "\\\\t"))
end

_G.print = print

d = function(...)
  print(...)
end

_G.d = d

_G.GetWorldName = function()
  return ${JSON.stringify(platform)}
end

_G.CHAT_ROUTER = {
  AddSystemMessage = function(self, message)
    print("SYSTEM:", message)
  end
}

_G.isTesting = 1
print("Mocks Loaded!")
`

type MasterType = {
  referenceDate: number
  startLoading: () => void
}

export const parseRawData = async (luaFiles: string[]) =>
  Promise.all(
    luaFiles.map(async (code) => {
      // Load the LUA file.
      const factory = new LuaFactory()
      const lua = await factory.createEngine()
      lua.global.set('console_log', (...args: never[]) => {
        logger.info(`[lua] ${JSON.stringify(args)}`)
      })

      const platform =
        RegExp(/a=="(.*?)"/)
          .exec(code)!
          .at(1) || orThrow(new Error('Platform could not be parsed!'))
      const masterVariable =
        RegExp(/_G\.(.*?)=/)
          .exec(code)!
          .at(1) || orThrow(new Error('Plugin name could not be parsed!'))
      const targetTable =
        RegExp(/priceData=setmetatable.*return (.*?)\[.*?]end/)
          .exec(code)!
          .at(1) || orThrow(new Error('Target Table could not be parsed!'))

      code = code.replace(`local ${targetTable}=`, `_G.${targetTable}=`)
      await lua.doString(MOCKS(platform) + code)
      // await lua.global.call(masterVariable)

      // Query it.
      const master = (await lua.global.get(
        masterVariable
      )) as unknown as MasterType
      master.startLoading()
      const date = master.referenceDate
      const data = lua.global.get(targetTable)

      return {
        platform,
        data: data as Record<number, string>,
        date,
      }
    })
  )

const _toDateString = (ts: number): string => {
  const ms = ts < 1e12 ? ts * 1000 : ts // detect seconds vs ms
  const d = new Date(ms)

  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Bootstraps and loads the API from the TSC addon. This allows trivial parsing
 *  of data strings.
 * @returns {Promise<any>}
 */
const getAPI = async () => {
  const factory = new LuaFactory()
  const lua = await factory.createEngine()
  await lua.doString(
    fs.readFileSync(path.join(__dirname, 'api.lua')).toString()
  )
  return await lua.global.get('API')
}

const API = await getAPI()

const _worldToPlatform = (world: string): string =>
  ({
    'PS4live-eu': database.constants.PS_EU,
    PS4live: database.constants.PS_NA,
    'XB1live-eu': database.constants.XBOX_EU,
    XB1live: database.constants.XBOX_NA,
  })[world] || orThrow(new Error(`World ${world} could not be parsed!`))

const _dataStringToObservations = async (
  id: number,
  dataString: string,
  timestamp: number
): Promise<ItemObservation[]> => {
  const item = await findItemByGameId(id)
  if (!item) {
    logger.warn(`Skipping TSC item ${id}; it is not present in UESP`)
    return []
  }
  const trait = (await TRAIT_INDEX())[id]?.[1]

  return [0, 1, 2, 3, 4, 5]
    .map((quality): ItemObservation => {
      // We can literally just emulate lua and get all the data out.
      const [average, minimum, maximum, fromLegacy] = API.parseQualityFromEntry(
        dataString,
        quality
      ) as [number, number, number, boolean, number, number, number]
      return {
        item: Item.from(item, {
          quality: fromLegacy ? null : quality,
          trait,
        }),
        stats: {
          average,
          date: _toDateString(timestamp),
          commonQuantity: 1,
          minimum,
          maximum,
        },
      }
    })
    .filter(({ stats }) => stats.maximum > 0)
}

const parseObservations = async (
  luaFiles: string[],
  options?: ParserOptions
): Promise<[string, ItemObservation[]][]> => {
  const allParsed = await parseRawData(luaFiles)
  const latestByPlatform = new Map<string, (typeof allParsed)[number]>()
  for (const parsed of allParsed) {
    const current = latestByPlatform.get(parsed.platform)
    if (!current || parsed.date! > current.date!) {
      latestByPlatform.set(parsed.platform, parsed)
    }
  }

  return await Promise.all(
    [...latestByPlatform.values()]
      .slice(0, options?.maxWrites ?? allParsed.length)
      .map(async (parsed): Promise<[string, ItemObservation[]]> => {
        const limit = pLimit(4)
        const observations = (
          await Promise.all(
            Object.entries(parsed.data)
              .slice(
                0,
                options?.maxWrites ?? Object.entries(parsed.data).length
              )
              .flatMap(async ([idString, valueString]) =>
                limit(async () => {
                  const id = Number.parseInt(idString)
                  if (
                    // These are items not reported in the UESP database but
                    //  reported in the TSC addon's data set...
                    [
                      208251, 212359, 82016, 157522, 99834, 99836, 99835,
                      100015, 99837,
                    ].includes(id)
                  ) {
                    return []
                  }

                  try {
                    return await _dataStringToObservations(
                      id,
                      valueString,
                      parsed.date!
                    )
                  } catch (e) {
                    if (process.env.CI) {
                      return []
                    }

                    throw e
                  }
                })
              )
          )
        ).flat()

        console.log('observations', observations)
        return [_worldToPlatform(parsed.platform), observations]
      })
  )
}

/**
 * The parsed results from the TSC2 addon.
 */
export type Results = ReturnType<(typeof Results)['from']>
export const Results = {
  from: async (luaFiles: string[], options?: ParserOptions) => ({
    observationsByPlatform: await parseObservations(luaFiles, options),
  }),
}
