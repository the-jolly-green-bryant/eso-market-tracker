# Google Play release

This directory is the source of truth for the ESO Market Tracker Play Store
listing. The Android workflow uploads the listing text, app icon, feature
graphic, phone screenshots, support contact, release notes, and signed app
bundle to the `alpha` closed-testing track.

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

## Release

Every relevant pull request and `main` push builds an unsigned validation AAB.
To publish a signed closed-testing release:

1. Push an `android-vX.Y.Z` tag, or run the **Android app** workflow manually
   with `publish` enabled.
2. Confirm the workflow's Play publishing summary.
3. Promote the tested release in Play Console when it is ready for production.

Each publish increments the existing version-code baseline and synchronizes the
repository-backed listing before committing the Play edit.
