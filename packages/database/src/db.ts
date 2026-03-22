import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

export const writeToFile = (
  o: Record<string, string | number | null>,
  targetPath: string,
  options?: { preservedKeys: string[] }
) => {
  const preservedKeys = options?.preservedKeys || []
  targetPath = targetPath.endsWith('.json') ? targetPath : `${targetPath}.json`
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const localPath = `${__dirname}/../../../${targetPath}`
  const oldData = readFromFile(targetPath) || {}
  const newData = {
    ...oldData,
    ...o,
  }

  // Rewrite preserved keys.
  preservedKeys.forEach((key) => {
    newData[key] = oldData[key] ?? newData[key]
  })

  fs.mkdirSync(path.dirname(localPath), { recursive: true })
  fs.writeFileSync(localPath, JSON.stringify(newData, null, 2))
}

export const readFromFile = (
  targetPath: string
): Record<string, string | number | null> | null => {
  targetPath = targetPath.endsWith('.json') ? targetPath : `${targetPath}.json`
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const localPath = `${__dirname}/../../../${targetPath}`
  if (!fs.existsSync(localPath)) {
    return null
  }

  const raw = fs.readFileSync(localPath, 'utf8')
  return JSON.parse(raw)
}

export const deleteFile = (targetPath: string) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const localPath = `${__dirname}/../../../${targetPath}`
  if (!fs.existsSync(localPath)) return
  fs.rmSync(localPath)
}
