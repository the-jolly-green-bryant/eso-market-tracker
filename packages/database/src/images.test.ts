import { describe, it, expect } from 'vitest'
import { getOrDownloadImage } from './images'

const SAMPLE_IMAGE =
  'https://esoicons.uesp.net/esoui/art/icons/gear_ancient_elf_shield_b.png'

describe('images', async () => {
  it('can download an image', async () => {
    expect(await getOrDownloadImage(SAMPLE_IMAGE)).toBe(
      'data/images/b_/dl/ei/gear_ancient_elf_shield_b.png'
    )
    expect(await getOrDownloadImage(SAMPLE_IMAGE, { force: true })).toBe(
      'data/images/b_/dl/ei/gear_ancient_elf_shield_b.png'
    )
  })

  it('knows if the target is an image', async () => {
    await expect(
      async () => await getOrDownloadImage('https://placehold.co/')
    ).rejects.toThrow(/valid/)
  })
})
