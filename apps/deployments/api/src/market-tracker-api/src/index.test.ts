import { describe, it, expect, vi } from "vitest";
import { __dedupe, __normalize, item, Env } from "./index";
import {
  __apiAnalyticsParameters,
  __apiRoute,
  sendApiAnalytics,
} from "./analytics";

describe("api", async () => {
  const env = {
    ESO_MARKET_TRACKER: {
      get: vi.fn(async (key: string) => {
        if (key === "1393740546") {
          return {
            item: {
              internalId: 1393740546,
              name: "Dreugh Wax",
            },
            pricing: {
              average: 123,
            },
          };
        }
        return null;
      }),
    },
  };

  it("fetches data", async () => {
    const r = await item("1393740546", env as unknown as Env);
    const body = (r && (await r.json())) as {
      results: { pricing: { average: number } }[];
    };
    expect(body?.results?.at(0)?.pricing.average).toEqual(123);
  });

  it("dedupes and normalizes", async () => {
    expect(
      __dedupe([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 3 }], (i) =>
        i.a.toString(),
      ).map((i) => i.a),
    ).toEqual([1, 2, 3]);

    expect(__normalize("cool-thing")).toEqual("cool thing");
  }, 10_000);

  it("builds privacy-conscious endpoint analytics", () => {
    const request = new Request(
      "https://data.esomarkettracker.com/search/dreugh%20wax?private=value",
      { headers: { origin: "https://esomarkettracker.com/search" } },
    );
    const parameters = __apiAnalyticsParameters(
      request,
      new Response(null, { status: 200 }),
      12.6,
    );

    expect(__apiRoute("/search/dreugh%20wax")).toBe("/search/:term");
    expect(parameters).toMatchObject({
      api_route: "/search/:term",
      api_path: "/search/dreugh%20wax",
      request_origin: "https://esomarkettracker.com",
      search_term: "dreugh wax",
      response_status: 200,
      response_time_ms: 13,
    });
    expect(JSON.stringify(parameters)).not.toContain("private=value");
  });

  it("sends non-blocking API events only when configured", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    const request = new Request(
      "https://data.esomarkettracker.com/item/1393740546",
    );
    const response = new Response(null, { status: 404 });

    expect(await sendApiAnalytics(request, response, 5, {}, fetcher)).toBe(
      false,
    );
    expect(fetcher).not.toHaveBeenCalled();

    expect(
      await sendApiAnalytics(
        request,
        response,
        5,
        { GA_API_SECRET: "test-secret" },
        fetcher,
      ),
    ).toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();

    const [endpoint, init] = fetcher.mock.calls[0];
    expect(endpoint.toString()).toContain(
      "measurement_id=G-TZ24DG3P0Z&api_secret=test-secret",
    );
    expect(JSON.parse(init?.body as string)).toMatchObject({
      client_id: "api.anonymous",
      events: [
        {
          name: "api_request",
          params: {
            api_route: "/item/:key",
            item_id: "1393740546",
            response_status: 404,
          },
        },
      ],
    });
  });
});
