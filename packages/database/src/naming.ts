import { Item } from '@eso-market-tracker/eso'
import { ROOT_DIRECTORY } from './constants'

export const getShardFromId = (id: number | string): string => {
  const text = id
    .toString()
    .padStart(6, '0')
    .split('')
    .reverse()
    .join('')
    .slice(0, 6)

  return text.match(/.{1,2}/g)!.join('/')
}

export const getItemDirectory = (item: Item): string => {
  const shard = getShardFromId(item.meta.canonicalId)
  return `${ROOT_DIRECTORY}/items/${shard}`
}

export const getItemPath = (item: Item) => {
  return `${getItemDirectory(item)}/${item.meta.canonicalId}.json`
}

export const getShardFromName = (value: string): string => {
  const clean = value.toLowerCase().replace(/[^a-z0-9]/g, '') // remove folder-unsafe chars
  const parts = clean.match(/.{1,4}/g)
  return parts ? parts.join('/') : ''
}

export const getQualifiedItem = (item: Item) => {
  const traitId = item.meta.trait
    ? item.meta.trait.toString().padStart(2, '0')
    : '--'
  const qualityId = item.quality
    ? item.quality.toString().padStart(2, '0')
    : '--'
  return `${item.id}-${traitId}-${qualityId}`
}

export const getObservationPath = (item: Item, date: string) => {
  const shard = getShardFromId(item.id) // Potentially has root item.
  return (
    `${ROOT_DIRECTORY}/observations/${shard}/${item.id}/` +
    `${getQualifiedItem(item)}/` +
    `${date.replaceAll('-', '/')}.json`
  )
}
