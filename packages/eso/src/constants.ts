import { Item } from './items/items'

export const SAMPLE_BASE_ITEM = Item.from({
  internalId: 2928226198,
  name: 'I am a test item.',
  icon: 'https://esoicons.uesp.net/esoui/art/icons/crafting_beer_001.png',
  description: 'This is a test item used to confirm database functionality.',
  bindType: 1,
  knownIds: [10],
})

export const SAMPLE_VARIANT_ITEM = Item.from(
  {
    internalId: 2928226198,
    name: 'I am a test item.',
    icon: 'https://esoicons.uesp.net/esoui/art/icons/crafting_beer_001.png',
    description: 'This is a test item used to confirm database functionality.',
    bindType: 1,
    knownIds: [10, 11],
  },
  { trait: 42 }
)
