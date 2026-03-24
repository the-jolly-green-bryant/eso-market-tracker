#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import {
  processNextPageOfLootedResults,
  processNextPageOfMinedResults,
} from './index'
import { buildDatabase, flattenDatabase } from '@eso-market-tracker/data'

await buildDatabase()
await processNextPageOfLootedResults()
await processNextPageOfMinedResults()
await flattenDatabase()
