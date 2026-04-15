import fs from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { CATEGORIES } from '../constants'
import { fileURLToPath } from 'node:url'
import {
  _responseToHistory,
  _responseToItem,
  APIItemResponse,
  getIdFromName,
} from '../pages/useItem'
import { TradableItemType } from '../models/tradable-item-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, '../..', 'dist')

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

let _MASTER_PRICING_INDEX: Record<string, [number, number | null]>
export const MASTER_PRICING_INDEX = async (): Promise<
  Record<string, [number, number | null]>
> => {
  if (_MASTER_PRICING_INDEX) return _MASTER_PRICING_INDEX

  const buf = await fs.readFile(
    path.join(__dirname, '../../../../../data', 'index', 'master-pricing.json')
  )
  const data = JSON.parse(buf.toString('utf8'))
  _MASTER_PRICING_INDEX = data as Record<string, [number, number | null]>
  return _MASTER_PRICING_INDEX
}

let _MASTER_ITEM_INDEX: Record<string, unknown>
export const MASTER_ITEM_INDEX = async (): Promise<Record<string, unknown>> => {
  if (_MASTER_ITEM_INDEX) return _MASTER_ITEM_INDEX

  const buf = await fs.readFile(
    path.join(__dirname, '../../../../../data', 'index', 'master-items.json')
  )
  const data = JSON.parse(buf.toString('utf8'))
  _MASTER_ITEM_INDEX = data as Record<string, unknown>
  return _MASTER_ITEM_INDEX
}

// We're going to duplicate this logic into here rather than adding @data as a
//  dependency. The main reason is I just don't want to overcomplicate this
//  deployment by adding internal dependencies. It adds too many moving parts
//  for a project that has low stakes.
export const getShardedRecord = async (name: string) => {
  const internalId = getIdFromName(name)
  const pricingIndex = await MASTER_PRICING_INDEX()
  return Object.keys(pricingIndex)
    .filter((i) => i.startsWith(`${internalId.toString()}-`))
    .reduce((acc, qualifiedId) => {
      const p = /^(.*?)-([-0-9]{2})-([-0-9]{2})\.(.*)$/
      const [, , traitId, qualityId, platform] = RegExp(p).exec(qualifiedId)!

      _setNested(
        acc,
        [platform, traitId.replace('-1', '--'), qualityId],
        pricingIndex[qualifiedId]
      )

      return acc
    }, {})
}

const _getStaticItem = async (name: string) => {
  const internalId = getIdFromName(name)
  console.log(name, internalId)
  const [, sh1, sh2, sh3] = RegExp(/^(\d{2})(\d{2})(\d{2})/).exec(
    internalId.toString().padStart(6, '0').split('').reverse().join('')
  )!

  const staticDir = path.join(
    __dirname,
    '../../../../..',
    'data',
    'items',
    sh1,
    sh2,
    sh3
  )

  return {
    item: JSON.parse(
      await fs.readFile(`${staticDir}/${internalId}.json`, 'utf8')
    ),
    pricing: await getShardedRecord(name),
  } as APIItemResponse
}

const _itemFromName = async (name: string) =>
  _responseToItem(await _getStaticItem(name))

const _fetchHistoricalData = async (name: string) => {
  const internalId = getIdFromName(name)
  const historicalUrl = internalId
    .toString()
    .padStart(6, '0')
    .split('')
    .reverse()
    .join('')
    .substring(0, 6)
    .replace(
      /^(.{2})(.{2})(.{2})/,
      `https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-tracker/refs/heads/main/data/items/$1/$2/$3/${internalId}------.xbox-na.historical.json`
    )
  const r = await fetch(historicalUrl)

  if (!r.ok) {
    throw new Error(`Request failed: ${r.status} - ${historicalUrl} - ${name}`)
  }

  return _responseToHistory(await r.json())
}

const makeItemPages = async (
  data: TradableItemType[],
  render: (arg0: string, arg1: unknown) => string,
  template: string
) => {
  for (const item of data) {
    console.log('item', JSON.stringify(item))
    const _in = {
      slug: item.displayLabel,
      data: item,
      historicalData: await _fetchHistoricalData(item.displayLabel),
    }

    const inner = render(`/item/${_in.slug}`, _in)
    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${inner}</div>`
    )

    const outFile = path.join(distPath, 'item', _in.slug, 'index.html')
    await fs.mkdir(path.dirname(outFile), { recursive: true })
    await fs.writeFile(outFile, html)
  }
}

const main = async () => {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8')
  const { render } = await vite.ssrLoadModule('/src/scripts/build-entry.tsx')

  for (const slug of Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]) {
    console.log('building', slug)

    const data = {
      slug,
      data: await Promise.all(CATEGORIES[slug].map(_itemFromName)),
    }

    const inner = render(`/category/${slug}`, data)
    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${inner}</div>`
    )

    const outFile = path.join(distPath, 'category', slug, 'index.html')
    await fs.mkdir(path.dirname(outFile), { recursive: true })
    await fs.writeFile(outFile, html)
  }

  const validIds = Object.keys(await MASTER_PRICING_INDEX()).map(
    (i) => i.split('-').at(0)!
  )
  for (const i of Object.keys(await MASTER_ITEM_INDEX()).filter(async (i) =>
    validIds.includes(i)
  )) {
    const k = (await _itemFromName(i).catch((e: Error) => {
      console.error(e)
      if (e.message.includes('no pricing')) return null
      throw e
    })) as TradableItemType

    k && (await makeItemPages([k], render, template))
  }

  await vite.close()
}

await main()
