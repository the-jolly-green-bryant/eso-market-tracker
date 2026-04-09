import { useLazyQuery } from '@apollo/client'
import { useEffect, useState, useRef } from 'react'
import { InView } from 'react-intersection-observer'
import { useLocation, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItemCategory from '../components/TradableItemCategory'
import {
    TradableItemCategoryType,
    TradableItemCategoryReferenceType,
} from '../models/tradable-item-types'
import TradableItemList from '../components/TradableItemList'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import * as queries from '../models/queries'
import * as constants from '../constants'

const TradableItemCategoryDetail: React.FC = () => {
    const { state } = useLocation<{
        categoryReference: TradableItemCategoryReferenceType
    }>()
    const { slug } = useParams<{ slug: string }>()

    const categoryReference: TradableItemCategoryReferenceType =
        state?.categoryReference

    const limit = 20
    const [getCategoryItems, { loading, error, data, fetchMore }] =
        useLazyQuery(queries.GET_CATEGORY_ITEMS, {
            variables: { categorySlug: slug, offset: 0, limit: limit },
        })

    useEffect(() => {
        getCategoryItems({
            variables: { categorySlug: slug, offset: 0, limit: limit },
        })
    }, [slug])

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

    const pageTitle: string = categoryReference
        ? categoryReference.displayLabel
        : slug

    return (
        <PageContainer
            pageTitle={pageTitle}
            metaTitle={constants.getFullPageTitle(
                categoryReference ? categoryReference.displayLabel : slug,
            )}
            metaDescription={`View sales information for the category "${
                categoryReference ? categoryReference.displayLabel : slug
            }".`}
        >
            {loading ? (
                <div>
                    <LoadingSkeleton error={false}>
                        <div>
                            <TradableItemReferenceSkeleton />
                            <TradableItemReferenceSkeleton />
                            <TradableItemReferenceSkeleton />
                        </div>
                    </LoadingSkeleton>
                </div>
            ) : error ? (
                <div className="page-container-content-header-negative-spacer">
                    <LoadingSkeleton error={true} />
                </div>
            ) : data && data.tradableItems.length ? (
                <div>
                    <TradableItemList items={data.tradableItems} />
                    <InView onChange={loadMoreData} />
                </div>
            ) : data && !data.tradableItems.length ? (
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

export default TradableItemCategoryDetail
