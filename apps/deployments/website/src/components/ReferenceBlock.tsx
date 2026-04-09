import { helpOutline } from 'ionicons/icons'
import { Link } from 'react-router-dom'

import FlatButton from '../components/FlatButton'
import LocalImage from '../components/LocalImage'
import PlaceholderImage from '../components/PlaceholderImage'
import { TradableItemReferenceType } from '../models/tradable-item-types'
import * as routes from '../routes'
import './TradableItemReference.scss'

interface ContainerProps {
    label: string
    primaryText: string
    secondaryText: string
    imageLink?: string
    missingIcon?: any
}

const ReferenceBlock: React.FC<ContainerProps> = ({
    label,
    primaryText,
    secondaryText,
    imageLink = null,
    missingIcon = helpOutline,
}) => {
    return (
        <div
            className="tradable-item-reference"
            onClick={() => {
                console.log('clicked the thing')
            }}
        >
            <FlatButton to={undefined}>
                <div className="tradable-item-reference-label-container">
                    <div className="tradable-item-reference-label">{label}</div>

                    <div className="tradable-item-reference-price">
                        {primaryText}
                    </div>

                    <div className="tradable-item-reference-sales">
                        {secondaryText}
                    </div>
                </div>

                <div className="tradable-item-reference-image">
                    {imageLink && <LocalImage imageUrl={imageLink} />}

                    {!imageLink && (
                        <PlaceholderImage
                            isMissing={true}
                            missingIcon={missingIcon}
                        />
                    )}
                </div>
            </FlatButton>
        </div>
    )
}

export default ReferenceBlock
