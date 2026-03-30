#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { processPageOfData } from './index'

await processPageOfData(10970, { limit: 10 })
