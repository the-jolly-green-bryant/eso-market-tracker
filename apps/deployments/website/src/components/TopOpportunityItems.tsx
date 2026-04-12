import { useQuery } from '@apollo/client'

import LoadingSkeleton from '../components/LoadingSkeleton'
import TradableItemList from '../components/TradableItemList'
import './TopOpportunityItems.scss'
import * as constants from '../constants'
import * as queries from '../models/queries'
import { LOADING_STATE } from './common'

export default () => {
  const { loading, error, data } = useQuery(queries.GET_TOP_RISING, {
    variables: {
      platform: constants.PLATFORM_XBOX,
    },
  })

  return (
    <div className="top-opportunity-items">
      {loading && LOADING_STATE}

      {error && <LoadingSkeleton error={true} />}

      {!loading && !error && (
        <TradableItemList items={data.topRisingTradableItems} />
      )}
    </div>
  )
}
