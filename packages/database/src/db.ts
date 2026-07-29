import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs/promises'
import pLimit from 'p-limit'
import { randomUUID } from 'crypto'

export const throttleFileWrites = pLimit(32)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repositoryRoot = path.resolve(__dirname, '../../..')

const getLocalPath = (targetPath: string) => {
  const jsonPath = targetPath.endsWith('.json')
    ? targetPath
    : `${targetPath}.json`
  return path.resolve(repositoryRoot, jsonPath)
}

export const writeToFile = async (
  o: Record<string | number, unknown>,
  targetPath: string,
  options?: { preservePrevious?: boolean }
) => {
  const localPath = getLocalPath(targetPath)
  const oldData = !options?.preservePrevious
    ? await readFromFile(targetPath)
    : null
  const newData = {
    ...(oldData || {}),
    ...o,
  }
  const serialized = JSON.stringify(newData)

  try {
    if ((await fs.readFile(localPath, 'utf8')) === serialized) {
      return false
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  await fs.mkdir(path.dirname(localPath), { recursive: true })
  const temporaryPath = `${localPath}.${process.pid}.${randomUUID()}.tmp`
  try {
    await fs.writeFile(temporaryPath, serialized)
    await fs.rename(temporaryPath, localPath)
    return true
  } catch (error) {
    await fs.rm(temporaryPath, { force: true })
    throw error
  }
}

export const readFromFile = async (
  targetPath: string
): Promise<Record<string, string | number | number[] | null> | null> => {
  const localPath = getLocalPath(targetPath)
  try {
    const raw = await fs.readFile(localPath, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    if (error instanceof SyntaxError) {
      throw new SyntaxError(`Invalid JSON in ${localPath}`, { cause: error })
    }
    throw error
  }
}

export const deleteFile = async (targetPath: string) => {
  const localPath = getLocalPath(targetPath)
  try {
    await fs.rm(localPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}
