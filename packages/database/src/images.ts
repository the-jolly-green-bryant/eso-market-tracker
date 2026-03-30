import { getShardFromId } from './naming'
import { ROOT_DIRECTORY } from './constants'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '@eso-market-tracker/logging'

export const getValidatedRequest = async (
  url: string,
  options?: { validStatusCodes: number[] }
) => {
  const validStatusCodes = options?.validStatusCodes || [200]
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'image/*,*/*;q=0.8',
    },
  }).catch((e) => {
    throw new Error(`Fetch failed for ${url}`, { cause: e })
  })

  if (
    !validStatusCodes.includes(r.status) ||
    !r.headers.get('content-type')?.startsWith('image/')
  ) {
    throw new Error(`Url ${url} is not a valid image`)
  }

  return r
}

export const getFilenameFromDisposition = (r: Response): string | null => {
  const disposition = r.headers.get('content-disposition')
  if (!disposition) return null
  const match = disposition.match(/filename="?([^"]+)"?/)
  return match?.at(1) || null
}

export const getFilenameFromUrl = (url: string) => {
  return new URL(url).pathname.split('/').pop()!
}

const getImageDirectory = (filename: string) => {
  const shard = getShardFromId(filename.split('.').at(0)!)
  return `${ROOT_DIRECTORY}/images/${shard}`
}

export const getOrDownloadImage = async (
  url: string,
  options?: { force: boolean }
) => {
  const force = options?.force ?? false
  const filename = getFilenameFromUrl(url)
  const targetPath = `${getImageDirectory(filename)}/${filename}`
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const localPath = `${__dirname}/../../../${targetPath}`
  logger.info(`Saving image ${filename} to ${__dirname} at ${localPath}`)
  if (force || !fs.existsSync(localPath)) {
    const r = await getValidatedRequest(url)
    fs.mkdirSync(path.dirname(localPath), { recursive: true })
    const buffer = Buffer.from(await r.arrayBuffer())
    fs.writeFileSync(localPath, buffer)
  }

  return targetPath
}
