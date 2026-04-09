import { IonIcon } from '@ionic/react'
import { syncOutline, helpOutline } from 'ionicons/icons'

import './PlaceholderImage.scss'

interface ContainerProps {
    isMissing?: boolean
    missingIcon?: any
}

/**
 * Displays a warning icon if an image is missing, otherwise displays a loading icon.
 * @param  {boolean} options.isMissing Is the image missing? If not, its loading.
 */
const PlaceholderImage: React.FC<ContainerProps> = ({
    isMissing = false,
    missingIcon = helpOutline,
}) => {
    return (
        <div className="placeholder-image">
            <div className="placeholder-image-icon">
                <IonIcon
                    icon={isMissing ? missingIcon : syncOutline}
                    className={`${!isMissing ? 'is-spinning' : ''}`}
                ></IonIcon>
            </div>
        </div>
    )
}

export default PlaceholderImage
