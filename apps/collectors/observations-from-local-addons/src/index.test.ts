import 'dotenv/config'
import { describe, expect, it } from 'vitest'
import * as git from './git'

describe.skipIf(process.env.CI)(
  'observations from local addons',
  { timeout: 120_000 * 30 },
  () => {
    const commits = git.getHistoricalContentForRepo(
      process.env.TSC_XBOX_ADDON_PATH!
    )

    it('can pull commit history', () => {
      expect(commits.length).toEqual(130)
      expect(commits.map((i) => i.files.length)).not.toContain(0)
    })

    it('can pull item data', async () => {
      const observations = await git.getObservationsFromCommit(commits.at(-1)!)
      expect(observations.length).toEqual(20265)
    })
  }
)
