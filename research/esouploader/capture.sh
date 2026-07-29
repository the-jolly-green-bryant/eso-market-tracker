#!/bin/sh
set -eu

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
CLI=${ESO_UPLOADER_CLI:-"$REPO_ROOT/ESOAddOnUploaderCli.dmg"}
CAPTURE_ROOT=${ESO_CAPTURE_ROOT:-"$REPO_ROOT/research/esouploader/captures"}
PROXY_PORT=${ESO_PROXY_PORT:-8081}
MITM_CERT=${ESO_MITM_CERT:-"$HOME/.mitmproxy/mitmproxy-ca-cert.pem"}

if ! command -v mitmdump >/dev/null 2>&1; then
  echo "mitmdump is required. Install mitmproxy in an isolated environment first." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <login|list|download|upload> [arguments...]" >&2
  exit 2
fi

mkdir -p "$CAPTURE_ROOT"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
CAPTURE_FILE="$CAPTURE_ROOT/$STAMP-$1.jsonl"
MITM_LOG="$CAPTURE_ROOT/$STAMP-mitm.log"

ESO_CAPTURE_FILE="$CAPTURE_FILE" \
ESO_CAPTURE_JSON_BODIES="${ESO_CAPTURE_JSON_BODIES:-0}" \
mitmdump \
  --listen-host 127.0.0.1 \
  --listen-port "$PROXY_PORT" \
  --set block_global=false \
  --scripts "$REPO_ROOT/research/esouploader/redact_capture.py" \
  >"$MITM_LOG" 2>&1 &
MITM_PID=$!
trap 'kill "$MITM_PID" 2>/dev/null || true; wait "$MITM_PID" 2>/dev/null || true' EXIT INT TERM

i=0
while ! nc -z 127.0.0.1 "$PROXY_PORT" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 50 ]; then
    echo "mitmdump did not start; see $MITM_LOG" >&2
    exit 1
  fi
  sleep 0.1
done

if [ ! -f "$MITM_CERT" ]; then
  echo "mitmproxy CA not found at $MITM_CERT; run mitmdump once and retry." >&2
  exit 1
fi

echo "Writing sanitized request metadata to $CAPTURE_FILE"
HTTPS_PROXY="http://127.0.0.1:$PROXY_PORT" \
HTTP_PROXY="http://127.0.0.1:$PROXY_PORT" \
DENO_CERT="$MITM_CERT" \
SSL_CERT_FILE="$MITM_CERT" \
NO_COLOR=1 \
"$CLI" "$@"
