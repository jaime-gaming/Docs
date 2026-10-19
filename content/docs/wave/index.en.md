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

## Reading further in the repository

This guide summarizes and organizes. The repository also ships its own documentation, quite a bit longer, and it is worth knowing what exists and where.

| Document | Size | What it is |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/Wave/blob/main/README.md) | 8 KB | The presentation of the project |
| [`docs/ARCHITECTURE.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/ARCHITECTURE.md) | 43 KB | Scope and platform decision, layers and responsibilities, directory layout, data flow, models and persistence, playback state, browser integration, interface and accessibility, privacy and security, testing and future boundaries, lyrics and profiles, and the native Mix engine |
| [`docs/DESIGN.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/DESIGN.md) | 44 KB | The same document with one extra section at the end, "Release 0.1.0 refinements" |
| [`docs/API_REFERENCE.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/API_REFERENCE.md) | 34 KB | The internal API reference |
| [`docs/VALIDATION.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/VALIDATION.md) | 34 KB | The validation record: web, Android and Windows, publication and legal status, and the follow-up of each redesign |
| [`docs/DEVELOPMENT.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/DEVELOPMENT.md) | 31 KB | The development guide |
| [`docs/ROADMAP.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/ROADMAP.md) | 11 KB | The roadmap |
| [`docs/PLATFORMS.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/PLATFORMS.md) | 8 KB | The platforms in version 0.1.0 |
| [`PRIVACY.md`](https://github.com/jaime-gaming/Wave/blob/main/PRIVACY.md) | 6 KB | Privacy and local storage |
| [`docs/media/PROMO_PRODUCTION.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/media/PROMO_PRODUCTION.md) | 5 KB | The production of the 0.1.0 product film |
| [`CONTRIBUTING.md`](https://github.com/jaime-gaming/Wave/blob/main/CONTRIBUTING.md) | 5 KB | How to contribute |
| [`docs/RELEASE_NOTES_0.1.0.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/RELEASE_NOTES_0.1.0.md) | 4 KB | The release notes for 0.1.0 |
| [`CODE_OF_CONDUCT.md`](https://github.com/jaime-gaming/Wave/blob/main/CODE_OF_CONDUCT.md) | 3 KB | The code of conduct |
| [`docs/WINDOWS_RELEASE.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/WINDOWS_RELEASE.md) | 3 KB | The Windows release preparation |
| [`THIRD_PARTY_NOTICES.md`](https://github.com/jaime-gaming/Wave/blob/main/THIRD_PARTY_NOTICES.md) | 2 KB | The third-party notices |
| [`CHANGELOG.md`](https://github.com/jaime-gaming/Wave/blob/main/CHANGELOG.md) | 22 KB | The changelog |

> [!IMPORTANT]
> **`ARCHITECTURE.md` and `DESIGN.md` are not two different views.** They share their title and all twelve sections, and the only content separating them is six lines at the end of `DESIGN.md`: the "Release 0.1.0 refinements" section, which spells out the three-plus-two balanced grid for Home's collection shortcuts on phones, the playlist-like daily mixes page with explicit Play and Shuffle, the scroll reset on entry, touch targets of at least 44 px, the hierarchy of the independent Windows UI with its six Settings destinations, and provider coordination — without Web Locks scheduling is tab-local, and if storage is denied the client keeps its own spacing in memory without being able to promise a shared deadline across tabs.

## Where to go next

- [Installation](/wave/install/) — get it running in five minutes.
- [Features & usage](/wave/features/) — day to day with the player.
- [Platforms](/wave/platforms/) — what exists on web, Windows and Android.
- [Architecture](/wave/architecture/) — layers, data flow and modules.
- [Privacy & data](/wave/privacy/) — what is stored, where, and what leaves the device.
- [Development](/wave/dev/) — requirements, commands, browser tests and the ten typical failures.
