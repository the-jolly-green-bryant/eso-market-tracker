import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()

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

const version = getVersion()
const packageJsonFiles = findPackageJsonFiles(ROOT)

for (const filePath of packageJsonFiles) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const pkg = JSON.parse(raw)

  pkg.version = version

  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`Updated ${path.relative(ROOT, filePath)} -> ${version}`)
}
