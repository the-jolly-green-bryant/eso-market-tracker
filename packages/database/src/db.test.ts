import { describe, expect, it } from 'vitest'
import { deleteFile, readFromFile, writeToFile } from './db'

describe('file writing', () => {
  const targetPath = 'data/test/test.json'
  deleteFile(targetPath)

  it('writes a file, preserving keys', async () => {
    const data = { blah: 'thing' }
    await writeToFile(data, targetPath)
    expect((await readFromFile(targetPath))!['blah']).toEqual(data.blah)
  })
})
