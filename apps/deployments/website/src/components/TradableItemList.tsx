import debounce from 'lodash.debounce'
import { useCallback, useState } from 'react'

import TradableItemReference from '../components/TradableItemReference'
import { TradableItemReferenceType } from '../models/tradable-item-types'
import './TradableItemList.scss'

interface ContainerProps {
    items: TradableItemReferenceType[]
    showFilter?: boolean
    displayRange?: boolean
}

const TradableItemList: React.FC<ContainerProps> = ({
    items,
    showFilter = false,
    displayRange = false,
}) => {
    const [filterText, setFilterText] = useState('')

    const onFilterChange = (e: { target: { value: string } }) => {
        console.log('seteFilterText', e.target.value)
        setFilterText(e.target.value)
    }

    const debouncedFilter = useCallback(debounce(onFilterChange, 1000), [])

    return (
        <div className="tradable-item-list">
            {showFilter && (
                <div className="tradable-item-list-filter">
                    <input
                        autoComplete="off"
                        type="text"
                        onChange={debouncedFilter}
                    />
                </div>
            )}

            {items
                .filter((i) => {
                    return (
                        !filterText.length ||
                        i.displayLabel
                            .toLowerCase()
                            .includes(filterText.toLowerCase())
                    )
                })
                .map((item, index) => {
                    return (
                        <TradableItemReference
                            key={`item_${index}`}
                            item={item}
                            displayRange={displayRange}
                        />
                    )
                })}
        </div>
    )
}

export default TradableItemList
