export const API_GA_MEASUREMENT_ID = "G-TZ24DG3P0Z";

type AnalyticsParameters = Record<string, string | number>;
type AnalyticsFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type ApiAnalyticsEnv = {
  GA_API_SECRET?: string;
};

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MAX_PATH_LENGTH = 300;
const MAX_VALUE_LENGTH = 100;

const truncate = (value: string, length: number) => value.slice(0, length);

const decodePathValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const pathParts = (pathname: string) =>
  pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

export const __apiRoute = (pathname: string) => {
  const [route] = pathParts(pathname);
  if (route === "search") return "/search/:term";
  if (route === "item") return "/item/:key";
  if (route === "discord") {
    if (pathname.startsWith("/discord/health")) return "/discord/health";
    if (pathname.startsWith("/discord/interactions")) {
      return "/discord/interactions";
    }
    return "/discord/:route";
  }
  return route ? "/docs/fallback" : "/docs";
};

const requestOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return undefined;

  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
};

export const __apiAnalyticsParameters = (
  request: Request,
  response: Response,
  responseTimeMs: number,
): AnalyticsParameters => {
  const url = new URL(request.url);
  const [route, ...rest] = pathParts(url.pathname);
  const routeValue = decodePathValue(rest.join("/"));
  const parameters: AnalyticsParameters = {
    api_route: __apiRoute(url.pathname),
    api_path: truncate(url.pathname, MAX_PATH_LENGTH),
    api_surface: route === "discord" ? "discord" : "public_api",
    page_location: truncate(`${url.origin}${url.pathname}`, MAX_PATH_LENGTH),
    request_method: request.method,
    response_status: response.status,
    response_time_ms: Math.max(0, Math.round(responseTimeMs)),
    engagement_time_msec: 1,
  };

  const origin = requestOrigin(request);
  if (origin) parameters.request_origin = truncate(origin, MAX_VALUE_LENGTH);
  if (route === "search" && routeValue) {
    parameters.search_term = truncate(routeValue, MAX_VALUE_LENGTH);
  }
  if (route === "item" && routeValue) {
    parameters.item_id = truncate(routeValue, MAX_VALUE_LENGTH);
  }

  return parameters;
};

export const sendApiAnalytics = async (
  request: Request,
  response: Response,
  responseTimeMs: number,
  env: ApiAnalyticsEnv,
  fetcher: AnalyticsFetch = fetch,
) => {
  if (!env.GA_API_SECRET) return false;

  const endpoint = new URL(GA_ENDPOINT);
  endpoint.searchParams.set("measurement_id", API_GA_MEASUREMENT_ID);
  endpoint.searchParams.set("api_secret", env.GA_API_SECRET);

  try {
    const analyticsResponse = await fetcher(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        // API traffic is intentionally not fingerprinted into pseudo-users.
        client_id: "api.anonymous",
        events: [
          {
            name: "api_request",
            params: __apiAnalyticsParameters(request, response, responseTimeMs),
          },
        ],
      }),
    });
    return analyticsResponse.ok;
  } catch {
    // Analytics must never affect API availability.
    return false;
  }
};
