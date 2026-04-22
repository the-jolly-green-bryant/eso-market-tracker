#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import * as index from './index'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import path from 'path'

// await index.prepareDatabase()
// await index.importItems()
await index.importObservations()
await index.prepareDatabase()
await index.buildApi()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cwd = path.resolve(__dirname, '../../../deployments/website')
execSync('npm run build', {
  cwd,
  stdio: 'inherit',
  env: process.env,
})

await index.buildAddon()

execSync('git add -v -A', {
  cwd: path.resolve(__dirname, '../../..'),
  stdio: 'inherit',
  env: process.env,
})

execSync('git commit -m "Updated Item Data & Rebuilt" --no-verify', {
  cwd: path.resolve(__dirname, '../../..'),
  stdio: 'inherit',
  env: process.env,
})
