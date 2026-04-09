export const index = () => '/'
export const dashboard = () => '/dashboard'
export const about = () => '/about'
export const report = () => '/report-a-bug'

export const item = () => '/item'
export const getItem = (slug: string) => {
    return `${item()}/${slug}`
}

export const guild = () => '/guild'
export const getGuild = (accessKey: string) => {
    return `${guild()}/${accessKey}`
}

export const trend = () => '/trend'
export const getTrend = (slug: string) => {
    return `${trend()}/${slug}`
}

export const categories = () => '/categories'
export const category = () => '/category'
export const getCategory = (slug: string) => {
    return `${category()}/${slug}`
}

export const searchResults = () => '/search-results'
export const getSearchResults = (text: string) => {
    return `${dashboard()}/${encodeURIComponent(text)}`
}

export const writCostCalculator = () => '/writ-cost-calculator'

export const termsAndConditions = () => '/terms-and-conditions'
export const privacyPolicy = () => '/privacy-policy'

export const authorizedDevelopers = () => `/authorized-developers`

export const appStats = () => `/app-stats`
