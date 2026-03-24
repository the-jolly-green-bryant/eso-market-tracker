const qualityIndex: Record<string, number> = {
  white: 1,
  green: 2,
  blue: 3,
  purple: 4,
  gold: 5,
}

export const qualityLookup = [
  null,
  'white', // 1,
  'green', // 2,
  'blue', // 3,
  'purple', // 4,
  'gold', // 5,
]

export const getQualityIdFromString = (quality: string) => qualityIndex[quality]
export const getQualityStringFromId = (id: number) => qualityLookup.at(id)
