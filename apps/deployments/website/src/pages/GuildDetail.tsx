import { useQuery, useLazyQuery } from '@apollo/client'
import { albumsOutline } from 'ionicons/icons'
import { useEffect, useState, useRef } from 'react'
import { useLocation, useParams, useHistory } from 'react-router-dom'

import InlineDateRangePicker from '../components/InlineDateRangePicker'
import InlineMultiSelect from '../components/InlineMultiSelect'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ModalToggle from '../components/ModalToggle'
import PageContainer from '../components/PageContainer'
import ReferenceBlock from '../components/ReferenceBlock'
import SearchBar from '../components/SearchBar'
import { GuildType, CategoryBreakdownType } from '../models/tradable-item-types'
import * as queries from '../models/queries'
import * as constants from '../constants'
import * as routes from '../routes'

import '../components/TradableItem.scss'

const GuildDetail: React.FC = () => {
    const history = useHistory()
    const abortController = useRef<AbortController>()

    const { guildAccessKey } = useParams<{
        guildAccessKey: string | undefined
    }>()
    const [currentSearch, setCurrentSearch] = useState(
        guildAccessKey ? guildAccessKey : '',
    )

    const [sortByValue, setSortByValue] = useState(false)
    const [selectedStoreSlugs, setSelectedStoreSlugs] = useState<string[]>([])
    const [startDate, setStartDate] = useState<string | null>(null)
    const [endDate, setEndDate] = useState<string | null>(null)

    const [
        getGuild,
        { loading: guildLoading, error: guildError, data: guildData },
    ] = useLazyQuery<{
        obfuscatedGuild: GuildType
    }>(queries.GET_GUILD, {
        variables: { guildAccessKey: currentSearch },
        context: {
            fetchOptions: {
                signal: abortController?.current?.signal,
            },
        },
        onCompleted: (data) => {
            let allStoreSlugs: string[] = []
            data.obfuscatedGuild.zones!.forEach((zone) => {
                allStoreSlugs = allStoreSlugs.concat(
                    zone.stores!.map((store) => {
                        return store.slug!
                    }),
                )
            })

            onInitializeSearch(
                allStoreSlugs,
                data.obfuscatedGuild.firstSaleDate!,
                data.obfuscatedGuild.lastSaleDate!,
            )
        },
    })

    const onInitializeSearch = (
        slugs: string[],
        newStartDate: string,
        newEndDate: string,
    ) => {
        setStartDate(newStartDate)
        setEndDate(newEndDate)
        setSelectedStoreSlugs(slugs)

        abortController.current && abortController.current.abort()
        const controller = new window.AbortController()
        abortController.current = controller
        getGuildBreakdown({
            variables: {
                storeSlugs: slugs,
                startDate: newStartDate,
                endDate: newEndDate,
            },
            context: {
                fetchOptions: {
                    signal: controller.signal,
                },
            },
        })
    }

    const onPerformSearch = (searchText: string) => {
        // Update our history (and URL) if we changed the search text.
        const currentPath = history.location.pathname
        const newPath = routes.getGuild(searchText)
        if (currentPath !== newPath) {
            history.replace(newPath)
        }

        setCurrentSearch(searchText)
        abortController.current && abortController.current.abort()
        const controller = new window.AbortController()
        abortController.current = controller
        getGuild({
            variables: { guildAccessKey: searchText },
            context: {
                fetchOptions: {
                    signal: controller.signal,
                },
            },
        })
    }

    const onSearchClear = () => {
        const currentPath = history.location.pathname
        const newPath = `${routes.guild()}/`
        if (currentPath !== newPath) {
            history.replace(newPath)
            onPerformSearch('')
        }
    }

    useEffect(() => {
        if (guildAccessKey) {
            onPerformSearch(guildAccessKey)
        }
    }, [])

    const [
        getGuildBreakdown,
        {
            loading: breakdownLoading,
            error: breakdownError,
            data: breakdownData,
        },
    ] = useLazyQuery<{
        obfuscatedGuildCategoryBreakdown: CategoryBreakdownType
    }>(queries.GET_GUILD_BREAKDOWN, {
        variables: {
            guildAccessKey: currentSearch,
            storeSlugs: selectedStoreSlugs,
            sortByValue: sortByValue,
            startDate: startDate,
            endDate: endDate,
        },
        context: {
            fetchOptions: {
                signal: abortController?.current?.signal,
            },
        },
    })

    const onUpdateSelectedStoreSlugs = (slugs: string[]) => {
        const differentSlugs = selectedStoreSlugs
            .filter((x) => !slugs.includes(x))
            .concat(slugs.filter((x) => !selectedStoreSlugs.includes(x)))
        console.log('differentSlugs', differentSlugs)
        if (!differentSlugs.length) {
            // We may have just re-ordered things, but the slugs are the same.
            return
        }

        setSelectedStoreSlugs(slugs)
        abortController.current && abortController.current.abort()
        const controller = new window.AbortController()
        abortController.current = controller
        getGuildBreakdown({
            variables: { storeSlugs: slugs },
            context: {
                fetchOptions: {
                    signal: controller.signal,
                },
            },
        })
    }

    const onUpdateSortByValue = (shouldSort: boolean) => {
        if (shouldSort == sortByValue) {
            // We already have this value displayed.
            return
        }

        setSortByValue(shouldSort)
        abortController.current && abortController.current.abort()
        const controller = new window.AbortController()
        abortController.current = controller
        getGuildBreakdown({
            variables: {
                storeSlugs: selectedStoreSlugs,
                sortByValue: shouldSort,
            },
            context: {
                fetchOptions: {
                    signal: controller.signal,
                },
            },
        })
    }

    const onUpdateDates = (newStartDate: string, newEndDate: string) => {
        if (startDate == newStartDate && endDate == newEndDate) {
            // We're already displaying this date range.
            return
        }

        setStartDate(newStartDate)
        setEndDate(newEndDate)
        abortController.current && abortController.current.abort()
        const controller = new window.AbortController()
        abortController.current = controller
        getGuildBreakdown({
            variables: {
                storeSlugs: selectedStoreSlugs,
                sortByValue: sortByValue,
                startDate: newStartDate,
                endDate: newEndDate,
            },
            context: {
                fetchOptions: {
                    signal: controller.signal,
                },
            },
        })
    }

    return (
        <PageContainer pageTitle="Guild Lookup">
            <SearchBar
                text={currentSearch}
                searchCallback={onPerformSearch}
                onClear={onSearchClear}
                placeholderText="Enter Access Key..."
            />

            {(guildLoading || !currentSearch) && (
                <LoadingSkeleton
                    isInline={true}
                    error={false}
                    loading={false}
                    title="Privacy Matters!"
                    message={`Your guild's data is only accessible to users bearing your guild's access key. Enter that access key above.`}
                />
            )}

            {!guildLoading && guildError && currentSearch && (
                <LoadingSkeleton
                    isInline={true}
                    error={true}
                    loading={false}
                    title="Access Key Not Found!"
                    message={`A guild with the access key '${currentSearch}' could not be found.`}
                />
            )}

            {guildData && breakdownLoading && (
                <LoadingSkeleton
                    isInline={true}
                    error={false}
                    loading={false}
                    title="Loading Your Data!"
                    message={`We are loading your guild's sales data. Please give us a moment.`}
                />
            )}

            {guildData && breakdownData && (
                <div className="tradable-item">
                    <InlineMultiSelect
                        label="Traders"
                        defaultValues={selectedStoreSlugs}
                        placeholder="Traders to include..."
                        onChange={(newValues: string[]) => {
                            console.log('newValues', newValues)
                            onUpdateSelectedStoreSlugs(newValues)
                        }}
                        options={guildData.obfuscatedGuild
                            .zones!.map((zone) => {
                                // TODO - Actually return store slugs
                                return zone.stores!.map((store) => {
                                    return {
                                        value: store.slug!,
                                        label: store.label!,
                                        group: zone.label!,
                                    }
                                })
                            })
                            .flat(1)}
                    />

                    <InlineDateRangePicker
                        label="Date Range"
                        startDate={startDate!}
                        endDate={endDate!}
                        onChange={(newStartDate, newEndDate) => {
                            console.log('new dates', newStartDate, newEndDate)
                            onUpdateDates(newStartDate, newEndDate)
                        }}
                    />

                    <div className="tradable-item-header has-no-graph">
                        <div
                            className={`tradable-item-header-stat-container ${
                                !sortByValue
                                    ? 'is-highlighted'
                                    : 'is-not-highlighted'
                            }`}
                            onClick={() => {
                                onUpdateSortByValue(false)
                            }}
                        >
                            <div className="tradable-item-header-title">
                                Total Sales
                            </div>

                            <div className="tradable-item-header-price">
                                {Math.round(
                                    breakdownData
                                        .obfuscatedGuildCategoryBreakdown
                                        .grandSales,
                                ).toLocaleString()}
                            </div>
                        </div>

                        <div
                            className={`tradable-item-header-stat-container is-secondary ${
                                sortByValue
                                    ? 'is-highlighted'
                                    : 'is-not-highlighted'
                            }`}
                            onClick={() => {
                                onUpdateSortByValue(true)
                            }}
                        >
                            <div className="tradable-item-header-title">
                                Total Value
                            </div>

                            <div className="tradable-item-header-price">
                                {Math.round(
                                    breakdownData
                                        .obfuscatedGuildCategoryBreakdown
                                        .grandValue,
                                ).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="tradable-item-content-section is-simple">
                            <div className="tradable-item-content-section-header">
                                Top Selling Categories (By{' '}
                                {!sortByValue ? 'Sales' : 'Value'})
                            </div>
                        </div>

                        <div className="tradable-item-content-section">
                            <div className="tradable-item-list">
                                {breakdownData.obfuscatedGuildCategoryBreakdown.categories.map(
                                    (categoryBreakdown, index) => {
                                        return (
                                            <ModalToggle
                                                key={`category_breakdown_${index}`}
                                                title={categoryBreakdown.label}
                                                toggle={
                                                    <ReferenceBlock
                                                        label={
                                                            categoryBreakdown.label
                                                        }
                                                        primaryText={
                                                            sortByValue
                                                                ? `Value: ${categoryBreakdown.totalValue.toLocaleString()} (${Math.round(
                                                                      categoryBreakdown.percentageOfGrandValue *
                                                                          100,
                                                                  )}%)`
                                                                : `Sales: ${categoryBreakdown.totalSales.toLocaleString()} (${Math.round(
                                                                      categoryBreakdown.percentageOfGrandSales *
                                                                          100,
                                                                  )}%)`
                                                        }
                                                        secondaryText={
                                                            !sortByValue
                                                                ? `Value: ${categoryBreakdown.totalValue.toLocaleString()} (${Math.round(
                                                                      categoryBreakdown.percentageOfGrandValue *
                                                                          100,
                                                                  )}%)`
                                                                : `Sales: ${categoryBreakdown.totalSales.toLocaleString()} (${Math.round(
                                                                      categoryBreakdown.percentageOfGrandSales *
                                                                          100,
                                                                  )}%)`
                                                        }
                                                        missingIcon={
                                                            albumsOutline
                                                        }
                                                    />
                                                }
                                            >
                                                <div className="modal-toggle-modal-content-locked-header">
                                                    <div className="tradable-item-header has-no-graph">
                                                        <div
                                                            className={`tradable-item-header-stat-container ${
                                                                !sortByValue
                                                                    ? 'is-highlighted'
                                                                    : 'is-not-highlighted'
                                                            }`}
                                                        >
                                                            <div className="tradable-item-header-title">
                                                                Total Sales
                                                            </div>

                                                            <div className="tradable-item-header-price">
                                                                {Math.round(
                                                                    categoryBreakdown.totalSales,
                                                                ).toLocaleString()}
                                                            </div>
                                                        </div>

                                                        <div
                                                            className={`tradable-item-header-stat-container is-secondary ${
                                                                sortByValue
                                                                    ? 'is-highlighted'
                                                                    : 'is-not-highlighted'
                                                            }`}
                                                        >
                                                            <div className="tradable-item-header-title">
                                                                Total Value
                                                            </div>

                                                            <div className="tradable-item-header-price">
                                                                {Math.round(
                                                                    categoryBreakdown.totalValue,
                                                                ).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="tradable-item-content-section-header">
                                                        Top{' '}
                                                        {
                                                            categoryBreakdown
                                                                .topItems.length
                                                        }{' '}
                                                        Selling Items (By{' '}
                                                        {!sortByValue
                                                            ? 'Sales'
                                                            : 'Value'}
                                                        )
                                                    </div>
                                                </div>

                                                <div className="tradable-item-list modal-toggle-modal-content-locked-header-content">
                                                    {categoryBreakdown.topItems.map(
                                                        (item, item_index) => {
                                                            return (
                                                                <ReferenceBlock
                                                                    key={`category_breakdown_${index}_item_${item_index}`}
                                                                    label={
                                                                        item.label
                                                                    }
                                                                    primaryText={
                                                                        sortByValue
                                                                            ? `Value: ${item.totalValue.toLocaleString()}`
                                                                            : `Sales: ${item.totalSales.toLocaleString()}`
                                                                    }
                                                                    secondaryText={
                                                                        !sortByValue
                                                                            ? `Value: ${item.totalValue.toLocaleString()}`
                                                                            : `Sales: ${item.totalSales.toLocaleString()}`
                                                                    }
                                                                    // missingIcon={
                                                                    //     albumsOutline
                                                                    // }
                                                                />
                                                            )
                                                        },
                                                    )}
                                                </div>
                                            </ModalToggle>
                                        )
                                    },
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    )
}

export default GuildDetail
