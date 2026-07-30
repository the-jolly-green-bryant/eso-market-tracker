#!/usr/bin/env python3
"""Upload an Android bundle and synchronize the Google Play store listing."""

import glob
import json
import mimetypes
import os
import sys

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account


PACKAGE_NAME = os.environ["PLAY_PACKAGE_NAME"]
TRACK = os.environ.get("PLAY_TRACK", "alpha")
RELEASE_NAME = os.environ["PLAY_RELEASE_NAME"]
APP_BUNDLE_PATH = os.environ["PLAY_APP_BUNDLE_PATH"]
LISTING_PATH = os.environ["PLAY_LISTING_PATH"]
ASSET_DIRECTORY = os.environ["PLAY_ASSET_DIRECTORY"]
RELEASE_NOTES_PATH = os.environ["PLAY_RELEASE_NOTES_PATH"]
BASE_URL = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications"
UPLOAD_BASE_URL = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications"


def request(session, method, url, **kwargs):
    response = session.request(method, url, timeout=120, **kwargs)
    if not response.ok:
        print(response.text, file=sys.stderr)
        response.raise_for_status()
    return response.json() if response.content else {}


def upload_image(session, edit_id, language, image_type, image_path):
    listing_image_url = (
        f"{BASE_URL}/{PACKAGE_NAME}/edits/{edit_id}/listings/"
        f"{language}/{image_type}"
    )
    request(session, "DELETE", listing_image_url)
    upload_url = (
        f"{UPLOAD_BASE_URL}/{PACKAGE_NAME}/edits/{edit_id}/listings/"
        f"{language}/{image_type}?uploadType=media"
    )
    mime_type = mimetypes.guess_type(image_path)[0] or "application/octet-stream"
    with open(image_path, "rb") as image_file:
        request(
            session,
            "POST",
            upload_url,
            data=image_file,
            headers={"Content-Type": mime_type},
        )


def main():
    with open(LISTING_PATH, encoding="utf-8") as listing_file:
        listing = json.load(listing_file)
    with open(RELEASE_NOTES_PATH, encoding="utf-8") as notes_file:
        release_notes = notes_file.read().strip()[:500]

    language = listing.get("language", "en-US")
    credentials_info = json.loads(os.environ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON"])
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=["https://www.googleapis.com/auth/androidpublisher"],
    )
    session = AuthorizedSession(credentials)
    edits_url = f"{BASE_URL}/{PACKAGE_NAME}/edits"
    edit_id = request(session, "POST", edits_url, json={})["id"]
    edit_url = f"{edits_url}/{edit_id}"

    try:
        bundle_path = os.path.abspath(APP_BUNDLE_PATH)
        if not os.path.isfile(bundle_path):
            raise FileNotFoundError(f"Android App Bundle not found: {bundle_path}")
        bundle_url = (
            f"{UPLOAD_BASE_URL}/{PACKAGE_NAME}/edits/{edit_id}/bundles"
            "?uploadType=media"
        )
        with open(bundle_path, "rb") as bundle_file:
            bundle = request(
                session,
                "POST",
                bundle_url,
                data=bundle_file,
                headers={"Content-Type": "application/octet-stream"},
            )
        version_codes = [str(bundle["versionCode"])]

        request(
            session,
            "PUT",
            f"{edit_url}/listings/{language}",
            json={
                "language": language,
                "title": listing["title"][:30],
                "shortDescription": listing["shortDescription"][:80],
                "fullDescription": listing["fullDescription"][:4000],
            },
        )
        request(
            session,
            "PUT",
            f"{edit_url}/details",
            json={
                "defaultLanguage": language,
                "contactEmail": listing["supportEmail"],
                "contactWebsite": listing["supportUrl"],
            },
        )

        upload_image(
            session,
            edit_id,
            language,
            "icon",
            os.path.join(ASSET_DIRECTORY, "icon-512.png"),
        )
        upload_image(
            session,
            edit_id,
            language,
            "featureGraphic",
            os.path.join(ASSET_DIRECTORY, "feature-graphic.png"),
        )

        screenshot_paths = sorted(
            glob.glob(os.path.join(ASSET_DIRECTORY, "phone-screenshots", "*"))
        )
        if len(screenshot_paths) < 2:
            raise ValueError("Google Play requires at least two phone screenshots")
        screenshot_url = (
            f"{edit_url}/listings/{language}/phoneScreenshots"
        )
        request(session, "DELETE", screenshot_url)
        for screenshot_path in screenshot_paths:
            upload_url = (
                f"{UPLOAD_BASE_URL}/{PACKAGE_NAME}/edits/{edit_id}/listings/"
                f"{language}/phoneScreenshots?uploadType=media"
            )
            mime_type = (
                mimetypes.guess_type(screenshot_path)[0]
                or "application/octet-stream"
            )
            with open(screenshot_path, "rb") as screenshot_file:
                request(
                    session,
                    "POST",
                    upload_url,
                    data=screenshot_file,
                    headers={"Content-Type": mime_type},
                )

        request(
            session,
            "PUT",
            f"{edit_url}/tracks/{TRACK}",
            json={
                "track": TRACK,
                "releases": [
                    {
                        "name": RELEASE_NAME,
                        "versionCodes": version_codes,
                        "status": "completed",
                        "releaseNotes": [
                            {"language": language, "text": release_notes}
                        ],
                    }
                ],
            },
        )
        request(session, "POST", f"{edit_url}:commit", json={})
        print(
            json.dumps(
                {
                    "packageName": PACKAGE_NAME,
                    "track": TRACK,
                    "status": "completed",
                    "versionCodes": version_codes,
                    "listingTitle": listing["title"],
                    "listingIconUpdated": True,
                    "featureGraphicUpdated": True,
                    "phoneScreenshotCount": len(screenshot_paths),
                }
            )
        )
    except Exception:
        session.delete(edit_url, timeout=60)
        raise


if __name__ == "__main__":
    main()
