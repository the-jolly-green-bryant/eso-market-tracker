import TradableItemList from '../components/TradableItemList'
import { TradableItemReferenceType } from '../models/tradable-item-types'
import './WatchedItems.scss'

interface ContainerProps {
    // pageTitle: string
}

const WatchedItems: React.FC<ContainerProps> = ({}) => {
    // const sampleItem: TradableItemReferenceType = {
    //     displayLabel: 'sample item',
    //     slug: 'sample-item',
    //     currentXboxStats: {
    //         averageUnitPrice: 25.5,
    //     },
    // }

    // return (
    //     <div className="watched-items">
    //         <TradableItemList items={[sampleItem]} />
    //     </div>
    // )

    return <div className="watched-items">Not Implemented</div>
}

export default WatchedItems
