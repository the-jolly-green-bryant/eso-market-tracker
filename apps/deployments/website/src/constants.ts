export const API_HOSTNAME = 'https://api.esomarkettracker.com'
// export const API_HOSTNAME = 'http://127.0.0.1:8000'
export const API_GRAPHQL_ENDPOINT = `${API_HOSTNAME}/graphql/`
export const API_SHARE_ENDPOINT = `${API_HOSTNAME.replace('api', 'buy')}/share`

export const getShareLink = (itemSlug: string) =>
  `${API_SHARE_ENDPOINT}/item/${itemSlug}`

export const PLATFORM_XBOX = 'xbox'

export const PATREON_LINK = 'https://discord.gg/ZbRPf4gHYX'
export const REDDIT_LINK = 'https://www.reddit.com/r/ESOMarketTracker/'

export const REPORT_A_BUG_LINK =
  'https://discord.com/channels/1113929923518791781/1113930258572378122'

export const SITE_DESCRIPTION =
  "Fight, loot, and profit with Elder Scrolls Online's only full-featured trading utility app."
export const SITE_TITLE = 'ESO Market Tracker'
export const SITE_TITLE_PREFIXED = `${SITE_TITLE} - `

export const getFullPageTitle = (simpleTitle: string) =>
  `${SITE_TITLE_PREFIXED}${simpleTitle}`

export const SENTRY_ENVIRONMENT = 'LOCALHOST'
