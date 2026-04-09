import { describe, expect, it } from 'vitest'
import { internalToName, nameToInternal, _replaceHyphens } from './naming'
import { getIdFromName } from '@eso-market-tracker/logging'
import items from '../../docs/items.json'

// These are cases where the item shares a name with a more popular
//  tradable item, and we want to defer to that item when converting
//  names.
const UNTESTABLE_ITEMS = [
  "Amulet of Baan Dar's Blessing",
  "Anthelmir's Construct Mask",
  "Baan Dar's Blessing Battle Axe",
  "Bloodspawn's Mask",
  "Covenant's Ring",
  "Covenant's Signet",
  "Dominion's Band",
  "Dominion's Signet",
  "Gauntlets of Baan Dar's Blessing",
  "Grothdarr's Mask",
  "Hat of Oakfather's Retribution",
  "Kjalnar's Nightmare Mask",
  "Locket of Almalexia's Mercy",
  "Mighty Chudan's Mask",
  "Molag Kena's Mask",
  "Necklace of Cyrodiil's Crest",
  "Nerien'eth's Mask",
  "Oakfather's Retribution Mace",
  "Pact's Band",
  "Pact's Ring",
  "Pillager's Band",
  "Pirate Skeleton's Epaulets",
  "Pirate Skeleton's Mask",
  "Ring of Oakfather's Retribution",
  "Shield of Oakfather's Retribution",
  "Slimecraw's Mask",
  "Style Page: Earthgore's Mask",
  "Style Page: Pirate Skeleton's Mask",
  "Style Page: Velidreth's Shoulder",
  "Sword  of Oakfather's Retribution",
  "Valkyn Skoria's Mask",
  "Velidreth's Mask",
  'Ancestral Nord: Boots',
  'Arm Cops of the Morag Tong',
  'Armor of the Witchman',
  'Balorgh Mask',
  'Bloodthorn Necklace',
  'Boots of the Morag Tong',
  'Chokethorn Mask',
  'Domihaus Mask',
  'Earthgore Mask',
  'Gloves of the Worm Cult',
  'Mace of the Companions',
  'Mighty Chudan Mask',
  'Monolith of Storms Boots',
  'Mother Ciannait Pauldron',
  'Necklace of the Footman',
  'Nobility in Decay Arm Cops',
  'Nobility in Decay Hat',
  'Nobility in Decay Mace',
  'Pirate Skeleton Arm Cops',
  'Pirate Skeleton Pauldrons',
  'Ravaging Band',
  'Reawakened Hierophant Shoes',
  'Ring of the Warlock',
  'Ring of the Worm',
  'Roksa the Warped Mask',
  'Signet of the Warlock',
  'silver ring of reduce feat cost healthy',
  'Stonekeeper Epaulets',
  'The Blind Mask',
  'Tide-Born Gloves',
  'Werewolf Hide Band',
]

const UNTESTABLE_ITEM_PREFIXES = [
  "Iceheart's",
  "Oakfather's Retribution",
  "Pirate Skeleton's",
  "Shadowrend's",
  "Swarm Mother's",
  "The Maelstrom's",
  'Baan Dar',
  'Gardener of Seasons',
  'Glenmoril Wyrd Treasure Map',
  'Magnus',
  'Monolith of Storms',
  'Nobility in Decay',
  'Reawakened Hierophant',
  'Soulcleaver',
  'Symphony of Blades',
  'the Morag Tong',
  'The Song of Pelinal',
  'Tide-Born',
  'Wrathsun',
  'research scroll',
  'style page dogs pauldron',
]

describe('legacy naming', () => {
  it('should be idempotent', () => {
    ;(items as { name: string }[]).forEach((row) => {
      const originalName = row.name
        .replace(/Treasure Map ([IVX]+)?/, 'Treasure Map I')
        .replace(/ Poison(?: [IVX]+)?/, ' Poison I')

      // Run it twice to detect any funny business.
      const internalName = nameToInternal(nameToInternal(originalName))
      const roundTripName = internalToName(internalToName(internalName))
      const originalId = getIdFromName(originalName)
      const roundTripId = getIdFromName(roundTripName)
      if (
        roundTripName == 'a savage ring' ||
        UNTESTABLE_ITEMS.includes(row.name) ||
        row.name.startsWithAny(UNTESTABLE_ITEM_PREFIXES)
      ) {
        return
      }

      expect(
        originalId,
        `internal=${internalName}, original=${originalName}, roundTrip=${roundTripName}`
      ).toEqual(roundTripId)
    })
  })

  it('should correct labels into full names', () => {
    expect(internalToName('abahs watch axes')).toEqual(
      'crafting motif 32 abahs watch axes'
    )
  })

  it('should not be lossy', () => {
    const label = 'abahs watch axes'
    expect(nameToInternal(internalToName(label))).toEqual(label)
  })

  it('should handle "of" sets', () => {
    const label = 'mothers embrace axe'
    const name = 'axe of mothers embrace'
    expect(internalToName(label)).toEqual(name)
    expect(nameToInternal(name)).toEqual(label)
  })

  it('should handle bucket', () => {
    const label = 'bucket style page'
    const name = 'style page bucket'
    expect(internalToName(label)).toEqual(name)
    expect(nameToInternal(name)).toEqual(label)
  })

  it('should handle fake names', () => {
    const label = 'opal engine guardians shoulder'
    const name = 'a savage ring'
    expect(internalToName(label)).toEqual(name)
  })

  it('should handle style pages', () => {
    const label = 'tremorscale mask'
    const name = 'style page tremorscale mask'
    expect(internalToName(label)).toEqual(name)
  })
})

describe('legacy naming special cases', () => {
  it('handles special cases and overlaps', () => {
    const label = 'pauldrons of the ivory brigade'
    expect(internalToName(label)).toEqual(label)
  })

  it('handles amulet and ring', () => {
    expect(internalToName('aldmions necklace')).toEqual('aldmions amulet')
    expect(internalToName('baelborne ring')).toEqual('baelborne signet')
  })

  it('should re-hyphenate things', () => {
    expect(_replaceHyphens('rye in your eye')).toEqual('rye-in-your-eye')
  })

  it('should ignore bound items', () => {
    expect(internalToName('bound thing')).toEqual('a savage ring')
  })

  it('should handle treasure maps', () => {
    expect(internalToName('cool treasure map')).toEqual('cool treasure map i')
  })

  it('should handle mothers sorrow', () => {
    expect(internalToName('mothers sorrow axe')).toEqual(
      'axe of a mothers sorrow'
    )
  })
})
