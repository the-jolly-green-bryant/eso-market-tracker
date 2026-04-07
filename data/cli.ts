#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { buildDatabase, flattenDatabase } from './build'

await buildDatabase({ skipInsertingTraits: true })
await flattenDatabase()
