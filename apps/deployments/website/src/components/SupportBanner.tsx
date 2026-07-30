import * as constants from '../constants'
import * as routes from '../routes'

const SupportBanner: React.FC = () => (
  <div className="support-banner">
    <span>ESO Market Tracker</span>
    <p>Public data. Transparent methodology. Built for the ESO community.</p>
    <a
      href={constants.DISCORD_LINK}
      target="_blank"
      rel="noopener noreferrer"
    >
      Join the Discord
    </a>
    <a href={routes.privacyPolicy()}>Privacy</a>
  </div>
)

export default SupportBanner
