import { describe, expect, it } from 'vitest'
import { internalToName, nameToInternal } from './naming'

describe('legacy naming', () => {
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

  it('handles special cases and overlaps', () => {
    const label = 'pauldrons of the ivory brigade'
    expect(internalToName(label)).toEqual(label)
  })

  it('handles amulet and ring', () => {
    expect(internalToName('aldmions necklace')).toEqual('aldmions amulet')
    expect(internalToName('baelborne ring')).toEqual('baelborne signet')
  })
})
