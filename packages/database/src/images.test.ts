import { describe, expect, it } from 'vitest'
import { getOrDownloadImage, getValidatedRequest } from './images'

const SAMPLE_IMAGE =
  'https://yavuzceliker.github.io/sample-images/image-1021.jpg'

describe('images', async () => {
  it('can download an image', async () => {
    expect(await getOrDownloadImage(SAMPLE_IMAGE)).toBe(
      'data/images/12/01/-e/image-1021.jpg'
    )
    expect(await getOrDownloadImage(SAMPLE_IMAGE, { force: true })).toBe(
      'data/images/12/01/-e/image-1021.jpg'
    )
  })

  it('handles failed fetches', async () => {
    await expect(
      async () => await getValidatedRequest('blah.comp')
    ).rejects.toThrow(/failed/)

    await expect(
      async () =>
        await getValidatedRequest(
          'https://raw.githubusercontent.com/selva86/datasets/refs/heads/master/sample.txt'
        )
    ).rejects.toThrow(/valid/)

    await expect(
      getValidatedRequest(
        'https://github.com/ImageGlass/sample-images/blob/master/Samples/JPG/auto_rotate.jpg?raw=true'
      )
    ).resolves.not.toThrow()
  })
})
