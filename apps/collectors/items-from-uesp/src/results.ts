import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { getTraitIdFromString, Item } from '@eso-market-tracker/eso'
import { Element } from 'domhandler'
import { orThrow } from '@eso-market-tracker/logging'

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

export const _getIconFromRow = ($: CheerioAPI, el: Element) => {
  const imageUrl = $(el).find('> td:nth-of-type(4) img').attr('src')
  ;(imageUrl && imageUrl.length) ||
    orThrow(new Error(`No image found for ${el}`))

  return (imageUrl!.startsWith('//') ? 'https:' : '') + imageUrl
}

const _getTraitFromRow = ($: CheerioAPI, el: Element) => {
  const trait = $(el)
    .find('> td:nth-of-type(9)')
    .text()
    .trim()
    .replaceAll('Armor ', '')
    .replaceAll('Weapon ', '')
    .replaceAll('Jewelry ', '')
    .toLowerCase()
  return trait ? getTraitIdFromString(trait) : null
}

const hashString = (str: string): number => {
  let hash = 0x811c9dc5

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

const _getItemsFromHtml = (html: string): Item[] => {
  const $ = cheerio.load(html)
  const rows = $('table#esologtable > tbody > tr')
    .toArray()
    .flatMap((el) =>
      Item.from({
        canonicalId: parseInt(_getNthStringFromRow($, el, 2)),
        bindType: parseInt(_getNthStringFromRow($, el, 31)),
        name: _getNthStringFromRow($, el, 3, { textIsOptional: true }),
        description: _getNthStringFromRow($, el, 5, { textIsOptional: true }),
        icon: _getIconFromRow($, el),
        trait: _getTraitFromRow($, el),
        variantOf: null, // Set in following loop.
      })
    )
    // Filter out bind-on-pickup items.
    .filter((i) => ![1, 4].includes(i.meta.bindType) && i.meta.name)

  const results = rows.flatMap((i) => {
    if (!i.meta.trait) {
      return [i]
    }

    const variant = rows.find(
      (v) =>
        i.meta.trait &&
        v.meta.name == i.meta.name &&
        !v.meta.trait &&
        v.meta.canonicalId != i.meta.canonicalId
    )
    i.meta.variantOf = variant ? variant.id : null

    // If we didn't find a base item, create one.
    if (!i.meta.variantOf) {
      const newV = Item.from({ ...i.meta })
      newV.meta.trait = null
      newV.meta.canonicalId = hashString(newV.meta.name)
      newV.meta.variantOf = null
      newV.id = newV.meta.canonicalId
      i.meta.variantOf = newV.meta.canonicalId
      return [i, newV]
    }

    return [i]
  })

  return Array.from(
    new Map(results.map((item) => [item.meta.canonicalId, item])).values()
  )
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
export type Results = ReturnType<(typeof Results)['from']>
export const Results = {
  from(html: string) {
    return {
      items: _getItemsFromHtml(html),
      next: _getNextEndpointFromHtml(html),
    }
  },
}
