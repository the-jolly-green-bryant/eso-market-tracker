import { IonIcon } from "@ionic/react";
import {
  flashOutline,
  logoDiscord,
  searchOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";

import ExternalLink from "../components/ExternalLink";
import PageContainer from "../components/PageContainer";
import {
  DISCORD_BOT_INSTALL_LINK,
  DISCORD_LINK,
  SITE_TITLE,
} from "../constants";
import * as routes from "../routes";
import "./DiscordBot.scss";

const benefits = [
  {
    icon: searchOutline,
    title: "TSC-compatible",
    description:
      "The familiar /pricecheck item: command works exactly where traders expect it.",
  },
  {
    icon: flashOutline,
    title: "Fast edge lookups",
    description:
      "Autocomplete and price results run against the same index as the website API.",
  },
  {
    icon: shieldCheckmarkOutline,
    title: "Minimal access",
    description:
      "No message-reading permission, no admin permission, and no always-on server process.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ESO Market Tracker Discord Bot",
  applicationCategory: "GameApplication",
  operatingSystem: "Discord",
  url: `https://esomarkettracker.com${routes.discordBot()}`,
  description:
    "A Discord price checker for Elder Scrolls Online console markets on Xbox and PlayStation.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const DiscordBot: React.FC = () => (
  <PageContainer
    pageTitle="Discord Price Bot"
    metaTitle={`Discord Price Bot | ${SITE_TITLE}`}
    metaDescription="Add ESO Market Tracker to Discord for fast Xbox and PlayStation ESO price checks with the familiar TSC /pricecheck command."
    canonicalPath={routes.discordBot()}
    jsonLd={jsonLd}
  >
    <div className="discord-bot-page">
      <section className="discord-bot-hero">
        <div className="discord-bot-mark" aria-hidden="true">
          <IonIcon icon={logoDiscord} />
        </div>
        <div>
          <span>Fight. Loot. Profit. Together.</span>
          <h2>The definitive ESO price checker, now inside Discord.</h2>
          <p>
            Give your traders current Xbox and PlayStation market intelligence
            without making them leave the conversation.
          </p>
          <div className="discord-bot-actions">
            <ExternalLink href={DISCORD_BOT_INSTALL_LINK}>
              Add to Discord
            </ExternalLink>
            <ExternalLink className="is-secondary" href={DISCORD_LINK}>
              Join our community
            </ExternalLink>
          </div>
        </div>
      </section>

      <section className="discord-bot-command" aria-label="Discord command">
        <div>
          <span>Command compatibility</span>
          <h2>Your TSC workflow still works.</h2>
          <p>
            Type the command, choose an item from autocomplete, and receive a
            branded comparison across all four supported console markets.
          </p>
        </div>
        <code>
          <strong>/pricecheck</strong> item: <em>Dreugh Wax</em>
        </code>
      </section>

      <section className="discord-bot-benefits">
        {benefits.map(({ icon, title, description }) => (
          <article key={title}>
            <IonIcon icon={icon} />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="discord-bot-note">
        <strong>One public market, every surface.</strong>
        <p>
          Discord results use the same versioned dataset as the website, API,
          downloadable SQLite database, and in-game add-on.
        </p>
      </section>
    </div>
  </PageContainer>
);

export default DiscordBot;
