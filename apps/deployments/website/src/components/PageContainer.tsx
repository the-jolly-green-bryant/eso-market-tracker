import { IonMenuButton, IonIcon } from '@ionic/react'
import { chevronBackOutline, shareSocialOutline } from 'ionicons/icons'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'
import { RWebShare } from 'react-web-share'

import SupportBanner from './SupportBanner'
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
  canonicalPath?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export default ({
  pageTitle,
  children,
  bleedsIntoHeader = false,
  metaDescription = constants.SITE_DESCRIPTION,
  metaTitle = constants.SITE_TITLE,
  shareLink,
  isBeta = false,
  canonicalPath,
  jsonLd,
  // SEO metadata is intentionally colocated with the shared page shell.
  // eslint-disable-next-line max-lines-per-function
}: ContainerProps) => {
  const history = useHistory()
  const canonicalUrl = canonicalPath
    ? `https://esomarkettracker.com${encodeURI(canonicalPath)}`
    : undefined

  return (
    <div className="page-container">
      <Helmet>
        <meta charSet="utf-8" />
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        {jsonLd && (
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        )}
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

        <h1 className="page-container-header-title">{pageTitle}</h1>

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
