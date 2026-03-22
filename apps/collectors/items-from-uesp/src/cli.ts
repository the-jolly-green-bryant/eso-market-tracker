#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { processNextPage } from './index'
await processNextPage()
