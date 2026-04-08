import { describe, it, expect, beforeAll } from 'vitest'
import { LuaFactory } from 'wasmoon'
import fs from 'fs'
import path from 'path'
import { MASTER_ITEM_INDEX } from '@eso-market-tracker/data'
import { getIdFromName, logger } from '@eso-market-tracker/logging'
import { buildShardedLua } from './builder'

const getSDK = async () => {
  const factory = new LuaFactory()
  const lua = await factory.createEngine()
  lua.global.set('console_log', (...args: never[]) => {
    logger.info(`[lua] ${JSON.stringify(args)}`)
  })
  await lua.doString(
    fs.readFileSync(path.join(__dirname, 'mocks.lua')).toString()
  )
  await lua.doString(
    fs
      .readFileSync(path.join(__dirname, 'MarketTracker', 'data.1464.lua'))
      .toString()
  )
  await lua.doString(
    fs.readFileSync(path.join(__dirname, 'MarketTracker', 'sdk.lua')).toString()
  )
  return await lua.global.get('MARKET_TRACKER_SDK')
}

describe('sdk', async () => {
  let SDK: Awaited<ReturnType<typeof getSDK>>

  beforeAll(async () => {
    await buildShardedLua()
    SDK = await getSDK()
    expect(SDK).toBeDefined()
  })

  it('generates idempotent ids matching our database', async () => {
    Object.keys(await MASTER_ITEM_INDEX()).map(async (name) => {
      const luaId = await SDK.GetIdFromName(name)
      const internalId = getIdFromName(name)
      expect(luaId).toEqual(internalId)
      logger.info(`name=${name}, luaId=${luaId}, internalId=${internalId}`)
    })
  })

  it('generates lua functions', async () => {
    const pricing = await SDK.GetPriceFromName(
      'Dreugh Wax',
      undefined,
      undefined,
      'xbox-eu'
    )
    expect(pricing).toBeDefined()
    expect(pricing['minimum']).toBeLessThan(pricing['maximum'])
    expect(pricing['average']).toBeDefined()
  })
})
