import fs from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { CATEGORIES } from '../constants'
import { fileURLToPath } from 'node:url'
import { _responseToItem, getIdFromName } from '../pages/useItem'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, '../..', 'dist')

const _getStaticItem = async (name: string) => {
  const internalId = getIdFromName(name)
  const [, s1, s2, s3] = RegExp(/^(\d{2})(\d{2})(\d{2})/).exec(
    internalId.toString().split('').reverse().join('')
  )!

  const staticDir = path.join(
    __dirname,
    '../../../../..',
    'data',
    'items',
    s1,
    s2,
    s3
  )

  return {
    item: JSON.parse(
      await fs.readFile(`${staticDir}/${internalId}.json`, 'utf8')
    ),
    pricing: {
      'xbox-na': {
        '--': {
          '--': JSON.parse(
            await fs.readFile(
              `${staticDir}/${internalId}------.xbox-na.current.json`,
              'utf8'
            )
          ),
        },
      },
    },
  }
}

const _itemFromName = async (name: string) =>
  _responseToItem(await _getStaticItem(name))

const main = async () => {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  const template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8')

  const { render } = await vite.ssrLoadModule('/src/scripts/build-entry.tsx')

  for (const slug of Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]) {
    console.log('building', slug)

    const data = {
      slug,
      data: await Promise.all(CATEGORIES[slug].map(_itemFromName)),
    }

    const inner = render(`/category/${slug}`, data)

    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${inner}</div>`
    )

    const outFile = path.join(distPath, 'category', slug, 'index.html')
    await fs.mkdir(path.dirname(outFile), { recursive: true })
    await fs.writeFile(outFile, html)
  }

  await vite.close()
}

await main()
