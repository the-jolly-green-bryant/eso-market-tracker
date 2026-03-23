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
