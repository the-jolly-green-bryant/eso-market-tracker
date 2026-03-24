import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { Item } from '@eso-market-tracker/eso'
import { Element } from 'domhandler'
import { attempt, getIdFromName, orThrow } from '@eso-market-tracker/logging'

export const _getNthStringFromRow = (
  $: CheerioAPI,
  el: Element,
  n: number,
  options?: { textIsOptional: boolean }
) => {
  const textIsOptional = options?.textIsOptional || false
  const text = $(el).find(`> td:nth-of-type(${n})`).text().trim()
  if (!textIsOptional && (!text || !text.length)) {
    throw new Error(`No text found for ${JSON.stringify(el)} at n=${n}`)
  }

  return text
}

export const _getIconFromRow = ($: CheerioAPI, el: Element, n: number) => {
  const imageUrl = $(el).find(`> td:nth-of-type(${n}) img`).attr('src')
  ;(imageUrl && imageUrl.length) ||
    orThrow(new Error(`No image found for ${el}`))

  return (imageUrl!.startsWith('//') ? 'https:' : '') + imageUrl
}

const _getMinedItemsFromHtml = (html: string): Item[] => {
  const $ = cheerio.load(html)
  const rows = $('table#esologtable > tbody > tr')
    .toArray()
    .flatMap((el) => {
      const name = _getNthStringFromRow($, el, 3, { textIsOptional: true })
      return Item.from({
        internalId: getIdFromName(name),
        bindType: parseInt(_getNthStringFromRow($, el, 31)),
        name,
        description: _getNthStringFromRow($, el, 5, { textIsOptional: true }),
        icon: _getIconFromRow($, el, 4),
        knownIds: [parseInt(_getNthStringFromRow($, el, 2))],
      })
    })
    // Filter out bind-on-pickup items.
    .filter((i) => ![1, 4].includes(i.meta.bindType) && i.meta.name)

  const merged = new Map<number, Item>()
  rows.forEach((item) => {
    const existing =
      merged.get(item.meta.internalId) ||
      merged.set(item.meta.internalId, item).get(item.meta.internalId)!

    existing.meta.knownIds = Array.from(
      new Set([...existing.meta.knownIds, ...item.meta.knownIds])
    )
  })

  return Array.from(merged.values())
}

const _getLootedItemsFromHtml = (html: string): Item[] => {
  const $ = cheerio.load(html)
  const rows = $('table#esologtable > tbody > tr')
    .toArray()
    .flatMap((el) => {
      const name = _getNthStringFromRow($, el, 3, { textIsOptional: true })
      return Item.from({
        internalId: getIdFromName(name),
        bindType: -1,
        name,
        description: '',
        icon: attempt(() => _getIconFromRow($, el, 12), null),
        knownIds: [parseInt(_getNthStringFromRow($, el, 2))],
      })
    })
    // Filter out bind-on-pickup items.
    .filter((i) => ![1, 4].includes(i.meta.bindType) && i.meta.name)

  const merged = new Map<number, Item>()
  rows.forEach((item) => {
    const existing =
      merged.get(item.meta.internalId) ||
      merged.set(item.meta.internalId, item).get(item.meta.internalId)!

    existing.meta.knownIds = Array.from(
      new Set([...existing.meta.knownIds, ...item.meta.knownIds])
    )
  })

  return Array.from(merged.values())
}

const _getNextEndpointFromHtml = (html: string): string | null => {
  const $ = cheerio.load(html)
  const next = $('a')
    .filter((_, el) => $(el).text().trim() === 'Next')
    .attr('href')

  return next ? `https://esolog.uesp.net/viewlog.php${next}` : null
}

/**
 * The parsed results of a page of data from the UESP data mining log.
 */
export type MinedResults = ReturnType<(typeof MinedResults)['from']>
export const MinedResults = {
  from(html: string) {
    return {
      items: _getMinedItemsFromHtml(html),
      next: _getNextEndpointFromHtml(html),
    }
  },
}

/**
 * The parsed results of a page of data from the UESP looted items log.
 */
export type LootedResults = ReturnType<(typeof LootedResults)['from']>
export const LootedResults = {
  from(html: string) {
    return {
      items: _getLootedItemsFromHtml(html),
      next: _getNextEndpointFromHtml(html),
    }
  },
}
