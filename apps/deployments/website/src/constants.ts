export const API_HOSTNAME = 'https://api.esomarkettracker.com'
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

export const CATEGORIES = {
  'Mats (Gold)': [
    'Dreugh Wax',
    'Kuta',
    'Rosin',
    'Tempering Alloy',
    'Aetherial Dust',
    'Diminished Aetherial Dust',
    'Perfect Roe',
  ],
  'Mats (Blacksmithing)': [
    'Calcinium Ingot',
    'Calcinium Ore',
    'Dwarven Ingot',
    'Dwarven Oil',
    'Dwarven Ore',
    'Ebony Ore',
    'Galatite Ingot',
    'Galatite Ore',
    'Grain Solvent',
    'High Iron Ore',
    'Honing Stone',
    'Iron Ingot',
    'Iron Ore',
    'Orichalcum Ingot',
    'Orichalcum Ore',
    'Quicksilver Ingot',
    'Rubedite Ingot',
    'Rubedite Ore',
    'Steel Ingot',
    'Voidstone Ore',
  ],
  'Mats (Clothing)': [
    'Ancestor Silk',
    'Cotton',
    'Ebonthread',
    'Elegant Lining',
    'Embroidery',
    'Fell Hide',
    'Fell Hide Scraps',
    'Flax',
    'Hemming',
    'Hide',
    'Hide Scraps',
    'Iron Hide',
    'Iron Hide Scraps',
    'Ironthread',
    'Jute',
    'Kresh Fiber',
    'Leather',
    'Leather Scraps',
    'Raw Ancestor Silk',
    'Raw Cotton',
  ],
}
