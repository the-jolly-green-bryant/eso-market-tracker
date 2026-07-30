import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate'
import {
  getObservationSegmentPath,
  ObservationSegmentRecord,
  writeObservationSegments,
} from './segments'

const observation = (
  overrides?: Partial<ObservationSegmentRecord>,
): ObservationSegmentRecord => ({
  itemId: 123456,
  traitId: 4,
  qualityId: 2,
  server: 'xbox-na',
  stats: {
    average: 200,
    date: '2026-07-29',
    commonQuantity: 1,
    minimum: 100,
    maximum: 300,
  },
  ...overrides,
})

// The lifecycle-managed temporary directory is shared across the related cases.
// eslint-disable-next-line max-lines-per-function
describe('partitioned observation segments', () => {
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => fs.rm(directory, { recursive: true, force: true })),
    )
  })

  it('partitions by server, month, and stable item shard', () => {
    expect(getObservationSegmentPath(observation())).toBe(
      'data/segments/observations/xbox-na/2026/07/65.jsonl.gz',
    )
  })

  it('rejects malformed dates', () => {
    expect(() =>
      getObservationSegmentPath(
        observation({ stats: { ...observation().stats, date: '2026-13-01' } }),
      ),
    ).toThrow('Observation date must use YYYY-MM-DD')
  })

  it('deduplicates records and writes a deterministic manifest', async () => {
    const repositoryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'eso-segments-'),
    )
    temporaryDirectories.push(repositoryRoot)
    const record = observation()
    const earlierRecord = observation({
      stats: { ...record.stats, date: '2026-07-01' },
    })
    const otherServerRecord = observation({ server: 'ps-na' })

    expect(
      await writeObservationSegments(
        [record, record, earlierRecord, otherServerRecord],
        { repositoryRoot },
      ),
    ).toHaveLength(2)
    expect(
      await writeObservationSegments([record], { repositoryRoot }),
    ).toHaveLength(0)

    const segmentPath = path.join(
      repositoryRoot,
      getObservationSegmentPath(record),
    )
    const lines = strFromU8(gunzipSync(await fs.readFile(segmentPath)))
      .split('\n')
      .filter(Boolean)
    expect(lines).toHaveLength(2)

    const manifest = JSON.parse(
      await fs.readFile(
        path.join(repositoryRoot, 'data/manifests/observations.json'),
        'utf8',
      ),
    )
    expect(manifest.schemaVersion).toBe(2)
    expect(manifest.segments[getObservationSegmentPath(record)]).toMatchObject({
      records: 2,
      firstDate: '2026-07-01',
      lastDate: '2026-07-29',
      compressedBytes: expect.any(Number),
      uncompressedBytes: expect.any(Number),
    })
  })

  it('updates matching records and reports corrupt JSONL with its line', async () => {
    const repositoryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'eso-segments-'),
    )
    temporaryDirectories.push(repositoryRoot)
    const record = observation()
    await writeObservationSegments([record], { repositoryRoot })
    await writeObservationSegments(
      [
        {
          ...record,
          stats: { ...record.stats, maximum: 999 },
        },
      ],
      { repositoryRoot },
    )

    const segmentPath = path.join(
      repositoryRoot,
      getObservationSegmentPath(record),
    )
    const saved = strFromU8(gunzipSync(await fs.readFile(segmentPath)))
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
    expect(saved).toHaveLength(1)
    expect(saved[0].stats.maximum).toBe(999)

    await fs.writeFile(
      segmentPath,
      gzipSync(strToU8('{}\n{'), { level: 9, mtime: 0 }),
    )
    await expect(
      writeObservationSegments([record], { repositoryRoot }),
    ).rejects.toThrow(`Invalid JSONL in ${segmentPath} at line 2`)
  })
})
