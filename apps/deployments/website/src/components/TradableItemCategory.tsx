import TradableItemList from '../components/TradableItemList'
import { TradableItemCategoryType } from '../models/tradable-item-types'
import './TradableItemCategory.scss'

interface ContainerProps {
    category: TradableItemCategoryType
}

const TradableItemCategory: React.FC<ContainerProps> = ({ category }) => {
    return (
        <div className="tradable-item-category">
            <div className="page-container-list">
                <TradableItemList items={category.items} showFilter={false} />
            </div>
        </div>
    )
}

export default TradableItemCategory
