#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { processPageOfData } from './index'

await processPageOfData(13020, { limit: 10 })
