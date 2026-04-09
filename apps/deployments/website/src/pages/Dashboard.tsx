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
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'

import * as queries from '../models/queries'
import * as constants from '../constants'
import * as routes from '../routes'

const Dashboard: React.FC = () => {
    const [topSellingTab, topOpportunityTab] = [
        'top_selling',
        'top_opportunities',
    ]
    const history = useHistory()

    const abortController = useRef<AbortController>()
    const { text } = useParams<{ text: string | undefined }>()
    const [currentSearch, setCurrentSearch] = useState(text ? text : '')
    const [currentTab, setCurrentTab] = useState(topSellingTab)

    const limit = 20
    const [getSearchResults, { loading, error, data, fetchMore }] =
        useLazyQuery(queries.SEARCH_ITEMS, {
            variables: { search: currentSearch, offset: 0, limit: limit },
            context: {
                fetchOptions: {
                    signal: abortController?.current?.signal,
                },
            },
        })

    const onPerformSearch = (searchText: string) => {
        // Update our history (and URL) if we changed the search text.
        const currentPath = history.location.pathname
        const newPath = routes.getSearchResults(searchText)
        if (currentPath !== newPath) {
            history.replace(newPath)
        }

        setCurrentSearch(searchText)
        abortController.current && abortController.current.abort()
        const controller = new window.AbortController()
        abortController.current = controller
        getSearchResults({
            variables: { search: searchText, offset: 0, limit: limit },
            context: {
                fetchOptions: {
                    signal: controller.signal,
                },
            },
        })
    }

    const onSearchClear = () => {
        const currentPath = history.location.pathname
        const newPath = `${routes.dashboard()}/`
        if (currentPath !== newPath) {
            history.replace(newPath)
            onPerformSearch('')
        }
    }

    useEffect(() => {
        if (text) {
            onPerformSearch(text)
        }
    }, [])

    const loadMoreData = async (isInView: boolean) => {
        if (isInView) {
            await fetchMore({
                variables: {
                    offset: data.tradableItems.length,
                    limit: limit,
                },
            })
        }
    }

    return (
        <PageContainer
            pageTitle="ESO Market Tracker"
            metaTitle={
                currentSearch
                    ? constants.getFullPageTitle(`Search - ${currentSearch}`)
                    : constants.getFullPageTitle('Dashboard')
            }
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

                {currentSearch ? (
                    <div className="page-container-section-label">
                        Results for "{currentSearch}"
                    </div>
                ) : (
                    <div className="page-container-section-label is-option-label">
                        <div
                            className={`page-container-section-label-option ${
                                currentTab === topSellingTab ? 'is-active' : ''
                            }`}
                            onClick={() => {
                                setCurrentTab(topSellingTab)
                            }}
                        >
                            Top Selling Items
                        </div>

                        <div
                            className={`page-container-section-label-option ${
                                currentTab === topOpportunityTab
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() => {
                                setCurrentTab(topOpportunityTab)
                            }}
                        >
                            Top Rising Items
                        </div>
                    </div>
                )}
            </div>

            <div className="page-container-content-header-spacer" />

            {!currentSearch && (
                <div>
                    {currentTab === topSellingTab ? (
                        <TopSoldItems />
                    ) : currentTab === topOpportunityTab ? (
                        <TopOpportunityItems />
                    ) : null}
                    {/* Future Versions will include watched items here. */}
                </div>
            )}

            {currentSearch && loading ? (
                <div>
                    <LoadingSkeleton error={false}>
                        <div>
                            <TradableItemReferenceSkeleton />
                            <TradableItemReferenceSkeleton />
                            <TradableItemReferenceSkeleton />
                        </div>
                    </LoadingSkeleton>
                </div>
            ) : currentSearch && error ? (
                <div className="page-container-content-header-negative-spacer">
                    <LoadingSkeleton error={true} />
                </div>
            ) : currentSearch && data && data.tradableItems.length ? (
                <div>
                    <TradableItemList items={data.tradableItems} />
                    <InView onChange={loadMoreData} />
                </div>
            ) : currentSearch && data && !data.tradableItems.length ? (
                <div className="page-container-content-header-negative-spacer">
                    <LoadingSkeleton
                        error={false}
                        loading={false}
                        title="No Results!"
                        message={`No results could be found. Please try a different search term.`}
                    />
                </div>
            ) : null}
        </PageContainer>
    )
}

export default Dashboard
