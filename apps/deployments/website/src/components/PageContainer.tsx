import { IonMenuButton, IonIcon } from '@ionic/react'
import { chevronBackOutline, shareSocialOutline } from 'ionicons/icons'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'
import { RWebShare } from 'react-web-share'

import SupportBanner from './SupportBanner'
import './PageContainer.scss'
import * as constants from '../constants'
import * as routes from '../routes'

interface ContainerProps {
    bleedsIntoHeader?: boolean
    children: React.ReactNode
    metaDescription?: string
    metaTitle?: string
    pageTitle: string
    shareLink?: string
    isBeta?: boolean
}

const PageContainer: React.FC<ContainerProps> = ({
    pageTitle,
    children,
    bleedsIntoHeader = false,
    metaDescription = constants.SITE_DESCRIPTION,
    metaTitle = constants.SITE_TITLE,
    shareLink = null,
    isBeta = false,
}) => {
    const history = useHistory()

    return (
        <div className="page-container">
            <Helmet>
                <meta charSet="utf-8" />
                <title>{metaTitle}</title>
                <link rel="canonical" href={window.location.href} />
                <meta name="description" content={metaDescription} />
            </Helmet>

            <div className="page-container-header">
                <div className="page-container-header-buttons is-start">
                    {history.length > 1 &&
                    !history.location.pathname.includes(routes.dashboard()) ? (
                        <div
                            className="page-container-back-button"
                            onClick={() => {
                                history.goBack()
                            }}
                        >
                            <IonIcon icon={chevronBackOutline}></IonIcon>
                        </div>
                    ) : (
                        <IonMenuButton />
                    )}
                </div>

                <div className="page-container-header-title">{pageTitle}</div>

                {shareLink && (
                    <div className="page-container-header-buttons is-end">
                        <RWebShare
                            data={{ url: shareLink }}
                            onClick={() => console.log('Mind your peepers.')}
                        >
                            <div className="page-container-share-button">
                                <IonIcon icon={shareSocialOutline}></IonIcon>
                            </div>
                        </RWebShare>
                    </div>
                )}

                {isBeta && !shareLink && (
                    <div className="page-container-header-buttons is-end">
                        <div className="page-container-badge">Beta</div>
                    </div>
                )}
            </div>

            <div
                className={`page-container-content ${
                    bleedsIntoHeader ? 'bleeds-into-header' : ''
                }`}
            >
                {children}
            </div>

            <div className="page-container-footer">
                <SupportBanner />
            </div>
        </div>
    )
}

export default PageContainer
