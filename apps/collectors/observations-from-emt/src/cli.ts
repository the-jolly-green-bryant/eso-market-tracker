#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { processPageOfData } from './index'

await processPageOfData(3630, { limit: 10 })
