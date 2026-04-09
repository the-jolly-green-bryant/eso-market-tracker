import { useQuery } from '@apollo/client'

import LoadingSkeleton from '../components/LoadingSkeleton'
import TradableItemList from '../components/TradableItemList'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import './TopOpportunityItems.scss'
import * as constants from '../constants'
import * as queries from '../models/queries'

interface ContainerProps {
    // pageTitle: string
}

const TopOpportunityItems: React.FC<ContainerProps> = ({}) => {
    const { loading, error, data } = useQuery(queries.GET_TOP_RISING, {
        variables: {
            platform: constants.PLATFORM_XBOX,
        },
    })

    return (
        <div className="top-opportunity-items">
            {/*<div className="top-sold-items-header">Top Opportunities</div>*/}

            {loading ? (
                <LoadingSkeleton error={false}>
                    <div>
                        <TradableItemReferenceSkeleton />
                        <TradableItemReferenceSkeleton />
                        <TradableItemReferenceSkeleton />
                    </div>
                </LoadingSkeleton>
            ) : error ? (
                <LoadingSkeleton error={true} />
            ) : (
                <TradableItemList items={data.topRisingTradableItems} />
            )}
        </div>
    )
}

export default TopOpportunityItems
