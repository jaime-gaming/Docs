---
title: "Platforms"
icon: "monitor"
order: 40
blurb: "what exists on web, Windows and Android."
description: "Real comparison between the web, Windows and Android clients: what exists in each and what is missing."
updated: "2026-10-18"
---

Wave has **three independent implementations**, not WebView or Electron wrappers around the same website. The web client is the most complete; Windows follows its structure with native C#/WPF controls and Android uses Kotlin/Compose.

> [!IMPORTANT]
> Each platform's library is separate. They are never synchronised or silently migrated: what you import in the browser does not appear on Windows or Android.

## Capability comparison

| Capability | Web | Windows | Android |
| --- | --- | --- | --- |
| Home, local library and favorites | Yes | Yes | Basic |
| Dedicated search | Yes | Song search | Library filter |
| Albums and artists | Profiles and artwork | Native group and detail views | Basic list |
| Browsable daily mixes and saved snapshots | Genre and artist tags | Genre and artist tags | Not yet |
| Ordered playlists | Yes | Create, edit, membership and order | Not yet |
| Queue editing | Drag, buttons and keyboard | Native dialog; move and remove | Basic progression |
| Restored paused position | Yes | Yes | Not yet |
| Automatic Mix and local Autoplay | Pair timing and weighted variety | Bounded duration and local variety | Manual overlap only |
| Lyrics | Enhanced LRC, fill and optional lookup | Line LRC, fill and explicit lookup | Line LRC and lookup |
| Settings | Six menus | Six menus | Basic page |
| Appearance | Light, dark and system; artwork palettes | Light, dark, larger text and motion | Dark |
| Cover editing | Song, playlist and artist | Song covers | Not yet |
| System media controls and idle stage | Browser-dependent / yes | Not yet | No foreground service yet |
| Hosted build checks | Passed | Passed + contracts + WPF layout smoke | Passed: unit, lint and debug build |

## Browser and GitHub Pages

Node.js 22.12 or later, or Node 24:

```sh
npm ci && npm run dev     # development
npm run build             # production
```

For a repository path, `WAVE_BASE_PATH=/Wave/ npm run build` and serve it under `/Wave/`.

Deployment without a custom workflow is done in **Settings → Pages → Deploy from a branch**, with **Branch: main** and **Folder: /docs**. The compiled site is committed in `docs/index.html` and `docs/site-assets/`, and `.nojekyll` disables Jekyll.

Two browser facts matter:

- Libraries are specific to the **site origin and the profile**. A different preview URL can have a different library.
- **HTTPS** is needed for Web Crypto and for persistence.

No backend or API keys are needed. The full steps are in [Installation](/wave/install/).

## Windows

A real native application in **C# and WPF** with Windows Media Player and the standard system file pickers.

```powershell
dotnet build platforms/windows/Wave.Windows -c Release
dotnet run --project platforms/windows/Wave.Windows
dotnet publish platforms/windows/Wave.Windows -c Release -r win-x64 --self-contained false -o artifacts/windows
```

### Where it stores things

| What | Where |
| --- | --- |
| Original audio | `%LOCALAPPDATA%/Wave/audio` |
| Library, playlists, preferences and state | Atomically replaced JSON files |
| Covers | Separate local overrides |

Existing libraries and preferences remain readable. The old, now disabled, overlap preference migrates without silently enabling Mix.

### What the application is like

Home has collection shortcuts, daily mixes and album cards. Search is its own destination: title and cover play, artist and album open their collection, and compact-player information opens **Now Playing**.

Playlists can be created, renamed, populated, ordered and deleted without deleting audio. Queue edits preserve the active recording. Restored sessions come back paused. Settings separates Appearance, Playback, Lyrics, Library, Storage and About.

### What CI checks

CI runs a dependency-free contract runner, compiles and publishes the application, and launches an isolated WPF smoke mode that walks Home, Search, daily mixes, saved playlists, the six Settings sections and narrow light-theme layout. It captures PNGs in `wave-windows-ui-smoke`.

> [!WARNING]
> That is **not** a physical-device or codec and playback matrix. The test library is temporary and does not touch anybody's real library.

### What is missing on Windows

Metadata reading remains limited to **ID3 and WAV**. Still not there: automatic extraction of embedded artwork, web-identical search grouping, artist photos, album ordering, word-stamped LRC, waveform analysis, immersive idle mode and system media integration.

Operating system codecs govern playback. **This is not complete web parity.**

Test ZIPs are clearly labelled unsigned. Upstream .NET licenses and notices remain bundled; future self-contained packages will have to inventory their exact runtime pack. Checksums, signing and Defender limits are in the repository's `docs/WINDOWS_RELEASE.md`.

## Android

Independent native project in **Kotlin and Jetpack Compose**.

| Requirement | Version |
| --- | --- |
| JDK | 17 |
| SDK and build tools | 36 |
| Gradle | 8.13 |
| Android Studio | Supporting AGP 8.13 |
| Minimum API | 26 |

```sh
gradle -p platforms/android testDebugUnitTest lintDebug assembleDebug
```

Output: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`, a debug test artifact. The Ubuntu CI runner provides the SDK. Tests cover the LRC and gain contracts; hosted unit, lint and assembly checks have passed.

Remaining gates: real-device import and playback, rotation-safe lifecycle, audio focus, foreground service with media session, and signing.

> [!IMPORTANT]
> The document picker copies the original bytes into app-private storage. **Uninstalling removes that copy.** It is not a replacement for your files, and it does not yet replace the web edition.

## Lyric-service traffic

All three clients keep **LRCLIB as the only online lyric provider**.

- **Web** uses a shared 500 ms queue, same-origin Web Locks when supported, concurrent lookup sharing and safelisted headers.
- **Windows** serialises requests per client with bounded cancellation and accepts short numeric and HTTP-date retry deadlines.
- **Android** keeps its synchronised queue and retry deadlines longer than one day.

Both native clients space request starts by 500 ms. **None of these measures removes provider-side or IP limits.** Native retry-deadline contracts have been added, but the latest local web validation does not certify a new native build.

## Publication gates

Five things are needed before publishing a native release:

1. Run the checks at the latest revision.
2. Do real playback, accessibility and DPI checks on the target device.
3. State the reduced native scope.
4. Review the exact runtime notices.
5. Sign with credentials kept **outside** the repository.

At the approved merge, tag the actual merged commit as `v0.1.0` and create the GitHub Release. Never include signing keys or personal music.
