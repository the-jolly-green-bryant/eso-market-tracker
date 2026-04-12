import { useLazyQuery } from '@apollo/client'
import { useEffect, useState, useRef } from 'react'
import { InView } from 'react-intersection-observer'
import { useParams, useHistory } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import SearchBar from '../components/SearchBar'
import TopOpportunityItems from '../components/TopOpportunityItems'
import TopSoldItems from '../components/TopSoldItems'
import TradableItemList from '../components/TradableItemList'

import * as queries from '../models/queries'
import * as constants from '../constants'
import * as routes from '../routes'
import { ERROR_STATE, LOADING_STATE } from '../components/common'

const [TOP_SELLING_TAB, TOP_OPP_TAB] = ['top_selling', 'top_opportunities']
const limit = 20

const NO_RESULTS_STATE = (
  <div className="page-container-content-header-negative-spacer">
    <LoadingSkeleton
      error={false}
      loading={false}
      title="No Results!"
      message={`No results could be found. Please try a different search term.`}
    />
  </div>
)

const _renderTabs = (
  currentTab: string,
  setCurrentTab: (arg0: string) => void
) => (
  <div className="page-container-section-label is-option-label">
    {[
      ['Top Selling Items', TOP_SELLING_TAB],
      ['Top Rising Items', TOP_OPP_TAB],
    ].map(([label, slug]) => (
      <div
        className={`page-container-section-label-option ${
          currentTab === slug && 'is-active'
        }`}
        onClick={() => setCurrentTab(slug)}
      >
        {label}
      </div>
    ))}
  </div>
)

const useSearch = (text?: string) => {
  const history = useHistory()
  const abortController = useRef<AbortController>()
  const [currentSearch, setCurrentSearch] = useState(text || '')
  const [getSearchResults, { loading, error, data, fetchMore }] = useLazyQuery(
    queries.SEARCH_ITEMS,
    {
      variables: { search: currentSearch, offset: 0, limit },
      context: { fetchOptions: { signal: abortController?.current?.signal } },
    }
  )

  const onPerformSearch = (searchText: string) => {
    // Update our history (and URL) if we changed the search text.
    const currentPath = history.location.pathname
    const newPath = routes.getSearchResults(searchText)
    currentPath !== newPath && history.replace(newPath)
    setCurrentSearch(searchText)
    abortController.current && abortController.current.abort()
    const controller = new window.AbortController()
    abortController.current = controller
    return getSearchResults({
      variables: { search: searchText, offset: 0, limit },
      context: { fetchOptions: { signal: controller.signal } },
    })
  }

  return {
    abortController,
    getSearchResults,
    loading,
    error,
    data,
    fetchMore,
    onPerformSearch,
    currentSearch,
    setCurrentSearch,
  }
}

export default () => {
  const history = useHistory()
  const { text } = useParams<{ text: string | undefined }>()
  const [currentTab, setCurrentTab] = useState(TOP_SELLING_TAB)
  const { loading, error, data, fetchMore, onPerformSearch, currentSearch } =
    useSearch(text)

  const onSearchClear = () => {
    const newPath = `${routes.dashboard()}/`
    return (
      history.location.pathname != newPath &&
      (history.replace(newPath), void onPerformSearch(''))
    )
  }

  useEffect(() => {
    text && void onPerformSearch(text)
  }, [])

  const loadMoreData = async (isInView: boolean) =>
    isInView &&
    fetchMore({
      variables: { offset: data.tradableItems.length, limit },
    })

  return (
    <PageContainer
      pageTitle="ESO Market Tracker"
      metaTitle={constants.getFullPageTitle(
        currentSearch ? `Search - ${currentSearch}` : 'Dashboard'
      )}
      metaDescription={
        currentSearch
          ? `View search results for the term "${currentSearch}".`
          : 'View top selling items or search for a specific item.'
      }
    >
      <div className="page-container-content-header">
        <SearchBar
          text={text}
          searchCallback={onPerformSearch}
          onClear={onSearchClear}
        />

        {currentSearch && (
          <div className="page-container-section-label">
            Results for "{currentSearch}"
          </div>
        )}

        {!currentSearch && _renderTabs(currentTab, setCurrentTab)}
      </div>

      <div className="page-container-content-header-spacer" />

      {!currentSearch && (
        <div>
          {currentTab === TOP_SELLING_TAB && <TopSoldItems />}
          {currentTab === TOP_OPP_TAB && <TopOpportunityItems />}
        </div>
      )}

      {currentSearch && loading && LOADING_STATE}
      {currentSearch && error && ERROR_STATE}
      {currentSearch && data && data.tradableItems.length && (
        <div>
          <TradableItemList items={data.tradableItems} />
          <InView onChange={loadMoreData} />
        </div>
      )}

      {currentSearch && data && !data.tradableItems.length && NO_RESULTS_STATE}
    </PageContainer>
  )
}
