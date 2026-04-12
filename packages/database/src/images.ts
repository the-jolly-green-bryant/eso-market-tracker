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

export const getFilenameFromUrl = (url: string) =>
  new URL(url).pathname.split('/').pop()!

const getImageDirectory = (filename: string) => {
  const shard = getShardFromId(filename.split('.').at(0)!)
  return `${ROOT_DIRECTORY}/images/${shard}`
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const getOrDownloadImage = (
  url: string,
  options?: { force: boolean }
) => {
  const force = options?.force ?? false
  const filename = getFilenameFromUrl(url)
  const targetPath = `${getImageDirectory(filename)}/${filename}`
  const localPath = `${__dirname}/../../../${targetPath}`
  logger.info(`Saving image ${filename} to ${__dirname} at ${localPath}`)

  // Download our image or not, we don't care.
  ;(force || !fs.existsSync(localPath)) &&
    (async () => {
      const r = await getValidatedRequest(url)
      fs.mkdirSync(path.dirname(localPath), { recursive: true })
      const buffer = Buffer.from(await r.arrayBuffer())
      fs.writeFileSync(localPath, buffer)
    })().catch((e) => {
      throw e
    })

  return targetPath
}
