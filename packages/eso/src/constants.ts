import { Item } from './items/items'

export const SAMPLE_BASE_ITEM = Item.from({
  canonicalId: 10,
  variantOf: null,
  name: 'I am a test item.',
  trait: null,
  icon: 'https://esoicons.uesp.net/esoui/art/icons/crafting_beer_001.png',
  description: 'This is a test item used to confirm database functionality.',
  bindType: 1,
})

export const SAMPLE_VARIANT_ITEM = Item.from({
  canonicalId: 11,
  variantOf: 10,
  name: 'I am a test item.',
  trait: 42,
  icon: 'https://esoicons.uesp.net/esoui/art/icons/crafting_beer_001.png',
  description: 'This is a test item used to confirm database functionality.',
  bindType: 1,
})
