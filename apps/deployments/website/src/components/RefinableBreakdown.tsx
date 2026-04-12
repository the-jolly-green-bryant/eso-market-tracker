import { useQuery } from '@apollo/client'
import { IonIcon } from '@ionic/react'
import { cashOutline } from 'ionicons/icons'
import TradableItemReference from '../components/TradableItemReference'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'

import { CraftableCostBreakdownType } from '../models/craftable-item-types'
import * as queries from '../models/queries'
import './TradableItem.scss'

interface ContainerProps {
  slug: string
}

const RefinableBreakdown: React.FC<ContainerProps> = ({ slug }) => {
  const { loading, data } = useQuery<{
    craftableCostBreakdown: CraftableCostBreakdownType
  }>(queries.GET_CRAFTABLE_COST_BREAKDOWN, { variables: { slugs: [slug] } })

  const forceLoading = false

  return (
    <div className="craftable-breakdown">
      <div className="page-container-section-label">Refining Breakdown</div>

      <div>
        <div className="tradable-item-stat-container">
          <div className="tradable-item-stat-icon">
            <IonIcon icon={cashOutline}></IonIcon>
          </div>
          <div className="tradable-item-stat-label">Value of Refining</div>

          <div className={`tradable-item-stat-value`}>
            {data && !forceLoading
              ? data.craftableCostBreakdown.totalCost.toLocaleString()
              : 'Calculating...'}
          </div>
        </div>

        {(loading || forceLoading) && (
          <div>
            <TradableItemReferenceSkeleton />
            <TradableItemReferenceSkeleton />
            <TradableItemReferenceSkeleton />
          </div>
        )}

        {data &&
          !forceLoading &&
          data.craftableCostBreakdown.requirements.map((requirement) => (
            <TradableItemReference
              key={requirement.item.slug}
              item={requirement.item}
              disableClick={true}
              itemDescriptor={`x${requirement.quantity}`}
            />
          ))}
      </div>
    </div>
  )
}

export default RefinableBreakdown
