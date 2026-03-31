import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs/promises'
import pLimit from 'p-limit'

export const throttleFileWrites = pLimit(32)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const writeToFile = async (
  o: Record<
    string | number,
    string | number | number[] | null | Record<string, string | number | null>
  >,
  targetPath: string,
  options?: { preservedKeys: string[] }
) => {
  const preservedKeys = options?.preservedKeys || []
  targetPath = targetPath.endsWith('.json') ? targetPath : `${targetPath}.json`
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const localPath = `${__dirname}/../../../${targetPath}`
  const oldData = (await readFromFile(targetPath)) || {}
  const newData = {
    ...oldData,
    ...o,
  }

  // Rewrite preserved keys.
  preservedKeys.forEach((key) => {
    newData[key] = oldData[key] ?? newData[key]
  })

  await fs.mkdir(path.dirname(localPath), { recursive: true })
  await fs.writeFile(localPath, JSON.stringify(newData, null, 2))
}

export const readFromFile = async (
  targetPath: string
): Promise<Record<string, string | number | number[] | null> | null> => {
  targetPath = targetPath.endsWith('.json') ? targetPath : `${targetPath}.json`
  const localPath = `${__dirname}/../../../${targetPath}`
  try {
    const raw = await fs.readFile(localPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    // If it couldn't be read for any reason, it couldn't be read.
    return null
  }
}

export const deleteFile = async (targetPath: string) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const localPath = `${__dirname}/../../../${targetPath}`
  try {
    await fs.rm(localPath)
  } catch {
    // We don't really care if this fails.
    return
  }
}
