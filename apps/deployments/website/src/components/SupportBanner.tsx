import { Capacitor } from '@capacitor/core'
import './SupportBanner.scss'
import * as constants from '../constants'
import { REDDIT_LINK } from '../constants'

interface ContainerProps {
    // item: string
}

const SupportBanner: React.FC<ContainerProps> = ({}) => {
    return (
        <div className="support-banner">
            <div className="support-banner-text">
                Learn about our
                <br />
                growing app!
            </div>

            {Capacitor.getPlatform() === 'NEVER_THIS__ios' ? (
                <a
                    className="support-banner-button"
                    href={constants.REDDIT_LINK}
                    target="_blank"
                >
                    <div className="support-banner-button-text">
                        <img
                            src="assets/images/reddit-wordmark-white.png"
                            alt=""
                        />
                    </div>
                </a>
            ) : (
                <a
                    className="support-banner-button"
                    href={constants.PATREON_LINK}
                    target="_blank"
                >
                    <div className="support-banner-button-text">
                        <img
                            src="assets/images/discord-logo-white.png"
                            alt=""
                        />
                    </div>
                </a>
            )}
        </div>
    )
}

export default SupportBanner
