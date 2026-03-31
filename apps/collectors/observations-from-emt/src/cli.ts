#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { processPageOfData } from './index'

await processPageOfData(22700, { limit: 10 })
