import * as constants from "../constants";
import * as routes from "../routes";
import ExternalLink from "./ExternalLink";

const SupportBanner: React.FC = () => (
  <div className="support-banner">
    <span>ESO Market Tracker</span>
    <p>Public data. Transparent methodology. Built for the ESO community.</p>
    <ExternalLink href={constants.DISCORD_LINK}>Join the Discord</ExternalLink>
    <a href={routes.discordBot()}>Discord Bot</a>
    <a href={routes.about()}>About</a>
    <a href={routes.privacyPolicy()}>Privacy</a>
    <a href={routes.termsAndConditions()}>Terms</a>
  </div>
);

export default SupportBanner;
