import { MASTER_PRICING_INDEX } from '@eso-market-tracker/data'
import { orThrow } from '@eso-market-tracker/logging'
import { naming } from '@eso-market-tracker/database'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const _setNested = (
  root: Record<string, unknown>,
  branchKeys: string[],
  value: unknown
) => {
  let branch = root
  for (const key of branchKeys.slice(0, -1)) {
    branch[key] ??= {}
    branch = branch[key] as Record<string, unknown>
  }
  branch[branchKeys.at(-1)!] = value
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
type NestedRecord = Record<string, NestedRecord | unknown>

export const getShardedRecord = async () => {
  const pricingIndex: NestedRecord = await MASTER_PRICING_INDEX()
  return Object.keys(pricingIndex)
    .map((qualifiedId) => {
      const internalId = qualifiedId.split('-').at(0)!
      const shards = naming.getShardFromId(internalId)
      const [sh1, sh2, sh3] = shards.split('/')
      return [`${sh1}${sh2}`, sh3, qualifiedId]
    })
    .reduce((acc, [functionName, indexKey, qualifiedId]) => {
      const p = /^(.*?)-([-0-9]{2})-([-0-9]{2})\.(.*)$/
      const [, internalId, traitId, qualityId, platform] =
        RegExp(p).exec(qualifiedId) ||
        orThrow(new Error(`Could not parse qualifiedId ${qualifiedId}`))

      _setNested(
        acc,
        [
          functionName,
          indexKey,
          internalId,
          platform,
          traitId.replace('-1', '--'),
          qualityId,
        ],
        pricingIndex[qualifiedId]
      )

      return acc
    }, {}) as NestedRecord
}

const _getBucketKey = (s1s2: string): string => {
  const s1 = s1s2.slice(0, 2)
  const n = Number(s1)

  if (Number.isNaN(n) || n < 0 || n > 99) {
    throw new Error(`Invalid shard prefix: ${s1s2}`)
  }

  const base = n % 50
  const paired = base + 50

  return `${String(base).padStart(2, '0')}${String(paired).padStart(2, '0')}`
}

const _getQualityLuaCode = (o: NestedRecord) =>
  Object.entries(o)
    .map(
      ([qualityId, data]) => `
                ["${qualityId}"] = {
                  ${Object.entries(data as Record<string, number | string>)
                    .map(([key, value]) => `["${key}"]="${value}"`)
                    .join(', ')}
                }`
    )
    .join(',\n')

const _getTraitLuaCode = (o: NestedRecord) =>
  Object.entries(o)
    .map(
      ([traitId, o]) => `
              ["${traitId}"] = {
                ${_getQualityLuaCode(o)}
              }`
    )
    .join(',\n')

const _getPlatformLuaCode = (o: NestedRecord) =>
  Object.entries(o)
    .map(
      ([platform, o]) => `
            ["${platform}"] = {${_getTraitLuaCode(o)}
            }`
    )
    .join(',\n')

const _getInternalIdLuaCode = (o: NestedRecord) =>
  Object.entries(o)
    .map(
      ([internalId, o]) => `["${internalId}"] = function (platform)
          return ({
            ${_getPlatformLuaCode(o)}
          })[tostring(platform)]
        end`
    )
    .join(',\n')

export const getShardedLua = async () => {
  const root = await getShardedRecord()
  const grouped = Object.entries(root).reduce<
    Record<string, Array<[string, (typeof root)[string]]>>
  >((acc, entry) => {
    const [s1s2, value] = entry
    const bucketKey = _getBucketKey(s1s2)
    ;(acc[bucketKey] ??= []).push([s1s2, value])
    return acc
  }, {})

  //language=lua
  return [...Array(50).keys()].map((i) => [
    `
    _G.MARKET_TRACKER_SDK = _G.MARKET_TRACKER_SDK or {}
    _G.MARKET_TRACKER_SDK.shard_${i.toString().padStart(2, '0')} = function (s2)
      return ({
      ${Object.entries(grouped)
        .flatMap(([_, entries]) => entries)
        .filter(([s1s2, _]) => s1s2.startsWith(i.toString().padStart(2, '0')))
        .map(
          ([s1s2, o]) => `
        ["${s1s2.substring(2)}"] = function (s3)
          return ({
            ${Object.entries(o)
              .map(
                ([s3, o]) => `
            ["${s3}"] = function (internalId)
              return ({
                ${_getInternalIdLuaCode(o)}
              })[tostring(internalId)]
            end`
              )
              .join(',')}
          })[tostring(s3)]
        end`
        )}})[tostring(s2)]
    end
      
    _G.MARKET_TRACKER_SDK.shard_${(i + 50).toString().padStart(2, '0')} = function (s2)
      return ({
      ${Object.entries(grouped)
        .flatMap(([_, entries]) => entries)
        .filter(([s1s2, _]) =>
          s1s2.startsWith((i + 50).toString().padStart(2, '0'))
        )
        .map(
          ([s1s2, o]) => `
        ["${s1s2.substring(2)}"] = function (s3)
          return ({
            ${Object.entries(o)
              .map(
                ([s3, o]) => `
            ["${s3}"] = function (internalId)
              return ({
                ${_getInternalIdLuaCode(o)}
              })[tostring(internalId)]
            end`
              )
              .join(',')}
          })[tostring(s3)]
        end`
        )}
      })[tostring(s2)]
    end
      `,
    `${i.toString().padStart(2, '0')}${(i + 50).toString().padStart(2, '0')}`,
  ])
}

export const buildShardedLua = async () =>
  Promise.all(
    (await getShardedLua()).map(([lua, fileKey]) => {
      const writePath = path.join(
        __dirname,
        'MarketTracker',
        `data.${fileKey}.lua`
      )
      return fs.promises.writeFile(
        writePath,
        lua.replaceAll(/^[ \t]+$/gm, '').replaceAll(/\n{2,}/g, '\n'),
        'utf8'
      )
    })
  )
