import { describe, it, expect } from 'vitest'
import { readFromFile, writeToFile, deleteFile } from './db'

describe('file writing', () => {
  const targetPath = 'data/test/test.json'
  deleteFile(targetPath)

  it('writes a file, preserving keys', async () => {
    const data = { blah: 'thing' }
    writeToFile(data, targetPath)
    expect(readFromFile(targetPath)).toEqual(data)
    const data2 = { blah: 'thing2', blah2: 'thing3' }
    writeToFile(data2, targetPath, { preservedKeys: ['blah'] })
    expect(readFromFile(targetPath)).toEqual({ blah: 'thing', blah2: 'thing3' })
  })
})
