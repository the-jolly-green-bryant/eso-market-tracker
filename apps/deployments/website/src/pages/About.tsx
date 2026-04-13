import PageContainer from '../components/PageContainer'
import * as constants from '../constants'

export default () => (
  <PageContainer
    pageTitle="About Us"
    metaTitle={constants.getFullPageTitle(`About Us`)}
  >
    <div className="static-content">
      <div className="static-content-header">Fight. Loot. Profit.</div>

      <div className="static-content-text">
        <p>
          It's more than a slogan, it's a mantra. We built this app a simple
          goal in mind: help our users make more money.
        </p>

        <p>
          It's our belief that trading is a core mechanic of the Elder Scrolls
          Online game, and it's our goal to make it more accessible to each and
          every player. PC players already have access to a suite of trading
          tools. It's our goal with this companion app to bring that same power
          and utility to Xbox players.
        </p>

        <p>
          If you find this app as useful as we do, please consider our great
          community on{' '}
          <a href={constants.PATREON_LINK} target="_blank">
            Discord
          </a>
          {'.'}
        </p>
      </div>
    </div>
  </PageContainer>
)
