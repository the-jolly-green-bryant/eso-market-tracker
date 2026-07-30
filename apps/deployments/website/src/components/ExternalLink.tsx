import { IonIcon } from '@ionic/react'
import { openOutline } from 'ionicons/icons'
import { AnchorHTMLAttributes } from 'react'

import './ExternalLink.scss'

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>

export default ({
  children,
  className = '',
  rel = '',
  ...props
}: ExternalLinkProps) => {
  const relationships = new Set([
    ...rel.split(/\s+/).filter(Boolean),
    'noopener',
    'noreferrer',
  ])

  return (
    <a
      {...props}
      className={`external-link ${className}`.trim()}
      target="_blank"
      rel={[...relationships].join(' ')}
    >
      {children}
      <span aria-hidden="true" className="external-link-icon">
        <IonIcon icon={openOutline} />
      </span>
    </a>
  )
}
