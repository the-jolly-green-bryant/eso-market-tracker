# Tamriel Savings acquisition campaign

This package is ready to upload to Google Ads or send to Tamriel Savings for a
direct banner placement. It intentionally uses the Tamriel Savings name only as
a search keyword and on EMT's clearly disclosed comparison landing page, not in
the visible ad creative.

## Campaign objective

Acquire ESO console players actively looking for Tamriel Savings, TSC,
SavageTSC, or an ESO price checker and measure whether they complete a market
search on ESO Market Tracker.

Primary conversion:

- GA4 `search` event with a non-empty `search_term`

Secondary conversions:

- `view_item`
- Two or more searches in the same session (`search_count_session >= 2`)

Landing page:

`https://esomarkettracker.com/tamriel-savings-price-checker/`

## Google Search campaign

Campaign name: `EMT | Search | Tamriel Savings`

- Network: Google Search only
- Location: United States and Canada, presence only
- Language: English
- Bidding during the test: Maximize Clicks with a conservative CPC ceiling
- Search partners: Off for the initial test
- Display expansion: Off
- Ad schedule: All day until enough conversion data exists

### Keywords

Keep the competitor terms isolated in their own ad group so their cost and
conversion rate are visible.

Exact match:

```text
[tamriel savings]
[tamriel savings co]
[tamriel savings price checker]
[tsc price checker]
[tsc eso]
[savage tsc]
[savagetsc]
```

Phrase match:

```text
"tamriel savings"
"tamriel savings co"
"tamriel savings price checker"
"tsc price checker"
"tsc eso"
"savage tsc"
"savagetsc"
```

Initial negative keywords:

```text
jobs
employment
bank
stock
coupon
steam
pc
tamriel trade centre
ttc
```

Review the search-terms report daily for the first week. Add irrelevant terms as
negatives without blocking genuine Tamriel Savings or console price-checker
intent.

### Responsive search ad

Headlines:

```text
ESO Console Price Checker
Current Xbox & PS Prices
Search 44,000+ ESO Items
Historical ESO Price Data
Know What Your Loot Is Worth
Free ESO Market Tracker
Prices, Trends & Item Traits
Check Any ESO Item
```

Descriptions:

```text
Search current ESO item prices, recent ranges, and market history for Xbox and PlayStation.
Check materials, motifs, gear traits, and more with public, versioned console market data.
Know the market before you list. Search free ESO price history in seconds.
Compare regions, inspect trends, and find a practical listing range for your ESO items.
```

Do not use dynamic keyword insertion in this ad group. It could insert a
competitor trademark into visible ad copy.

Final URL:

```text
https://esomarkettracker.com/tamriel-savings-price-checker/?utm_source=google&utm_medium=cpc&utm_campaign=tsc_conquest_search&utm_content=responsive_search&utm_term={keyword}
```

## Google Display managed-placement campaign

Campaign name: `EMT | Display | TamrielSavings.com`

- Placement: `tamrielsavings.com`
- Location: United States and Canada
- Language: English
- Optimized targeting: Off
- Targeting mode: Placement targeting, not observation
- Mobile app inventory: Excluded
- Frequency cap: 3 impressions per user per day
- Creative set: use all PNG files generated in `assets/`

Tamriel Savings currently serves Google AdSense and publishes this authorized
seller entry:

```text
google.com, pub-1653162910188902, DIRECT, f08c47fec0942fa0
```

That makes the site technically eligible for Google Display inventory, but
Google does not guarantee that a managed placement will receive impressions.
Inventory availability, publisher controls, audience eligibility, and the
auction still apply.

Final URL:

```text
https://esomarkettracker.com/tamriel-savings-price-checker/?utm_source=google&utm_medium=display&utm_campaign=tsc_managed_placement&utm_content={creative}
```

## Direct publisher placement

A direct agreement is the best route when guaranteed placement on
TamrielSavings.com matters more than auction efficiency.

Subject:

```text
Paid banner placement inquiry — ESO Market Tracker
```

Message:

```text
Hi! I run ESO Market Tracker, an independent console price-checking site for
Xbox and PlayStation players. I’m interested in purchasing a clearly labeled
banner placement or sponsorship on TamrielSavings.com.

Could you share whether you accept relevant third-party tool advertising and,
if so, your available desktop/mobile placements, creative sizes, monthly rates,
estimated impressions, and minimum term? We can provide finished PNG creative,
a destination URL with campaign tracking, and any disclosure language you
prefer.

The proposed landing page clearly states that ESO Market Tracker is independent
and links visitors back to the official Tamriel Savings site. I’d be happy to
start with a 30-day test.

Thanks!
```

Direct-placement URL:

```text
https://esomarkettracker.com/tamriel-savings-price-checker/?utm_source=tamrielsavings&utm_medium=display&utm_campaign=tsc_direct_sponsorship&utm_content={placement}
```

Before agreeing to a direct buy, request:

- Page and placement screenshots
- Last 30 days of pageviews and unique users
- Desktop/mobile split
- Expected impressions for the placement
- Flat monthly rate or CPM
- Whether the placement is sitewide or page-specific
- Start/end dates and cancellation terms

## Measurement

GA4 already captures:

- UTM source, medium, campaign, content, and term on the landing page
- Search terms and result counts
- Selected console market
- Per-session and per-browser search counts
- Item selections and item-detail views

In GA4, mark `search` as a key event and import it into Google Ads. Build a
funnel exploration:

1. Landing page path contains `/tamriel-savings-price-checker/`
2. `search`
3. `view_item`
4. A second `search` in the same session

Evaluate after at least 100 qualified clicks or 30 days:

- Cost per completed search
- Search completion rate
- Engaged-search rate (two or more searches)
- Item-detail view rate
- Search terms with zero results
- Performance by platform, device, and campaign

## Budget split

Do not activate either campaign until a daily budget is approved.

Recommended test split:

- 70% Search competitor-intent campaign
- 20% TamrielSavings.com managed placement
- 10% creative/keyword reserve

If a direct publisher deal is accepted, fund it separately and compare its cost
per completed search against Google Search.

## Rendering creatives

From the repository root:

```bash
NODE_PATH=/Users/bryant.jackson/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
  /Users/bryant.jackson/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  marketing/campaigns/tamriel-savings/render-creatives.cjs
```

The generated PNG files are written to `assets/`.
