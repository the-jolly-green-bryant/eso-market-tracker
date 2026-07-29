# Observed Bethesda ESO addon protocol

Observed with `ESOAddonUploaderCli` 1.4.0 on 2026-07-28. This is an
interoperability note, not an official API contract.

## Authentication

The client authenticates against:

```text
POST https://api.bethesda.net/session/login
```

Subsequent API requests carry Bethesda-specific application and session
headers. Their values must be treated as secrets and are intentionally omitted.
The session has a server-side logout operation and a short expiration.

Do not expose this login flow directly to browser JavaScript. A web application
would otherwise need to handle Bethesda passwords and session tokens. Prefer a
local companion client or a server-side, encrypted, short-lived session.

## Download

Metadata:

```text
GET https://api.bethesda.net/ugcmods/v2/content/{content_id}
```

The response envelope is:

```text
platform
  code
  message
  response
```

Relevant fields under `platform.response`:

- `content_id`, `title`, `description`, `overview`, and `author_displayname`
- `hardware_platforms`
- `download[]`, grouped by `hardware_platform`
- `download[].published[]`, containing `version_id`, `version_name`,
  `note_id`, and `client`
- `client`, a map of logical file IDs to `download_url`, `etag`, `size`, and
  `ctime`
- `release_notes[]`

For the observed compressed addon, `client` contained a manifest plus numbered
binary objects. Each binary `download_url` was an unauthenticated CDN URL under:

```text
https://ugcmods.bethesda.net/public/ESO/client/...
```

The manifest is JSON and maps the numbered binary objects back to archive
paths. The open-source downloader can therefore:

1. fetch authenticated metadata;
2. select a platform and published version;
3. download the manifest;
4. download each referenced binary URL concurrently;
5. verify the advertised size and ETag;
6. reconstruct a ZIP using the manifest paths.

The closed client also sends optional analytics:

```text
PUT https://api.bethesda.net/ugcmods/v2/stats/download_start
PUT https://api.bethesda.net/ugcmods/v2/stats/download_end
```

Observed JSON body:

```json
{
  "content_id": "{content_id}",
  "hardware_platform": "WINDOWS",
  "logging_platform_id": 10
}
```

These analytics calls are not required to retrieve the CDN objects, but whether
the metadata service expects them should be tested before omitting them.

## Listing authored addons

```text
GET https://api.bethesda.net/ugcmods/v2/content/me
    ?sort=utime
    &order=desc
    &page=1
    &size=50
    &deleted=false
```

Response shape:

```json
{
  "page": 1,
  "size": 50,
  "total": 0,
  "data": []
}
```

The account used for this exploration owned no addons, so upload endpoints were
not exercised.

## Confirmed content creation

Bethesda's production web client exposes a typed update operation:

```text
PUT https://api.bethesda.net/ugcmods/v2/content/{content_id}
Content-Type: application/json
```

Its accepted body schema is:

```ts
type UpdateContent = {
  title?: string
  description?: string
  overview?: string
  hardware_platforms?: string[]
  language?: string
  categories?: string[]
  custom_data?: Record<string, unknown>
  deleted?: boolean
  blocklisted?: boolean
  moderated?: boolean
  beta?: boolean
  maintenance?: boolean
  restricted?: boolean
  required_mods?: string[]
  required_dlc?: string[]
  author_price?: number
  achievement_friendly?: boolean
  default_locale?: string
  supported_locales?: string[]
  auto_translation_settings?: {
    enabled?: boolean
    auto_publish_enabled?: boolean
  }
}
```

Content creation was confirmed on 2026-07-28:

```text
POST https://api.bethesda.net/ugcmods/v2/content
```

The following payload returned HTTP `201 Created`:

```json
{
  "title": "API Interoperability Test Draft",
  "description": "Unpublished API interoperability test. Safe to delete.",
  "overview": "Unpublished API interoperability test.",
  "product": "ESO",
  "content_type": "STANDARD",
  "hardware_platforms": ["WINDOWS", "PLAYSTATION5", "XBOXSERIESX"],
  "categories": ["CATEGORY_FROM_GET_CATEGORIES"],
  "default_locale": "EN",
  "supported_locales": ["EN"]
}
```

The created record had:

```json
{
  "content_id": "31a8d33f-282d-4c04-991e-3f6bca3ef7a9",
  "product": "ESO",
  "content_type": "STANDARD",
  "published": false,
  "status": "STATUS_INITIAL",
  "editable": true,
  "download": [],
  "release_notes": []
}
```

The response uses the standard `platform.code`, `platform.message`, and
`platform.response` envelope. `product` and `content_type` appear immutable:
they are accepted at creation but absent from the update schema.

This confirms a sufficient creation schema, but not the minimal required field
set. Further validation probing is unnecessary for building a client because
the accepted payload is small and explicit.

Discover valid categories with:

```text
GET https://api.bethesda.net/ugcmods/v2/categories?product=ESO
```

The exact category query parameters still need confirmation.

## Confirmed content-management endpoints

These method/path pairs are embedded in Bethesda's production web client:

```text
PUT     /ugcmods/v2/content/{id}
DELETE  /ugcmods/v2/content/{id}
PUT     /ugcmods/v2/content/{id}/publish
DELETE  /ugcmods/v2/content/{id}/unpublish

GET     /ugcmods/v2/content/{id}/release-notes
PUT     /ugcmods/v2/content/{id}/release-notes/{note_id}
DELETE  /ugcmods/v2/content/{id}/release-notes/{note_id}
DELETE  /ugcmods/v2/content/{id}/release-notes/{note_id}/downloads

POST    /ugcmods/v2/content/{id}/media
PUT     /ugcmods/v2/content/{id}/locale/{locale}
DELETE  /ugcmods/v2/content/{id}/locale/{locale}
```

The release-note update body is:

```ts
type UpdateReleaseNote = {
  version_name: string
  note: string
  published?: boolean | 0 | 1
}
```

The `downloads` deletion endpoint accepts a `hardware_platforms` query value.

## Confirmed binary-upload endpoints

Official ESO uploader error logs expose:

```text
POST /ugcmods/v2/upload/initiate
POST /ugcmods/v2/upload/complete
```

The errors confirm a multipart protocol: `initiate` establishes one active
upload for a content item, and `complete` checks that the submitted part count
matches the expected count. A cancel operation is referenced by the API error,
but its exact method/path is not yet confirmed.

## Upload hypothesis

CLI output establishes the following phases, but endpoint paths and payloads
remain unconfirmed:

1. fetch addon metadata and existing releases;
2. create a release;
3. prepare the upload;
4. remove incomplete uploads;
5. upload one archive or multiple loose files;
6. poll validation;
7. finalize the release;
8. optionally publish.

Capture upload only against an addon owned by the test account. Begin with
`--dry-run --no-publish`; confirm from the traffic whether `--dry-run` avoids
release creation before relying on it.
