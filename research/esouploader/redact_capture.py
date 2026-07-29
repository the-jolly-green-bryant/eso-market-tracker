"""mitmproxy addon that records a sanitized HTTP flow summary as JSON Lines."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from mitmproxy import http

OUTPUT = Path(os.environ.get("ESO_CAPTURE_FILE", "captures/traffic.jsonl"))
SENSITIVE_HEADERS = {
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "x-bnet-key",
    "x-session-token",
    "x-src-fp",
}
SENSITIVE_QUERY_KEYS = {
    "access_token",
    "authorization",
    "code",
    "password",
    "refresh_token",
    "session",
    "token",
}
SENSITIVE_JSON_KEYS = SENSITIVE_QUERY_KEYS | {
    "accessToken",
    "refreshToken",
    "email",
    "username",
}


def _redact_url(url: str) -> str:
    parts = urlsplit(url)
    query = urlencode(
        [
            (key, "[REDACTED]" if key.lower() in SENSITIVE_QUERY_KEYS else value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
        ]
    )
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, ""))


def _headers(headers: http.Headers) -> dict[str, str]:
    return {
        key: "[REDACTED]" if key.lower() in SENSITIVE_HEADERS else value
        for key, value in headers.items(multi=True)
    }


def _body_metadata(message: http.Message) -> dict[str, object]:
    body = message.raw_content or b""
    metadata: dict[str, object] = {
        "size": len(body),
        "sha256": hashlib.sha256(body).hexdigest() if body else None,
        "content_type": message.headers.get("content-type"),
    }
    if (
        os.environ.get("ESO_CAPTURE_JSON_BODIES") == "1"
        and body
        and "json" in (message.headers.get("content-type") or "").lower()
    ):
        try:
            metadata["json"] = _redact_json(json.loads(message.get_text(strict=False)))
        except (json.JSONDecodeError, UnicodeDecodeError):
            metadata["json_parse_error"] = True
    return metadata


def _redact_json(value: object) -> object:
    if isinstance(value, dict):
        return {
            key: "[REDACTED]"
            if key in SENSITIVE_JSON_KEYS or key.lower() in SENSITIVE_JSON_KEYS
            else _redact_json(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_redact_json(item) for item in value]
    return value


def response(flow: http.HTTPFlow) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "started_at": flow.request.timestamp_start,
        "duration_ms": round(
            ((flow.response.timestamp_end or flow.request.timestamp_start)
             - flow.request.timestamp_start)
            * 1000,
            2,
        ),
        "request": {
            "method": flow.request.method,
            "url": _redact_url(flow.request.pretty_url),
            "headers": _headers(flow.request.headers),
            "body": _body_metadata(flow.request),
        },
        "response": {
            "status": flow.response.status_code,
            "headers": _headers(flow.response.headers),
            "body": _body_metadata(flow.response),
        },
    }
    with OUTPUT.open("a", encoding="utf-8") as output:
        output.write(json.dumps(record, sort_keys=True) + "\n")
