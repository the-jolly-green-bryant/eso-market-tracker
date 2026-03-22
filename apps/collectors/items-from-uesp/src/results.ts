import * as cheerio from 'cheerio'
import { Item, getTraitIdFromString } from '@eso-market-tracker/eso'
import { CheerioAPI } from 'cheerio'
import { Element } from 'domhandler'

export const _getNthStringFromRow = ($: CheerioAPI, el: Element, n: number) => {
  const text = $(el).find('td:nth-child(2)').text().trim()
  if (!text || !text.length) {
    throw new Error(`No text found for ${el} at n=${n}`)
  }

  return text
}

export const _getIconFromRow = ($: CheerioAPI, el: Element) => {
  const imageUrl = $(el).find('td:nth-child(4) img').attr('src')
  if (!imageUrl || !imageUrl.length) {
    throw new Error(`No image found for ${el}`)
  }

  return (imageUrl.startsWith('//') ? 'https:' : '') + imageUrl
}

const _getTraitFromRow = ($: CheerioAPI, el: Element) => {
  const trait = $(el)
    .find('td:nth-child(9) img')
    .text()
    .trim()
    .replaceAll('Armor ', '')
    .replaceAll('Weapon ', '')
    .replaceAll('Jewelry ', '')
  return trait ? getTraitIdFromString(trait) : null
}

const _getItemsFromHtml = (html: string): Item[] => {
  const $ = cheerio.load(html)
  const rows = $('table#esologtable tbody tr')
    .toArray()
    .flatMap((el) =>
      Item.from({
        canonicalId: parseInt(_getNthStringFromRow($, el, 2)),

        name: _getNthStringFromRow($, el, 3),
        description: _getNthStringFromRow($, el, 5),
        icon: _getIconFromRow($, el),
        trait: _getTraitFromRow($, el),
        variantOf: null, // Set in following loop.
      })
    )

  return rows.map((i) => {
    const variant = rows.find(
      (v) =>
        v.meta.name == i.meta.name &&
        !v.meta.trait &&
        v.meta.canonicalId != i.meta.canonicalId
    )
    i.meta.variantOf = variant ? variant.id : null
    return i
  })
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
