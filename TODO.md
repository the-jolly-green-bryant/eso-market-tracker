# ESO Market Tracker Backlog

## Remaining

- Fix the daily market-data workflow failure in the ordered incremental update.
- Restore automatic Bethesda add-on deployment; validation and website release
  succeed, but the Bethesda upload currently returns a deployment failure.
- Verify the changed-release Discord summary in the admin channel, then move it
  to the public updates channel.
- Verify GA4 production reporting for unique users, searches, item views,
  platform changes, and outbound install/API links.
- Submit and monitor the sitemap in Google Search Console, then iterate on
  indexing and rankings for Tamriel Savings, TSC, SavageTSC, ESO price checker,
  and high-value item searches.
- Restyle the add-on mirror site (`apps/deployments/addon-hub`) to match the new
  ESO Market Tracker dark/gold Guild Ledger design system on desktop and mobile.
- Rename the shared `logging` package to `common`.

## Completed

- Public-repository standards, duplicate cleanup, and deterministic data writes.
- Dependency upgrades and reproducible workspace installs.
- Flat-file indexing, atomic updates, partitioned observations, and incremental
  static rendering.
- Ordered daily ingestion with unchanged-download/import skipping and stage
  timings.
- UESP item resolution and TSC/TSC2 observation ingestion.
- Conditional deployment and Discord changed-release summaries.
- Responsive website redesign, item-detail redesign, API documentation, and
  functional Xbox/PlayStation platform switching.
- GA4 search/item analytics foundations.
- SEO metadata, sitemap, crawlable static catalog, Tamriel Savings landing page,
  market pulse, trending cards, and item sparklines.
