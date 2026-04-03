#!/usr/bin/env -S tsx --env-file=../.env
import 'dotenv/config'
import { collectObservations } from './index'

await collectObservations()
