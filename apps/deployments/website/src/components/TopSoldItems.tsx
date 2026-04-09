import { useQuery } from '@apollo/client'

import LoadingSkeleton from '../components/LoadingSkeleton'
import TradableItemList from '../components/TradableItemList'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import './TopSoldItems.scss'
import * as constants from '../constants'
import * as queries from '../models/queries'

interface ContainerProps {
    // pageTitle: string
}

const TopSoldItems: React.FC<ContainerProps> = ({}) => {
    const { loading, error, data } = useQuery(queries.GET_TOP_SELLERS, {
        variables: {
            platform: constants.PLATFORM_XBOX,
        },
    })

    return (
        <div className="top-sold-items">
            {/*<div className="top-sold-items-header">Top Selling Items</div>*/}

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
                <TradableItemList items={data.topSellingTradableItems} />
            )}
        </div>
    )
}

export default TopSoldItems
