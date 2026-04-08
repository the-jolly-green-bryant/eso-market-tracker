#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import * as index from './index'

await index.prepareDatabase()
await index.importItems()
await index.importObservations()
await index.prepareDatabase()
await index.buildAddon()
await index.buildApi()
