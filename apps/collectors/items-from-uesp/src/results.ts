import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { getTraitIdFromString, Item, TRAITS } from '@eso-market-tracker/eso'
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

const _traitFromRow = ($: CheerioAPI, el: Element) => {
  const traitCell = $(el).find(`> td:nth-of-type(9)`).text().trim()
  const traitMatch = RegExp(new RegExp(`(${TRAITS.join('|')})`)).exec(
    traitCell.toLowerCase()
  )
  return traitMatch ? getTraitIdFromString(traitMatch.at(1)!) : null
}

const _getMinedItemsFromHtml = (
  html: string
): [Item, [number, number, number | null]][] => {
  const $ = cheerio.load(html)
  const rows = $('table#esologtable > tbody > tr')
    .toArray()
    .map((el): [Item, [number, number, number | null]] => {
      const name = _getNthStringFromRow($, el, 3, { textIsOptional: true })
      const internalId = getIdFromName(name)
      const traitId = _traitFromRow($, el)
      const gameId = parseInt(_getNthStringFromRow($, el, 2))
      return [
        Item.from({
          internalId,
          bindType: parseInt(_getNthStringFromRow($, el, 31)),
          name,
          description: _getNthStringFromRow($, el, 5, { textIsOptional: true }),
          icon: _getIconFromRow($, el, 4),
          knownIds: [gameId],
        }),
        [gameId, internalId, traitId],
      ]
    })
    // Filter out bind-on-pickup items.
    .filter((i) => ![1, 4].includes(i[0].meta.bindType) && i[0].meta.name)

  return rows
}

const _getLootedItemsFromHtml = (
  html: string
): [Item, [number, number, number | null]][] => {
  const $ = cheerio.load(html)
  const rows = $('table#esologtable > tbody > tr')
    .toArray()
    .map((el): [Item, [number, number, number | null]] => {
      const name = _getNthStringFromRow($, el, 3, { textIsOptional: true })
      const internalId = getIdFromName(name)
      const traitId = _traitFromRow($, el)
      const gameId = parseInt(_getNthStringFromRow($, el, 2))
      return [
        Item.from({
          internalId,
          bindType: -1,
          name,
          description: '',
          icon: attempt(() => _getIconFromRow($, el, 12), null),
          knownIds: [gameId],
        }),
        [gameId, internalId, traitId],
      ]
    })
    // Filter out bind-on-pickup items.
    .filter((i) => ![1, 4].includes(i[0].meta.bindType) && i[0].meta.name)

  return rows
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
