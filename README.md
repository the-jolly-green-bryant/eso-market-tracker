# ESO Market Tracker

![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-tracker/coverage-badge/badge.json)
![CI](https://github.com/the-jolly-green-bryant/eso-market-tracker/actions/workflows/coverage.yaml/badge.svg)
![Node](https://img.shields.io/badge/node-22-blue)
![pnpm](https://img.shields.io/badge/pnpm-10-orange)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An open source pricing database for **The Elder Scrolls Online**.

This project collects, normalizes, indexes, and exposes large-scale market pricing data across
platforms and time. It is the spiritual successor to
[ESO Market Tracker](https://esomarkettracker.com).

The goal is to provide a **clean, reproducible, and well-tested data pipeline** and
 search system built around a static file dataset.

---

## Overview

ESO Market Tracker is a **monorepo** containing multiple coordinated packages:

| Package                           | Purpose                                                                                    |
|-----------------------------------|--------------------------------------------------------------------------------------------|
| `packages/database`               | Manages read/write into the static data structure                                          |
| `packages/eso`                    | Contains logic specific to ESO and its system of IDs                                       |
| `packages/logging`                | Handles routine logging and contains sundry helper functions                               |
| `apps/collectors/items-from-uesp` | Pulls all items known to UESP into the database                                            |
| `data`                            | Manages generating of database artifacts such as SQLite in addition to containing raw data |

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

The repository intentionally avoids common anti-patterns such as:

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

## Data Collection Practices

The `apps/collectors/items-from-uesp` collector pulls in new item baesd on data mining
and should be run whenever one can reasonably expect new items to exist, such as when
there is a new game release.

The `apps/collectors/observations-from-emt` only needs to be run once as it will be
retired in favor of this data collection. It is retained for historical purposes.

---

## Notes on Data Structure

### Internal IDs

All items are assigned an idempotent internal ID based on the item name. This allows us
to group items regardless of level, quality, or trait. Trait and quality are then
tracked at the observation level.

---

## License

This project is licensed under the MIT License. See the `LICENSE.md` file for details.
