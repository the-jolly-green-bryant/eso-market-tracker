#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { processNextPage } from './index'
import { buildDatabase, flattenDatabase } from '@eso-market-tracker/data'

await buildDatabase()
await processNextPage()
await flattenDatabase()
