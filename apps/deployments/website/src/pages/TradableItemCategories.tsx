import { useQuery } from '@apollo/client'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItemCategoryReference from '../components/TradableItemCategoryReference'
import { TradableItemCategoryReferenceType } from '../models/tradable-item-types'

import * as queries from '../models/queries'

const TradableItemCategories: React.FC = () => {
    const { loading, error, data } = useQuery<{
        tradableItemCategories: TradableItemCategoryReferenceType[]
    }>(queries.GET_CATEGORIES)

    return (
        <PageContainer pageTitle="TradableItemCategories">
            {loading ? (
                <LoadingSkeleton error={false} />
            ) : error ? (
                <LoadingSkeleton error={true} />
            ) : (
                <div className="page-container-list">
                    {data &&
                        data.tradableItemCategories.map((category) => {
                            return (
                                <TradableItemCategoryReference
                                    category={category}
                                />
                            )
                        })}
                </div>
            )}
        </PageContainer>
    )
}

export default TradableItemCategories
