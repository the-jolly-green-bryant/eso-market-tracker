import fs from 'node:fs'

const readJson = (filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown

const formatNumber = (value: string | number | undefined) =>
  Number(value || 0).toLocaleString('en-US')

const readAddonVersion = () => {
  const manifest = fs.readFileSync(
    'apps/deployments/eso-addon/src/MarketTracker/MarketTracker.addon',
    'utf8'
  )
  return /^## Version:\s*(.+)$/m.exec(manifest)?.[1] ?? 'unknown'
}

const observationStats = () => {
  const manifest = readJson('data/manifests/observations.json') as {
    segments: Record<string, { records: number }>
  }
  const entries = Object.values(manifest.segments)
  return {
    records: entries.reduce((total, entry) => total + entry.records, 0),
    segments: entries.length,
  }
}

export const buildDiscordPayload = (
  environment: NodeJS.ProcessEnv = process.env
) => {
  const pkg = readJson('package.json') as { version: string }
  const trackedItems = Object.keys(
    readJson('data/index/master-items.json') as object
  ).length
  const pricingEntries = Object.keys(
    readJson('data/index/master-pricing.json') as object
  ).length
  const observations = observationStats()
  const changedItems = formatNumber(environment.CHANGED_ITEM_COUNT)
  const pages = formatNumber(environment.CHANGED_PAGE_COUNT)
  const dataFiles = formatNumber(environment.CHANGED_DATA_FILE_COUNT)
  const duration = Number(environment.UPDATE_TOTAL_SECONDS || 0)
  const commitUrl = `${environment.GITHUB_SERVER_URL}/${environment.GITHUB_REPOSITORY}/commit/${environment.PUBLISHED_SHA}`

  return {
    username: 'ESO Market Tracker',
    embeds: [
      {
        title: 'Daily market update launched',
        url: `${environment.GITHUB_SERVER_URL}/${environment.GITHUB_REPOSITORY}/actions/runs/${environment.GITHUB_RUN_ID}`,
        color: 0x65a30d,
        description:
          `New market data is live across the API, website, add-on, and repository.\n` +
          `[View commit](${commitUrl})`,
        fields: [
          { name: 'Changed items', value: changedItems, inline: true },
          { name: 'Website pages', value: pages, inline: true },
          { name: 'Data files', value: dataFiles, inline: true },
          {
            name: 'Tracked catalog',
            value: `${formatNumber(trackedItems)} items`,
            inline: true,
          },
          {
            name: 'Pricing records',
            value: formatNumber(pricingEntries),
            inline: true,
          },
          {
            name: 'Observations',
            value: `${formatNumber(observations.records)} in ${formatNumber(observations.segments)} segments`,
            inline: true,
          },
          { name: 'Project version', value: pkg.version, inline: true },
          { name: 'Add-on version', value: readAddonVersion(), inline: true },
          {
            name: 'Bethesda release',
            value: environment.GITHUB_SHA!.slice(0, 7),
            inline: true,
          },
          {
            name: 'Update runtime',
            value: `${duration.toFixed(1)} seconds`,
            inline: true,
          },
        ],
        footer: {
          text: `Run #${environment.GITHUB_RUN_NUMBER} • admin preview`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

export const sendDiscordSummary = async (
  environment: NodeJS.ProcessEnv = process.env
) => {
  if (!environment.DISCORD_ADMIN_WEBHOOK_URL) {
    console.log(
      'DISCORD_ADMIN_WEBHOOK_URL is not configured; skipping announcement.'
    )
    return false
  }

  const response = await fetch(environment.DISCORD_ADMIN_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildDiscordPayload(environment)),
  })
  if (!response.ok) {
    throw new Error(
      `Discord webhook failed: ${response.status} ${response.statusText}`
    )
  }
  return true
}

if (import.meta.url === `file://${process.argv[1]}`) {
  sendDiscordSummary().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
