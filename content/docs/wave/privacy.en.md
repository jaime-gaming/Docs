---
title: "Privacy & data"
icon: "shield"
order: 60
blurb: "what is stored, where, and what leaves the device."
description: "What Wave stores, where it stores it, what leaves the device and what can make it disappear."
updated: "2026-10-18"
---

Wave has no backend, no accounts, no analytics and no remote audio services. This page details exactly what is stored, where, and the only two things that can leave the device.

## What does not exist

- **No backend.** There is no Wave server anything is sent to.
- **No accounts.** Nobody signs in. There is no user identity.
- **No analytics.** Usage is not measured and events are not recorded.
- **No remote audio services.** Audio is never uploaded.
- **No telemetry.** There are no automatic crash reports.

## What is stored and where

Everything lives in the browser's storage, tied to **one browser profile and one specific origin**.

| What | How it is stored |
| --- | --- |
| Audio | A single copy, at original quality. Not recompressed. |
| Covers | Compact JPEGs. |
| Lyrics | Raw text once; parsed lines are reconstructed on load. |
| Library and favorites | IndexedDB. |
| Playlists, preferences and state | IndexedDB, with version migration. |
| Metadata overrides | Local. They are not written into your files. |

Imported files are committed to storage **immediately**, without needing to be played or selected.

On Windows the arrangement is analogous but native: original audio goes to `%LOCALAPPDATA%/Wave/audio`, and library, playlists, preferences and listening state use atomically replaced JSON files. On Android the document picker copies the original bytes into app-private storage.

> [!WARNING]
> **Keep your original files.** Wave is a player, not a backup system. Clearing site data, browsing privately, quota limits or automatic storage eviction can remove the collection, the playlists and the edits.

## The two things that can leave the device

### 1. Automatic lyric lookup

It uses the public **LRCLIB** API and ships **disabled**. It is enabled explicitly in Settings.

- **Sent:** song metadata (title, artist, duration).
- **The provider also sees** connection information such as the IP address.
- **The downloaded text stays local.**

Clients reuse results already saved, coordinate requests and respect the provider's retry deadlines. Web uses a shared 500 ms queue, same-origin Web Locks when supported, concurrent lookup sharing and safelisted headers. None of these measures removes provider-side or IP limits.

Imported LRC files and saved lyrics work **offline**.

### 2. Initial application load

Browser-facing resources use same-origin URLs. Once the application has loaded, local playback and saved lyrics **need no network access**.

> [!NOTE]
> An installable PWA and reliable offline startup are **not implemented yet**. Today the network is needed for the first load.

## Deduplication and originals

Deduplication uses **SHA-256 of the whole file**: identical bytes are skipped even when filenames or dates change, and legacy IDs and playlist references are preserved.

Originals are **never modified or deleted**. Removing a track removes only Wave's stored copy and its playlist references. Deleting a playlist affects no audio file. Metadata edits and custom covers are local overrides: Wave does not rewrite or export tags.

## Persistent storage

Storage is specific to the browser profile and the site origin. A different preview URL can have a different library: that is expected behaviour, not a bug.

**Settings → Storage → Browser storage** reports:

- Size estimates for audio, covers and lyrics.
- Origin usage and quota, when the browser supports it.

Import automatically requests persistent storage. The **Protect stored files** button can request it again. **The browser may deny protection.**

> [!IMPORTANT]
> Persistent storage reduces the risk of automatic eviction, but it does **not** compress audio below its original size and it does **not** replace a backup.

## Secure connection

**HTTPS** is needed for Web Crypto and for storage persistence. On `localhost` the browser treats the origin as secure; on a remote preview without HTTPS some features may fail.

## Rights and scope

That the client is public, free and open source describes **the client distribution**, not a permission to distribute music, lyrics or covers. The MIT license covers Wave's code; whatever you play with it remains subject to its authors' rights.

No deployed Pages site, signed native package or legal clearance over third-party content is claimed. Accounts, Spotify, Deezer and Firebase integrations remain deferred.

## What to check if privacy worries you

1. **Settings → Lyrics**: confirm automatic lookup is disabled if you do not want it.
2. **Settings → Storage**: look at origin usage and request protection if the browser allows it.
3. **Your files**: keep the originals outside the browser.
4. **Site data**: remember that clearing it deletes Wave's collection.
