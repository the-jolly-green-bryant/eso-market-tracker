import { Item } from '@eso-market-tracker/eso'

const rootDirectory = 'data'

const getShardFromId = (id: number): string => {
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
  return `${rootDirectory}/items/${shard}/${item.meta.canonicalId}`
}
