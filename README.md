# ESO Market Tracker

![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-tracker/coverage-badge/badge.json)
![CI](https://github.com/the-jolly-green-bryant/eso-market-tracker/actions/workflows/main.yaml/badge.svg)
![Node](https://img.shields.io/badge/node-22-blue)
![pnpm](https://img.shields.io/badge/pnpm-10-orange)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An open source pricing database for **The Elder Scrolls Online**.

| Mega-server | Item Count      |
|-------------|-----------------|
| XBOX-NA     | 130968 |
| XBOX-EU     | 53107 |
| PS-NA       | 85526   |
| PS-EU       | 45284   |

_Last Updated: 2026-04-12_

This project collects, normalizes, indexes, and exposes large-scale market pricing data
across platforms and time. It is the spiritual successor to [ESO Market Tracker](https://esomarkettracker.com).

The goal is to provide a **clean, reproducible, and well-tested data pipeline** and
 search system built around a static file dataset.

---

## Overview

ESO Market Tracker is a **monorepo** containing multiple coordinated packages:

| Package                                        | Purpose                                                                                    |
|------------------------------------------------|--------------------------------------------------------------------------------------------|
| `packages/`                                    | Contains shared functionality used across apps.                                            |`
| &nbsp;&nbsp;`database`                         | Manages read/write into the static data structure                                          |
| &nbsp;&nbsp;`eso`                              | Contains logic specific to ESO and its system of IDs                                       |
| &nbsp;&nbsp;`logging`                          | Handles routine logging and contains sundry helper functions                               |
| `apps/`                                        | Serve or manage data in various ways.                                                      |
| &nbsp;&nbsp;`collectors/`                      | Ingest data from various sources and push it into the data directory.                      |
| &nbsp;&nbsp;&nbsp;&nbsp;`items-from-uesp`      | Pulls all items known to UESP into the database. (As Needed)                               |
| &nbsp;&nbsp;&nbsp;&nbsp;`observations-from-emt` | Pulls all item pricing data from legacy EMT. (One-time)                                    |
| &nbsp;&nbsp;&nbsp;&nbsp; `observations-from-local-addons` | Pulls all pricing data from legacy addons. (One-time)                                      |
| &nbsp;&nbsp;&nbsp;&nbsp; `observations-from-tsc-web-app` | Pulls pricing data from the legacy TSC web app. (One-time)                                 |
| &nbsp;&nbsp;&nbsp;&nbsp; `observations-from-tsc2` | Pulls pricing data from the current TSC2 addon. (Recurring, Idempotent)|
| &nbsp;&nbsp;`builders/` | Perform database construction tasks. |
| &nbsp;&nbsp;&nbsp;&nbsp;`master-update`| A one-hit button to update the database and all relevant deployments. |
|&nbsp;&nbsp;`deployments/`|Various applications for serving out our data. |
|&nbsp;&nbsp;&nbsp;&nbsp;`eso-addon` | The console-ready addon for the ESO game.|
| `data`                                         | Manages generating of database artifacts such as SQLite in addition to containing raw data |

The architecture intentionally keeps the **canonical dataset as flat files** rather than
a traditional database so that the entire market history can be:

* versioned
* reproducible
* inspectable
* portable

---

## Design Principles

This repository intentionally follows strict engineering practices:

- **Test coverage enforcement**
- **Reproducible builds**
- **Typed APIs**
- **Deterministic data formats**
- **Automated CI validation**

The goal is to consistently apply engineering discipline to provide a robust community
 resource.

## Development

### Install

`pnpm install`

### Run tests

`pnpm test`

### Generate coverage

`pnpm coverage`

Coverage thresholds are enforced in CI.

---

## Continuous Integration

Every commit is validated by GitHub Actions:

* full test suite
* coverage threshold enforcement

The repository intentionally avoids common antipatterns such as:

- unchecked test coverage
- nondeterministic builds
- hidden data generation steps

---

## Why Static/Flat Files?

The market database is stored as structured flat files rather than a relational
 database.

Advantages:

* fully versionable dataset
* deterministic builds
* easy community mirroring
* reproducible historical snapshots

Search and indexing layers operate on top of this canonical dataset.

---

## Data Collection & Management

### Collectors

Collectors ingest data from various sources and pipes it into the flat file system.

The `apps/collectors/items-from-uesp` collector pulls in new item based on data mining
and should be run whenever one can reasonably expect new items to exist, such as when
there is a new game release.

The `apps/collectors/observations-from-emt` only needs to be run once as it will be
retired in favor of this data collection. It is retained for historical purposes.

The `apps/collectors/observations-from-tsc-web-app` can be run repeatedly, but data is
slow to update on that platform, and other TSC services are fresher.

### Builder

The `data` package compiles the flat file system into easily accessible artifacts.

### Deployments

Deployments take the collected data and serve it in various fashions.

---

## Data Sourcing

To provide the best community resource, we are diligent in using only reputable data
sources which collect data directly from the game. Current sources include:

- **ESO Market Tracker**. The original Market Tracker has a long history of automating
  data collection within the console ESO interface. Originally powered by a technically
  impressive OCR engine that processed sales directly from video feeds, the Market
  Tracker has since been able to negotiate and navigate a direct connection to ESO's
  sales history.

- **Tamriel Savings Co**. The TSC service is a long-standing service that originally
  collected its data by hand. It has since updated its collection methods to be more
  automated and less prone to human error.

- **UESP**. The UESP community maintains mined game data for ESO.

---

## Notes on Data Structure

### Internal IDs

All items are assigned an idempotent internal ID based on the item name. This allows us
to group items regardless of level, quality, or trait. Trait and quality are then
tracked at the observation level.

### Observations

Observations are point-in-time snapshots of item sale performance at the given time.

### Indexes

A number of indexes are maintained for bulk data operations such as deployment code
 generation.

---

## License

This project is licensed under a modified MIT License. See the `LICENSE.md` file for
 details.

---

## Terms of Use

This API is provided as a free, community resource for the Elder Scrolls Online
ecosystem.

You are welcome and encouraged to use it in your own projects, tools, addons, or
experiments. There are no restrictions on usage, modification, or
redistribution of the data provided by this service.

The data exposed by this API consists of aggregated observations and statistical
facts, which are not subject to exclusive ownership.

This service is provided “as is,” without warranty of any kind, including
accuracy, availability, or fitness for a particular purpose. While efforts are made to keep the data useful and up to date, no guarantees are made.

If you build something interesting with it, that’s a win for the community.

---

## Copyright

This software is not created by, affiliated with or sponsored by ZeniMax Media Inc. or
 its affiliates. The Elder Scrolls and related logos are registered trademarks or
 trademarks of ZeniMax Media Inc. in the United States and/or other countries. All
 rights reserved.
