import { IonIcon } from '@ionic/react'
import {
    alertOutline,
    cloudDownloadOutline,
    informationOutline,
} from 'ionicons/icons'

import './LoadingSkeleton.scss'

interface ContainerProps {
    children?: React.ReactElement | null
    loading?: boolean
    error?: boolean
    title?: string
    message?: string
    isInline?: boolean
    showIcon?: boolean
}

const LoadingSkeleton: React.FC<ContainerProps> = ({
    children = null,
    loading = true,
    error = false,
    title = null,
    message = null,
    isInline = false,
    showIcon = true,
}) => {
    const skeletonIcon = error
        ? alertOutline
        : loading
        ? cloudDownloadOutline
        : informationOutline
    const skeletonTitle = title != null ? title : error ? 'Error' : 'Loading'

    const skeletonMessage =
        message != null
            ? message
            : error
            ? 'An error was encountered while loading this data!'
            : 'Loading' // TODO - This is probably going to be replaced with an actual loading skeleton.

    return loading ? (
        children
    ) : (
        <div className={`loading-skeleton ${isInline ? 'is-inline' : ''}`}>
            <div className="loading-skeleton-card">
                {showIcon && (
                    <div className="loading-skeleton-card-icon">
                        <IonIcon icon={skeletonIcon}></IonIcon>
                    </div>
                )}

                <div className="loading-skeleton-card-text-container">
                    <div className="loading-skeleton-card-title">
                        {skeletonTitle}
                    </div>

                    <div className="loading-skeleton-card-description">
                        {skeletonMessage}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingSkeleton
