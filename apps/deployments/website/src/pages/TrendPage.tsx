import { useQuery, useLazyQuery } from '@apollo/client'
import { useEffect, useState, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItem from '../components/TradableItem'
import TradableItemSkeleton from '../components/TradableItemSkeleton'
import Trend from '../components/Trend'
import {
    TradableItemType,
    TradableItemReferenceType,
} from '../models/tradable-item-types'
import * as queries from '../models/queries'
import * as constants from '../constants'

const TrendPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()

    const { loading, error, data } = useQuery(queries.GET_TREND, {
        variables: { slug },
    })

    const [
        getItems,
        { loading: loadingItems, error: itemsError, data: itemsData },
    ] = useLazyQuery(queries.GET_MULTIPLE_ITEMS, {
        variables: { slugs: [] },
    })

    useEffect(() => {
        if (data) {
            getItems({ variables: { slugs: data.trend.itemSlugs } })
        }
    }, [data])

    const pageTitle: string = data ? data.trend.label : null

    return (
        <PageContainer
            pageTitle={pageTitle}
            bleedsIntoHeader={true}
            metaTitle={constants.getFullPageTitle(
                data ? data.trend.label : slug,
            )}
        >
            {loading || loadingItems ? (
                <TradableItemSkeleton />
            ) : error || itemsError ? (
                <LoadingSkeleton error={true} />
            ) : data && itemsData ? (
                <Trend
                    items={itemsData.multipleTradableItems}
                    trend={data.trend}
                />
            ) : (
                <LoadingSkeleton error={true} />
            )}
        </PageContainer>
    )
}

export default TrendPage
