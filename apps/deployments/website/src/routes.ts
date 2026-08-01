export const index = () => "/";
export const dashboard = () => "/dashboard";
/** A platform slug used in public market URLs. */
export type PlatformPath = "xbox-na" | "xbox-eu" | "ps-na" | "ps-eu";
export const platformPattern = () => "/:platform(xbox-na|xbox-eu|ps-na|ps-eu)";
export const withPlatform = (path: string, platform: PlatformPath) => {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return `/${platform}${normalizedPath}`;
};
export const getDashboard = (platform: PlatformPath) =>
  withPlatform(`${dashboard()}/`, platform);
export const about = () => "/about";
export const report = () => "/report-a-bug";

export const item = () => "/item";
export const getItem = (slug: string, platform?: PlatformPath) => {
  const path = `${item()}/${slug}`;
  return platform ? withPlatform(path, platform) : path;
};

export const trend = () => "/trend";
export const getTrend = (slug: string) => `${trend()}/${slug}`;

export const categories = () => "/categories";
export const getCategories = (platform: PlatformPath) =>
  withPlatform(categories(), platform);
export const category = () => "/category";
export const getCategory = (slug: string, platform?: PlatformPath) => {
  const path = `${category()}/${slug}`;
  return platform ? withPlatform(path, platform) : path;
};

export const searchResults = () => "/search-results";
export const getSearchResults = (text: string, platform?: PlatformPath) => {
  const path = `${dashboard()}/${encodeURIComponent(text)}`;
  return platform ? withPlatform(path, platform) : path;
};

export const writCostCalculator = () => "/writ-cost-calculator";

export const termsAndConditions = () => "/terms-and-conditions";
export const privacyPolicy = () => "/privacy-policy";

export const authorizedDevelopers = () => `/authorized-developers`;

export const appStats = () => `/app-stats`;
export const apiDocs = () => "/api-docs";
export const discordBot = () => "/discord-bot";
export const tamrielSavingsAlternative = () => "/tamriel-savings-price-checker";
