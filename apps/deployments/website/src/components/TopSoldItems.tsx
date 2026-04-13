import { useQuery } from '@apollo/client'

import LoadingSkeleton from '../components/LoadingSkeleton'
import TradableItemList from '../components/TradableItemList'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import './TopSoldItems.scss'
import { __useCategory } from '../pages/useItem'

const TopSoldItems: React.FC = () => {
  const { loading, error, data } = __useCategory('Mats (Gold)')

  return (
    <div className="top-sold-items">
      {loading && (
        <LoadingSkeleton error={false}>
          <div>
            <TradableItemReferenceSkeleton />
            <TradableItemReferenceSkeleton />
            <TradableItemReferenceSkeleton />
          </div>
        </LoadingSkeleton>
      )}

      {error && <LoadingSkeleton error={true} />}

      {!loading && !error && data && <TradableItemList items={data} />}
    </div>
  )
}

export default TopSoldItems
