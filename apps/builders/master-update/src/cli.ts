#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import * as index from './index'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import path from 'path'

await index.prepareDatabase()
await index.importItems()
await index.importObservations()
await index.prepareDatabase()
await index.buildApi()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

execSync('npm run build', {
  cwd: path.resolve(__dirname, '../../../apps/deployments/website'),
  stdio: 'inherit',
  env: process.env,
})

await index.buildAddon()
