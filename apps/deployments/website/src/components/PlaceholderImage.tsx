import { IonIcon } from '@ionic/react'
import { syncOutline, helpOutline } from 'ionicons/icons'

import './PlaceholderImage.scss'

/**
 * Displays a warning icon if an image is missing, otherwise displays a loading
 *  icon.
 */
export default ({
  isMissing = false,
  missingIcon = helpOutline,
}: {
  isMissing?: boolean
  missingIcon?: string
}) => (
  <div className="placeholder-image">
    <div className="placeholder-image-icon">
      <IonIcon
        icon={isMissing ? missingIcon : syncOutline}
        className={`${!isMissing ? 'is-spinning' : ''}`}
      ></IonIcon>
    </div>
  </div>
)
