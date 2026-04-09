#!/usr/bin/env -S tsx --env-file=../.env --max-old-space-size=8192
import 'dotenv/config'
import { buildDatabase, flattenDatabase } from './build'

await buildDatabase({ skipInsertingTraits: true })
await flattenDatabase()
