"""Opt-in mitmproxy addon for one authenticated content-creation experiment.

The addon borrows in-memory authentication headers from a successful `/content/me`
request. It never writes those headers to disk.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import httpx
from mitmproxy import http

API_ROOT = "https://api.bethesda.net/ugcmods/v2"
OUTPUT = Path(os.environ.get("ESO_CREATE_RESULT", "captures/create-result.json"))
PAYLOAD_FILE = os.environ.get("ESO_CREATE_PAYLOAD")
PROBE_ENABLED = os.environ.get("ESO_ENABLE_CREATE_PROBE") == "1"
_attempted = False


def response(flow: http.HTTPFlow) -> None:
    global _attempted
    if (
        not PROBE_ENABLED
        or _attempted
        or not PAYLOAD_FILE
        or flow.response.status_code != 200
        or not flow.request.pretty_url.startswith(f"{API_ROOT}/content/me?")
    ):
        return

    _attempted = True
    payload = json.loads(Path(PAYLOAD_FILE).read_text(encoding="utf-8"))
    headers = {
        key: value
        for key, value in flow.request.headers.items()
        if key.lower()
        not in {"accept-encoding", "content-length", "content-type", "host"}
    }
    headers["content-type"] = "application/json"

    try:
        result = httpx.post(
            f"{API_ROOT}/content",
            headers=headers,
            json=payload,
            timeout=30,
        )
        try:
            response_body: object = result.json()
        except json.JSONDecodeError:
            response_body = result.text[:4000]
        record = {"status": result.status_code, "response": response_body}
    except Exception as error:
        record = {"status": 0, "error": str(error)}

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(record, indent=2, sort_keys=True), encoding="utf-8")
