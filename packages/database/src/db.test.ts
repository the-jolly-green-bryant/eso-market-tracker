import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteFile, readFromFile, writeToFile } from './db'

describe('file writing', () => {
  const targetPath = 'data/test/test.json'

  afterEach(async () => {
    await deleteFile(targetPath)
  })

  it('writes atomically and preserves existing keys', async () => {
    await writeToFile({ first: 'value' }, targetPath)
    await writeToFile({ second: 2 }, targetPath)

    expect(await readFromFile(targetPath)).toEqual({
      first: 'value',
      second: 2,
    })
  })

  it('skips writes when serialized content is unchanged', async () => {
    expect(await writeToFile({ value: 1 }, targetPath)).toBe(true)
    expect(await writeToFile({ value: 1 }, targetPath)).toBe(false)
  })

  it('distinguishes missing files from malformed JSON', async () => {
    expect(await readFromFile(targetPath)).toBeNull()

    const localPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../..',
      targetPath
    )
    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, '{')

    await expect(readFromFile(targetPath)).rejects.toThrow(
      `Invalid JSON in ${localPath}`
    )
  })
})
