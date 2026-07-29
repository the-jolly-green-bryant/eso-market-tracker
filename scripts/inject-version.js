import { fileURLToPath } from 'url'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = process.cwd()
const ADDON_FILE = path.join(
  __dirname,
  '..',
  'apps',
  'deployments',
  'eso-addon',
  'src',
  'MarketTracker',
  'MarketTracker.addon'
)

function getVersion() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    // .replace('-', '')
    .replaceAll('-', '.')
  const sha = execSync('git rev-parse --short HEAD').toString().trim()
  return `${date}+${sha}`
}

function findPackageJsonFiles(dir) {
  const results = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'observations' ||
      entry.name === 'items' ||
      entry.name.startsWith('.')
    ) {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      results.push(...findPackageJsonFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name === 'package.json') {
      results.push(fullPath)
    }
  }

  return results
}

function updateAddonVersion(filePath, version) {
  const raw = fs.readFileSync(filePath, 'utf8')

  if (!raw.includes('## Version:')) {
    throw new Error(`Could not find ## Version: line in ${filePath}`)
  }

  const updated = raw.replace(/^## Version:.*$/m, `## Version: ${version}`)

  fs.writeFileSync(filePath, updated)
  console.log(`Updated ${path.relative(ROOT, filePath)} -> ${version}`)
}

const version = getVersion()
const packageJsonFiles = findPackageJsonFiles(ROOT)

for (const filePath of packageJsonFiles) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const pkg = JSON.parse(raw)

  pkg.version = pkg.version === '0.0.1' ? pkg.version : version

  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`Updated ${path.relative(ROOT, filePath)} -> ${version}`)
}

updateAddonVersion(ADDON_FILE, version)
