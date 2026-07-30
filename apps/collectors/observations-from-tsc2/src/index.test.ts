import { describe, expect, it, vi, beforeAll } from 'vitest'
import { collectObservations } from './index'
import fs from 'fs'
import path from 'path'
import * as index from './index'
import AdmZip from 'adm-zip'

describe('observations-from-tsc2', async () => {
  beforeAll(async () => {
    vi.spyOn(index, 'getRemoteAddonVersion').mockResolvedValue(undefined)
    const code = fs
      .readFileSync(path.join(__dirname, '../docs/TSCPriceDataXBNA.min.lua'))
      .toString()
    vi.spyOn(index, 'downloadAddon').mockImplementation(
      async (output: string) => {
        const zip = new AdmZip()
        zip.addFile(
          'TSCPriceFetcher2/XB1/TSCPriceDataXBNA.min.lua',
          Buffer.from(code, 'utf8')
        )
        fs.mkdirSync(path.dirname(output), { recursive: true })
        zip.writeZip(output)

        return {
          stdout: '',
          stderr: '',
        }
      }
    )
  }, 10_000)

  it('has no errors', async () => {
    await expect(collectObservations({ maxWrites: 2 })).resolves.not.toThrow()
  }, 30_000)
})
