export const index = () => '/'
export const dashboard = () => '/dashboard'
export const about = () => '/about'
export const report = () => '/report-a-bug'

export const item = () => '/item'
export const getItem = (slug: string) => `${item()}/${slug}`

export const trend = () => '/trend'
export const getTrend = (slug: string) => `${trend()}/${slug}`

export const categories = () => '/categories'
export const category = () => '/category'
export const getCategory = (slug: string) => `${category()}/${slug}`

export const searchResults = () => '/search-results'
export const getSearchResults = (text: string) =>
  `${dashboard()}/${encodeURIComponent(text)}`

export const writCostCalculator = () => '/writ-cost-calculator'

export const termsAndConditions = () => '/terms-and-conditions'
export const privacyPolicy = () => '/privacy-policy'

export const authorizedDevelopers = () => `/authorized-developers`

export const appStats = () => `/app-stats`
export const tamrielSavingsAlternative = () =>
  '/tamriel-savings-price-checker'
