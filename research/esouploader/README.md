# ESO uploader protocol research

This folder contains a reproducible, secret-redacting capture harness for the
unofficial `ESOAddonUploaderCli`. It is intended for interoperability research
using an account and addons you control.

## Safety boundaries

- Captures are gitignored.
- Authorization, cookies, common token query parameters, and response cookies
  are replaced with `[REDACTED]`.
- Bodies are not stored. Only their byte size, content type, and SHA-256 digest
  are recorded.
- Start with `list` and `download`. Use `upload --dry-run --no-publish` only
  with a disposable addon. A real upload creates server-side state even when it
  is not published.
- Do not commit `credentials.json`, `session.json`, raw proxy flows, or tokens.

## Setup

Install `mitmproxy` outside this repository, then initialize its local CA:

```sh
mitmdump
```

Stop it after it starts. On macOS, authenticate once without putting a password
on the command line:

```sh
./ESOAddOnUploaderCli.dmg login --session ./session.json
```

The CLI warns that frequent implicit login/logout attempts may trigger rate
limits or an account-security reset, so reuse the session file.

## Capture

```sh
research/esouploader/capture.sh \
  download 2a88cc14-8e8c-4b73-9605-2e1d7c764e23 \
  --session ./session.json \
  --output /tmp/tsc.zip \
  --no-progress
```

Then capture discovery and a non-publishing upload rehearsal:

```sh
research/esouploader/capture.sh list --session ./session.json

research/esouploader/capture.sh \
  upload /path/to/disposable-addon.zip \
  --addon-id YOUR_DISPOSABLE_ADDON_ID \
  --version protocol-test \
  --note "Protocol capture; do not publish" \
  --dry-run \
  --no-publish \
  --session ./session.json \
  --no-progress
```

The resulting JSONL files under `captures/` are suitable for comparing endpoint
sequences, methods, headers, status codes, content types, and payload sizes.
Because bodies and secrets are deliberately omitted, a second, narrowly scoped
capture may be needed to infer individual JSON field names after the endpoint
sequence is understood.

Set `ESO_CAPTURE_JSON_BODIES=1` for that second pass. JSON bodies will be
included after recursively redacting common credential and identity fields.
Binary and non-JSON bodies are never included.

## Expected protocol phases

The CLI's observable output and public usage notes suggest this upload state
machine:

1. authenticate or validate an existing session;
2. fetch addon metadata and existing releases;
3. create a release;
4. prepare upload and remove incomplete uploads;
5. upload one archive (or loose files in legacy mode);
6. poll file validation;
7. finalize the release;
8. optionally publish it.

Treat this as a hypothesis until each phase is confirmed by a sanitized capture.
