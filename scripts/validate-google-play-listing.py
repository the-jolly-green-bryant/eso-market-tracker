#!/usr/bin/env python3
"""Validate the repository-backed Google Play listing before building Android."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STORE_DIRECTORY = (
    ROOT / "apps" / "deployments" / "website" / "store" / "google-play"
)
LISTING_PATH = STORE_DIRECTORY / "listing.json"
REQUIRED_TERMS = (
    "elder scrolls online",
    "price tracker",
    "tsc",
    "tamriel savings",
    "eso",
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    with LISTING_PATH.open(encoding="utf-8") as listing_file:
        listing = json.load(listing_file)

    title = listing.get("title", "").strip()
    short_description = listing.get("shortDescription", "").strip()
    full_description = listing.get("fullDescription", "").strip()
    searchable_text = " ".join(
        (title, short_description, full_description)
    ).lower()

    require(1 <= len(title) <= 30, "Play title must contain 1-30 characters")
    require(
        1 <= len(short_description) <= 80,
        "Play short description must contain 1-80 characters",
    )
    require(
        1 <= len(full_description) <= 4000,
        "Play full description must contain 1-4,000 characters",
    )
    for term in REQUIRED_TERMS:
        require(term in searchable_text, f"Play listing is missing term: {term}")

    require(
        listing.get("privacyPolicyUrl", "").startswith("https://"),
        "Play privacy policy must use HTTPS",
    )
    require(
        "@" in listing.get("supportEmail", ""),
        "Play support email is missing or invalid",
    )

    required_assets = (
        STORE_DIRECTORY / "icon-512.png",
        STORE_DIRECTORY / "feature-graphic.png",
        STORE_DIRECTORY / "release-notes.txt",
    )
    for asset_path in required_assets:
        require(asset_path.is_file(), f"Missing Play asset: {asset_path.name}")
        require(asset_path.stat().st_size > 0, f"Empty Play asset: {asset_path.name}")

    screenshots = sorted(
        path
        for path in (STORE_DIRECTORY / "phone-screenshots").glob("*")
        if path.is_file()
    )
    require(
        len(screenshots) >= 2,
        "Google Play requires at least two phone screenshots",
    )

    print(
        "Google Play listing valid: "
        f"{len(title)}/30 title, "
        f"{len(short_description)}/80 short description, "
        f"{len(full_description)}/4000 full description, "
        f"{len(screenshots)} phone screenshots"
    )


if __name__ == "__main__":
    main()
