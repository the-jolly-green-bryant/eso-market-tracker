import ExternalLink from "../components/ExternalLink";
import PageContainer from "../components/PageContainer";

const CONTENT = (
  <div className="static-content">
    <p>
      ESO Market Tracker provides public Elder Scrolls Online market data
      through its website, mobile app, API, and Discord bot. This policy
      explains the limited information used to operate and improve those
      services.
    </p>
    <p>
      <strong>Website analytics</strong>
    </p>
    <p>
      The website uses Google Analytics 4 to understand traffic and product
      usage. Analytics may collect page views, referring pages, approximate
      location, browser and device information, and interactions such as
      outbound link clicks.
    </p>
    <p>
      When you search the market, ESO Market Tracker sends the search term,
      number of results, selected console market, and running counts of searches
      in the current session and browser to Google Analytics. These measurements
      help identify useful items, searches with no results, and how frequently
      visitors use the price checker.
    </p>
    <p>
      The website does not ask for an account, name, email address, or other
      identity before a search. Do not enter personal information in the item
      search field. Search counts are associated with the pseudonymous browser
      and device signals used by Google Analytics, not a public ESO Market
      Tracker profile.
    </p>
    <p>
      <strong>Cookies and local storage</strong>
    </p>
    <p>
      Google Analytics may use cookies or similar device storage for
      pseudonymous measurement. ESO Market Tracker also stores your selected
      console market and two search counters in local or session storage. You
      can clear these values through your browser controls. Blocking analytics
      or storage does not prevent you from using the public price checker.
    </p>
    <p>
      <strong>Discord Bot</strong>
    </p>
    <p>
      When you use an ESO Market Tracker application command in Discord, Discord
      sends the selected command, item search text, and technical context such
      as server, channel, and user identifiers to the bot. This information is
      used only to return the requested market result. The bot does not read
      unrelated messages and does not retain command content or Discord
      identifiers in an application database.
    </p>
    <p>
      Requests are processed by Cloudflare, which may retain limited technical
      logs for security, reliability, and abuse prevention under its own
      policies.
    </p>
    <p>
      <strong>Service providers</strong>
    </p>
    <p>
      ESO Market Tracker relies on service providers to host, secure,
      distribute, and measure the service. Their processing is governed by their
      own policies:
    </p>
    <ul>
      <li>
        <ExternalLink href="https://policies.google.com/privacy">
          Google privacy policy
        </ExternalLink>
      </li>
      <li>
        <ExternalLink href="https://www.cloudflare.com/privacypolicy/">
          Cloudflare privacy policy
        </ExternalLink>
      </li>
      <li>
        <ExternalLink href="https://discord.com/privacy">
          Discord privacy policy
        </ExternalLink>
      </li>
    </ul>
    <p>
      Information is retained only as needed to operate, secure, and improve the
      service, subject to the retention controls and policies of these
      providers.
    </p>
    <p>
      <strong>Your choices</strong>
    </p>
    <p>
      You can restrict cookies and analytics through browser settings, clear
      local and session storage at any time, or use the{" "}
      <ExternalLink href="https://tools.google.com/dlpage/gaoptout">
        Google Analytics opt-out browser add-on
      </ExternalLink>
      . External links are governed by the destination site's privacy policy.
    </p>
    <p>
      <strong>Children’s Privacy</strong>
    </p>
    <p>
      The service is not directed to children under 13, and ESO Market Tracker
      does not knowingly collect personal information from children under 13.
    </p>
    <p>
      <strong>Changes to This Privacy Policy</strong>
    </p>
    <p>
      This policy may be updated as the service changes. The current version
      will be posted on this page.
    </p>
    <p>This policy is effective as of July 30, 2026.</p>
    <p>
      <strong>Contact Us</strong>
    </p>
    <p>
      Questions about this policy can be sent to{" "}
      <a href="mailto:esomarkettracker@gmail.com">esomarkettracker@gmail.com</a>
      .
    </p>
  </div>
);

const PrivacyPolicy: React.FC = () => (
  <PageContainer
    pageTitle="Privacy Policy"
    metaTitle="Privacy Policy | ESO Market Tracker"
    metaDescription="How ESO Market Tracker uses privacy-conscious analytics, local storage, and service providers across the website, app, API, and Discord bot."
    canonicalPath="/privacy-policy"
  >
    {CONTENT}
  </PageContainer>
);

export default PrivacyPolicy;
