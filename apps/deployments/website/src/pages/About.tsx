import ExternalLink from "../components/ExternalLink";
import PageContainer from "../components/PageContainer";

const ABOUT_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: "About ESO Market Tracker",
      url: "https://esomarkettracker.com/about",
      description:
        "How ESO Market Tracker builds public Elder Scrolls Online console market data.",
      mainEntity: { "@id": "https://esomarkettracker.com/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://esomarkettracker.com/#organization",
      name: "ESO Market Tracker",
      url: "https://esomarkettracker.com/",
      logo: "https://esomarkettracker.com/assets/icons/icon-512.png",
      sameAs: [
        "https://github.com/the-jolly-green-bryant/eso-market-tracker",
        "https://www.reddit.com/r/ESOMarketTracker/",
      ],
    },
  ],
};

const ABOUT_CONTENT = (
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
        worked, but it was limited. Since then, we’ve rebuilt the entire system
        from the ground up, moving to direct integrations with The Elder Scrolls
        Online ecosystem and creating a far more reliable and complete dataset.
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
          <strong>Console-wide</strong> - covering Xbox and PlayStation markets
          in North America and Europe
        </li>
        <li>
          <strong>Comprehensive</strong> - tracking items across traits,
          qualities, and variations
        </li>
      </ul>

      <p>This is no longer just a companion app. It’s a data platform.</p>

      <p>
        Pricing releases are versioned in public so players and developers can
        inspect how the dataset changes over time. The{" "}
        <ExternalLink href="https://github.com/the-jolly-green-bryant/eso-market-tracker">
          source code and methodology
        </ExternalLink>{" "}
        are available on GitHub, and the{" "}
        <ExternalLink href="https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest">
          latest market data
        </ExternalLink>{" "}
        can be downloaded for independent analysis.
      </p>

      <p>
        Our goal hasn’t changed, but the scope has. We want to make trading more
        accessible, more transparent, and more powerful for everyone - whether
        you're flipping items casually or building tools for the entire
        community.
      </p>

      <p>If you’re a player, we hope this helps you earn more.</p>

      <p>
        If you’re a developer, we hope you build something even better on top of
        it.
      </p>

      <p>
        And if you’re somewhere in between, you’re exactly who this was made
        for.
      </p>
    </div>
  </div>
);

export default () => (
  <PageContainer
    pageTitle="About ESO Market Tracker"
    metaTitle="About ESO Market Tracker | Public ESO Price Data"
    metaDescription="Learn how ESO Market Tracker builds open, versioned Elder Scrolls Online pricing data for Xbox and PlayStation traders, developers, and community tools."
    canonicalPath="/about"
    jsonLd={ABOUT_JSON_LD}
  >
    {ABOUT_CONTENT}
  </PageContainer>
);
