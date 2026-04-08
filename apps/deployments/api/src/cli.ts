#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { updateKeyValues } from './index'

await updateKeyValues()
