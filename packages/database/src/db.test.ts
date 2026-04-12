import { describe, expect, it } from 'vitest'
import { deleteFile, readFromFile, writeToFile } from './db'

describe('file writing', async () => {
  const targetPath = 'data/test/test.json'
  await deleteFile(targetPath)

  it('writes a file, preserving keys', async () => {
    const data = { blah: 'thing' }
    await writeToFile(data, targetPath)
    expect((await readFromFile(targetPath))!['blah']).toEqual(data.blah)
  })
})
