---
description: "What Wave is, which problem it solves and where version 0.1.0 currently stands."
updated: "2026-10-18"
---

Wave is a **local-first** music player: bring your own audio files and Wave organises them, searches them and plays them without uploading them to any server. No account, no subscription, no backend, no analytics.

> [!NOTE]
> Version **0.1.0**, released on **17 October 2026**. It is the first fully working release of the web client, accompanied by independent native clients for Windows and Android.

## The problem it solves

Streaming players are useless for the music you already own: CD rips, Bandcamp downloads, your own recordings or inherited collections. The local alternatives are usually heavy desktop applications, or projects that require creating an account and uploading your library to somebody else's cloud.

Wave sits in between:

- **It runs in the browser**, with nothing to install in most cases.
- **The files never leave the device.** They are stored in the browser's own storage.
- **There is nothing to configure**: open it, add music, press play.

## What it lets you do

| Area | What it includes |
| --- | --- |
| **Library** | Songs, albums, artists and favorites; search by title, artist and album; sorting by import date, title or artist. |
| **Daily mixes** | Selections generated from your own genre and artist tags. You see them before playing, you can shuffle them and save them as an editable playlist. |
| **Playlists** | Create, rename, add and remove songs, reorder with buttons or keyboard, choose cover and description, and delete without touching the audio. |
| **Playback** | Play, pause, previous, next, position bar, volume, shuffle, repeat one and repeat all. Editable queue and system controls where the browser supports them. |
| **Lyrics** | Enhanced LRC, line fill and optional LRCLIB lookup. Saved lyrics work offline. |
| **Appearance** | Light, dark or system theme; palettes derived from artwork; larger text and reduced motion. |

## The three implementations

Wave is not one website wrapped three times. They are three independent clients that share the data model and the design intent:

- **Web** — React 19, TypeScript and Vite. The most complete client, and the one that sets the pace for the others.
- **Windows** — C# and WPF with Windows Media Player. A real native application, not a WebView.
- **Android** — Kotlin and Jetpack Compose, minimum API 26. Experimental, with a smaller feature set.

Each platform's library is **separate**: they are never synchronised or silently migrated. See the full comparison in [Platforms](/wave/platforms/).

## Technical stack

```text
Web       React 19 · TypeScript · Vite · IndexedDB (idb)
          music-metadata · motion · lucide-react · Nunito Sans
Windows   C# · WPF · .NET 10 · Windows Media Player
Android   Kotlin · Jetpack Compose · Gradle 8.13 · JDK 17 · API 26+
Testing   Vitest · Testing Library · Playwright · fake-indexeddb
Quality   ESLint · Prettier · strict tsc -b
```

## State and known limits

What **is** implemented in the web client:

- Import through the file picker and through drag and drop, with progress, validation and duplicate detection.
- Embedded metadata and artwork, with conservative inference from the filename when there are no tags.
- IndexedDB persistence for files and favorites, with version-1 library migration.
- Local metadata editing with restoration of the original.
- Unit, component and browser test suite.

What **is not** there yet:

- Installable PWA and reliable offline startup.
- Drag-and-drop queue reordering.
- Library backup and restore.
- Folder import with explicit permission.
- Code signing on the native installers: the Windows ZIPs and the Android APK are **unsigned** test artifacts.

> [!WARNING]
> Wave is a player, not a backup system. Browser storage can be wiped when you clear site data, browse privately or through automatic eviction. **Always keep your original files.**

## License and references

Wave is released under the **MIT License**. Dependencies retain their own licenses.

[PixelPlayer](https://github.com/PixelPlayerHQ/PixelPlayer) is the reference for local library organisation and player interaction, but Wave is an independent implementation: it includes no PixelPlayer source code, artwork or branding. It is also not affiliated with, sponsored by or endorsed by PixelPlayer or Spotify AB.

## Where to go next

- [Installation](/wave/install/) — get it running in five minutes.
- [Features & usage](/wave/features/) — day to day with the player.
- [Platforms](/wave/platforms/) — what exists on web, Windows and Android.
- [Architecture](/wave/architecture/) — layers, data flow and modules.
- [Privacy & data](/wave/privacy/) — what is stored, where, and what leaves the device.
