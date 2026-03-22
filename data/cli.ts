#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { buildDatabase } from './build'
await buildDatabase()
