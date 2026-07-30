/** A published Bethesda.net release of TSC Price Fetcher 2. */
export type TscAddonRelease = {
  version: string;
  observationDate: string;
  publishedAt: string;
};

/**
 * Published TSC Price Fetcher 2 releases exposed by Bethesda.net as of
 * 2026-07-30. The embedded Lua reference dates were not advanced with these
 * releases, so the publication date is the reliable snapshot date.
 */
export const TSC2_RELEASES: TscAddonRelease[] = [
  {
    version: "100",
    observationDate: "2026-03-02",
    publishedAt: "2026-03-02T00:41:03.000Z",
  },
  {
    version: "101",
    observationDate: "2026-03-07",
    publishedAt: "2026-03-07T00:08:02.000Z",
  },
  {
    version: "102",
    observationDate: "2026-03-12",
    publishedAt: "2026-03-12T23:40:37.000Z",
  },
  {
    version: "103",
    observationDate: "2026-03-25",
    publishedAt: "2026-03-25T02:50:41.000Z",
  },
  {
    version: "104",
    observationDate: "2026-03-30",
    publishedAt: "2026-03-30T02:33:32.000Z",
  },
  {
    version: "105",
    observationDate: "2026-04-14",
    publishedAt: "2026-04-14T23:30:17.000Z",
  },
  {
    version: "106",
    observationDate: "2026-04-21",
    publishedAt: "2026-04-21T01:14:08.000Z",
  },
  {
    version: "107",
    observationDate: "2026-04-26",
    publishedAt: "2026-04-26T23:02:01.000Z",
  },
  {
    version: "108",
    observationDate: "2026-05-04",
    publishedAt: "2026-05-04T00:29:54.000Z",
  },
  {
    version: "109",
    observationDate: "2026-05-20",
    publishedAt: "2026-05-20T22:33:02.000Z",
  },
  {
    version: "110",
    observationDate: "2026-05-27",
    publishedAt: "2026-05-27T00:41:10.000Z",
  },
  {
    version: "111",
    observationDate: "2026-06-07",
    publishedAt: "2026-06-07T21:39:21.000Z",
  },
  {
    version: "112",
    observationDate: "2026-06-23",
    publishedAt: "2026-06-23T01:39:45.000Z",
  },
  {
    version: "113",
    observationDate: "2026-07-06",
    publishedAt: "2026-07-06T01:22:55.000Z",
  },
  {
    version: "114",
    observationDate: "2026-07-13",
    publishedAt: "2026-07-13T00:40:36.000Z",
  },
  {
    version: "115",
    observationDate: "2026-07-26",
    publishedAt: "2026-07-26T22:32:05.000Z",
  },
];
