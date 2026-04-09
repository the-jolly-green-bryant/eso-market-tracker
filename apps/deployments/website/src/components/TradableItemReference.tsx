import { Link } from 'react-router-dom'

import FlatButton from '../components/FlatButton'
import LocalImage from '../components/LocalImage'
import PlaceholderImage from '../components/PlaceholderImage'
import { TradableItemReferenceType } from '../models/tradable-item-types'
import * as routes from '../routes'
import './TradableItemReference.scss'

interface ContainerProps {
    item: TradableItemReferenceType
    displayRange?: boolean
    disableClick?: boolean
    itemDescriptor?: string
}

const TradableItemReference: React.FC<ContainerProps> = ({
    item,
    displayRange = false,
    disableClick = false,
    itemDescriptor = '',
}) => {
    const missingSalesData =
        item.currentXboxStats.totalUnitsSold == item.currentXboxStats.totalSales
    const totalUnitsSold = missingSalesData
        ? item.currentXboxStats.commonQuantity *
          item.currentXboxStats.totalSales
        : Math.max(
              item.currentXboxStats.totalUnitsSold,
              item.currentXboxStats.totalSales,
          )
    const totalSales = item.currentXboxStats.recentSales

    return (
        <div className="tradable-item-reference">
            <FlatButton
                to={
                    disableClick
                        ? undefined
                        : {
                              pathname: routes.getItem(item.slug),
                              state: { itemReference: item },
                          }
                }
            >
                <div className="tradable-item-reference-label-container">
                    <div className="tradable-item-reference-label">
                        {item.displayLabel} {itemDescriptor}
                    </div>

                    <div className="tradable-item-reference-price">
                        Avg. Price:{' '}
                        {Math.round(
                            item.currentXboxStats.averageUnitPrice,
                        ).toLocaleString()}
                    </div>

                    {displayRange ? (
                        <div className="tradable-item-reference-sales">
                            {Math.round(
                                item.currentXboxStats.commonUnitPriceRangeLower,
                            ).toLocaleString()}{' '}
                            -{' '}
                            {Math.round(
                                item.currentXboxStats.commonUnitPriceRangeUpper,
                            ).toLocaleString()}{' '}
                            &bull; {totalSales.toLocaleString()} Recent Sales
                        </div>
                    ) : (
                        <div className="tradable-item-reference-sales">
                            {Math.round(totalSales).toLocaleString()} Recent
                            Sales
                        </div>
                    )}
                </div>

                <div className="tradable-item-reference-image">
                    {item.imageLink && <LocalImage imageUrl={item.imageLink} />}

                    {!item.imageLink && <PlaceholderImage isMissing={true} />}
                </div>
            </FlatButton>
        </div>
    )
}

export default TradableItemReference
