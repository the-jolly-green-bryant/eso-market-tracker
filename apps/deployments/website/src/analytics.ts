export const GA_MEASUREMENT_ID = 'G-TDF0N39ZPL'

type AnalyticsParameters = Record<string, unknown>

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event',
      target: string,
      parameters?: AnalyticsParameters
    ) => void
  }
}

const sendEvent = (name: string, parameters?: AnalyticsParameters) => {
  if (
    typeof window === 'undefined' ||
    !window.gtag ||
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    return
  }
  window.gtag('event', name, parameters)
}

let previousPagePath: string | undefined

export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (pagePath === previousPagePath) return
  previousPagePath = pagePath
  sendEvent('page_view', {
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  })
}

export const trackSearch = (searchTerm: string, resultCount: number) => {
  const normalized = searchTerm.trim().slice(0, 100)
  if (!normalized) return
  sendEvent('search', {
    search_term: normalized,
    result_count: resultCount,
  })
}

export const trackItemView = (item: {
  slug: string
  displayLabel: string
  category?: string
  price?: number
}) =>
  sendEvent('view_item', {
    market_price_gold: item.price,
    items: [
      {
        item_id: item.slug,
        item_name: item.displayLabel,
        item_category: item.category,
      },
    ],
  })

export const trackItemSelection = (
  item: { slug: string; displayLabel: string },
  itemListName: string
) =>
  sendEvent('select_item', {
    item_list_name: itemListName,
    items: [{ item_id: item.slug, item_name: item.displayLabel }],
  })

export const trackCategoryView = (category: string, resultCount: number) =>
  sendEvent('view_item_list', {
    item_list_id: category,
    item_list_name: category,
    result_count: resultCount,
  })
