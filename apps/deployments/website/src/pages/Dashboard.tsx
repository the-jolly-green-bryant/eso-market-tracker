import { useEffect, useState, useRef } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import SearchBar from '../components/SearchBar'
import TopSoldItems from '../components/TopSoldItems'
import TradableItemList from '../components/TradableItemList'

import * as constants from '../constants'
import * as routes from '../routes'
import { ERROR_STATE, LOADING_STATE } from '../components/common'
import { __useSearch } from './useItem'

const [TOP_SELLING_TAB] = ['top_selling']

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

const _renderTabs = () => (
  <div className="page-container-section-label is-option-label">
    {[['Top Selling Items', TOP_SELLING_TAB]].map(([label, _]) => (
      <div className={`page-container-section-label-option is-active`}>
        {label}
      </div>
    ))}
  </div>
)

const useSearch = (text?: string) => {
  const history = useHistory()
  const abortController = useRef<AbortController>()
  const [currentSearch, setCurrentSearch] = useState(text || '')
  const { loading, error, data } = __useSearch(currentSearch)

  const onPerformSearch = (searchText: string) => {
    // Update our history (and URL) if we changed the search text.
    const currentPath = history.location.pathname
    const newPath = routes.getSearchResults(searchText)
    currentPath !== newPath && history.replace(newPath)
    setCurrentSearch(searchText)
    abortController.current && abortController.current.abort()
    const controller = new window.AbortController()
    abortController.current = controller
  }

  return {
    abortController,
    loading,
    error,
    data,
    onPerformSearch,
    currentSearch,
    setCurrentSearch,
  }
}

export default () => {
  const history = useHistory()
  const { text } = useParams<{ text: string | undefined }>()
  const { loading, error, data, onPerformSearch, currentSearch } =
    useSearch(text)

  const onSearchClear = () => {
    const newPath = `${routes.dashboard()}/`
    return (
      history.location.pathname != newPath &&
      (history.replace(newPath), onPerformSearch(''))
    )
  }

  useEffect(() => {
    text && onPerformSearch(text)
  }, [])

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

        {!currentSearch && _renderTabs()}
      </div>

      <div className="page-container-content-header-spacer" />

      {!currentSearch && (
        <div>
          <TopSoldItems />
        </div>
      )}

      {currentSearch && loading && LOADING_STATE}
      {currentSearch && error && ERROR_STATE}
      {currentSearch && data && data.length && (
        <div>
          <TradableItemList items={data} />
        </div>
      )}

      {currentSearch && data && !data.length && NO_RESULTS_STATE}
    </PageContainer>
  )
}
