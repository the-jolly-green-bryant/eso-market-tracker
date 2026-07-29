# ESO Market Tracker

<p align="center">
  A public, reproducible pricing dataset and delivery pipeline for The Elder Scrolls Online.
</p>

<p align="center">
  <a href="https://github.com/the-jolly-green-bryant/eso-market-tracker/actions/workflows/main.yaml"><img alt="CI/CD" src="https://github.com/the-jolly-green-bryant/eso-market-tracker/actions/workflows/main.yaml/badge.svg"></a>
  <img alt="Coverage" src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-tracker/coverage-badge/badge.json">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white">
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white">
  <a href="LICENSE.md"><img alt="License" src="https://img.shields.io/badge/license-source--available-blue"></a>
</p>

ESO Market Tracker collects market observations, normalizes ESO item identities, and
publishes pricing data for the Xbox and PlayStation megaservers. It is the source-available
successor to the original [ESO Market Tracker](https://esomarkettracker.com).

The repository is both a TypeScript monorepo and a versioned data product: collectors,
domain packages, deployment targets, and the canonical flat-file history live together
so every generated artifact can be traced back to its inputs.

## Why this repository is unusual

- **Data is versioned like code.** Canonical observations are deterministic,
  inspectable flat files rather than opaque rows in a hosted database.
- **Collectors are source-specific.** Each ingestion path translates its source into
  a shared model without leaking source quirks into downstream consumers.
- **Identity is stable.** Items receive deterministic internal identifiers, while
  quality, trait, platform, region, and time remain observation-level dimensions.
- **Multiple products share one pipeline.** The website, API, SQLite artifact, and
  in-game addon are built from the same underlying dataset.
- **The workflow is testable.** TypeScript, Vitest coverage, ESLint, and type checks
  protect both domain logic and data transformations.

## System overview

```text
UESP + legacy EMT + Tamriel Savings Co + local addon exports
                             │
                             ▼
                      source collectors
                             │
                             ▼
                 canonical flat-file dataset
                             │
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
              SQLite      web / API   ESO addon
```

## Workspace map

| Path | Responsibility |
|---|---|
| `packages/database` | Canonical data access, naming, indexing, and image helpers |
| `packages/eso` | ESO item, quality, and trait domain logic |
| `packages/logging` | Shared structured logging and utility extensions |
| `apps/collectors/items-from-uesp` | Import mined ESO item definitions |
| `apps/collectors/observations-from-*` | Normalize observations from each market source |
| `apps/builders/master-update` | Coordinate a complete data and deployment refresh |
| `apps/deployments/website` | Searchable web experience and static output |
| `apps/deployments/api` | Cloudflare Worker API deployment |
| `apps/deployments/eso-addon` | Build the console-ready in-game addon |
| `data` | Canonical history plus generated database artifacts |

Legacy one-time collectors are retained to keep historical imports reproducible.
Recurring collectors are designed to be idempotent.

## Development

### Requirements

- Node.js 22
- pnpm 10
- Git configured to handle a large, data-heavy working tree

```bash
git clone https://github.com/the-jolly-green-bryant/eso-market-tracker.git
cd eso-market-tracker
pnpm install
pnpm check
pnpm test
```

Common commands:

| Command | Purpose |
|---|---|
| `pnpm check` | Run lint and TypeScript checks |
| `pnpm test` | Run the Vitest suite |
| `pnpm coverage` | Run tests with coverage enforcement |
| `pnpm build` | Inject the version, test, and build every workspace |
| `pnpm clean` | Clean generated workspace output |
| `pnpm format` | Format the repository with Prettier |

Individual collectors and deployments expose their own workspace scripts. Run them
through pnpm's filter support to avoid rebuilding unrelated packages.

## Data model

### Items

An internal item ID is derived deterministically from the normalized name. That groups
the same conceptual item across platforms and observations without conflating its
quality or trait variants.

### Observations

An observation is a point-in-time market snapshot scoped to a platform and region.
Historical and current representations are kept separately so consumers can choose
between fast current-state reads and longitudinal analysis.

### Indexes and artifacts

Derived indexes support bulk generation and lookup. The pipeline also produces a
portable SQLite database, available from the rolling
[`latest` release](https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest).

## Data sources

- **ESO Market Tracker:** historical data from the original service.
- **Tamriel Savings Co:** recurring console-market observations.
- **UESP:** community-maintained, mined ESO item definitions.

Collectors preserve provenance and isolate source-specific parsing. Users of the
published data remain responsible for checking the terms that apply to each source.

## Continuous delivery

On pull requests and pushes to `main`, GitHub Actions installs the workspace, builds
the SQLite database, and runs coverage checks. The release path also:

- syncs the static website to S3;
- deploys the API to Cloudflare Workers;
- publishes the generated ESO addon;
- updates the rolling SQLite release.

Deployment credentials are supplied through GitHub Actions secrets and are not part of
the repository.

## Contributing

Keep transformations deterministic, add tests for naming or parsing changes, and avoid
manual edits to generated artifacts when a builder owns them. Large data updates should
explain their source and generation command in the pull request.

## License and trademarks

The project is source-available under a custom non-commercial license; see
[LICENSE.md](LICENSE.md). This license is not an OSI-approved open-source license.

This project is not created by, affiliated with, or sponsored by ZeniMax Media Inc. or
its affiliates. The Elder Scrolls and related marks belong to their respective owners.
