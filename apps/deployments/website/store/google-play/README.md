# Google Play release

This directory is the source of truth for the ESO Market Tracker Play Store
listing. The Android workflow validates and uploads the listing text, app icon,
feature graphic, phone screenshots, support contact, release notes, and signed
app bundle.

## One-time account setup

The Play Console app must use the existing package name:
`eso_market_tracker.bryantjames.com`.

Configure these GitHub repository secrets:

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: the Google Play service account used by
  the other Bryant James Android apps, with access to ESO Market Tracker.
- `ANDROID_KEYSTORE_BASE64`: the original ESO Market Tracker upload keystore,
  base64-encoded.
- `ANDROID_KEYSTORE_PASSWORD`: upload-keystore password.
- `ANDROID_KEY_ALIAS`: upload-key alias.
- `ANDROID_KEY_PASSWORD`: upload-key password.

Do not substitute another app's upload key. The original ESO Market Tracker
keystore must be retained for upgrades to the existing package.

Some Play Console declarations are not writable through the Android Publisher
API. Use `content-declarations.json` to complete Data safety, App access,
Target audience, Content rating, Ads, and related policy forms. Set the app
category to **Tools** and the privacy policy to
`https://esomarkettracker.com/privacy-policy`.

Google Play has no hidden keyword field. Search terms are written naturally
into `listing.json`; the validator protects the important phrases without
resorting to metadata spam. Keep the listing accurate and avoid repetitive
keyword blocks.

## Automated release

Every relevant pull request builds a validation AAB. Once all five repository
secrets are configured:

- Every relevant push to `main` automatically publishes to the `alpha`
  closed-testing track.
- An `android-vX.Y.Z` tag automatically publishes to production.
- A manual run can publish to either `alpha` or `production`.

Each publish increments the existing version-code baseline and synchronizes the
repository-backed listing before committing the Play edit.

If signing or service-account credentials are absent, the workflow still builds
and validates the app, then names the missing secrets in its summary. Google
Play must also show an active, verified developer account; API commits cannot
publish while the developer profile is restricted or removed.
