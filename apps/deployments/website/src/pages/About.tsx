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
          That still holds up. But what started as a simple tool to help players
          make gold has grown into something much bigger.
        </p>

        <p>
          Market Tracker began with a scrappy approach, pulling pricing data
          through OCR and piecing together a rough picture of the economy. It
          worked, but it was limited. Since then, we’ve rebuilt the entire
          system from the ground up, moving to direct integrations with The
          Elder Scrolls Online ecosystem and creating a far more reliable and
          complete dataset.
        </p>

        <p>Today, Market Tracker is:</p>
        <ul>
          <li>
            <strong>Open source</strong> - anyone can explore the code,
            contribute, or build their own tools
          </li>
          <li>
            <strong>A public API</strong> - live pricing data available for
            developers at scale
          </li>
          <li>
            <strong>Cross-platform</strong> - covering all megaservers, not just
            one ecosystem
          </li>
          <li>
            <strong>Comprehensive</strong> - tracking items across traits,
            qualities, and variations
          </li>
        </ul>

        <p>This is no longer just a companion app. It’s a data platform.</p>

        <p>
          Our goal hasn’t changed, but the scope has. We want to make trading
          more accessible, more transparent, and more powerful for everyone -
          whether you're flipping items casually or building tools for the
          entire community.
        </p>

        <p>If you’re a player, we hope this helps you earn more.</p>

        <p>
          If you’re a developer, we hope you build something even better on top
          of it.
        </p>

        <p>
          And if you’re somewhere in between, you’re exactly who this was made
          for.
        </p>
      </div>
    </div>
  </PageContainer>
)
