import { useQuery } from '@apollo/client'
import { IonIcon } from '@ionic/react'
import {
    removeOutline,
    addOutline,
    swapHorizontalOutline,
    fileTrayStackedOutline,
    cashOutline,
    openOutline,
    star,
} from 'ionicons/icons'
import { useState, useEffect } from 'react'
import LoadingSkeleton from '../components/LoadingSkeleton'
import LocalImage from '../components/LocalImage'
import PlaceholderImage from '../components/PlaceholderImage'
import SalesChart from '../components/SalesChart'
import TradableItemReference from '../components/TradableItemReference'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'

import {
    TradableItemType,
    SalesRollupType,
} from '../models/tradable-item-types'
import {
    CraftableCategoryWithItemsType,
    CraftableCostBreakdownType,
    CraftableItemReferenceType,
    CraftableSchemaReferenceType,
    CraftableSchemaWithCategoriesType,
} from '../models/craftable-item-types'
import * as queries from '../models/queries'
import './TradableItem.scss'

interface ContainerProps {
    slug: string
}

const RefinableBreakdown: React.FC<ContainerProps> = ({ slug }) => {
    const { loading, error, data } = useQuery<{
        craftableCostBreakdown: CraftableCostBreakdownType
    }>(queries.GET_CRAFTABLE_COST_BREAKDOWN, { variables: { slugs: [slug] } })

    const forceLoading = false

    return (
        <div className="craftable-breakdown">
            <div className="page-container-section-label">
                Refining Breakdown
            </div>

            <div>
                <div className="tradable-item-stat-container">
                    <div className="tradable-item-stat-icon">
                        <IonIcon icon={cashOutline}></IonIcon>
                    </div>
                    <div className="tradable-item-stat-label">
                        Value of Refining
                    </div>

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
                    data.craftableCostBreakdown.requirements.map(
                        (requirement) => {
                            return (
                                <TradableItemReference
                                    key={requirement.item.slug}
                                    item={requirement.item}
                                    disableClick={true}
                                    itemDescriptor={`x${requirement.quantity}`}
                                />
                            )
                        },
                    )}
            </div>
        </div>
    )
}

export default RefinableBreakdown
