---
description: "Day to day with Wave: library, daily mixes, playlists, playback, lyrics and settings."
updated: "2026-10-18"
---

This page walks through what you do with Wave once the music is in. Every example corresponds to the web client, which is the most complete; the differences with Windows and Android are in [Platforms](/wave/platforms/).

## Adding music

Two paths, both explicit:

- **Add music** opens the system file picker and allows multiple selection.
- **Drag and drop** onto the window imports whatever you drop.

The browser **cannot** silently scan the device's music folders: there is always an action from you in between.

During import Wave does four things:

1. **Validates** extension and size (200 MB per file at most).
2. **Detects duplicates** with SHA-256 of the whole file: two files with the same bytes count as the same song even if the names or dates differ.
3. **Reads the embedded metadata** and the artwork.
4. **Stores** the track and its audio Blob in IndexedDB before showing it.

When a file has no tags, Wave falls back to a **conservative** inference from the filename: it splits on a spaced dash into two parts and, if that does not fit, leaves artist and album as unknown. Valid embedded tags always win, and filename artist inference must agree with an embedded title. Explicit track and disc prefixes are stripped; titles that are genuinely numeric are not.

## Browsing the library

Five views, plus search:

| View | What it shows |
| --- | --- |
| **Songs** | Flat list of everything imported. |
| **Albums** | Groupings with their artwork and their own profile. |
| **Artists** | Groupings with an editable photo, independent from the covers. |
| **Favorites** | Whatever you marked with the heart. |
| **Playlists** | Your playlists, with cover and description. |

Albums and artists are **derived groups**, not separately stored entities: they are computed from the tracks.

Search covers title, artist and album. Sorting can be by import date, title or artist.

## Daily mixes

Mixes are selections generated from **your own tags** for genre and artist, not from a remote recommendation service.

- You see the songs **before** playing.
- They can be played in order or shuffled.
- They can be **saved as a playlist**, and then they become an ordinary playlist you can edit.

> [!NOTE]
> Saving a mix does not freeze it against the future: tomorrow's selection will not overwrite the playlist you saved today. Small libraries may show fewer than three mixes.

## Playlists

Creating a playlist means choosing a name, a cover and a description. After that:

- **Add songs** from any view.
- **Reorder** with buttons or with the keyboard (dragging is not there yet in the queue).
- **Remove songs** without deleting the audio.
- **Rename** and **delete** the playlist.

Deleting a playlist affects no audio file: only the grouping and its references disappear.

## Playing

Available controls: play, pause, previous, next, position bar, volume, shuffle, repeat one and repeat all. Wave remembers the volume and the last audible level, even if you mute, reload and unmute.

Choosing a song loads into the queue **a snapshot of the visible identifiers**: that is, the queue plays what you were looking at, in the order you were looking at it.

The queue can be viewed and entries can be removed. Adding unique tracks to the current queue does **not** replace it. Where the browser supports it, Wave exposes Media Session actions, so system and headphone controls work.

Audio errors pause playback and show an actionable message instead of failing silently.

### Automatic transitions

- **Mix** analyses the timing of pairs of songs to chain them.
- **Autoplay** picks the next one locally with weighted variety.

On Windows the timer is of bounded duration with local variety; on Android there is manual overlap only.

## Lyrics

Three paths, from most controlled to most automatic:

1. **Add your own text or LRC** to a song.
2. **Search explicitly** for a match from the editor.
3. **Enable automatic lookup** in Settings (it ships disabled).

The web client supports **enhanced LRC** and line fill. Saved lyrics work **offline**.

Lookups reuse results already saved, coordinate requests and respect the provider's retry times. Even so, LRCLIB can still be temporarily busy.

> [!NOTE]
> Automatic lookup uses the public LRCLIB API and sends song metadata. The provider also sees connection information such as an IP address. The downloaded text stays local. Full details are in [Privacy & data](/wave/privacy/).

## Staying in the music

- **Now Playing** full screen, with artwork and synchronised lyrics.
- **Compact player** so you can keep browsing while it plays.
- **Idle stage**: a restored session comes back paused, not playing behind your back.

## Settings

Six menus on web and Windows; a basic page on Android:

| Menu | What it controls |
| --- | --- |
| **Appearance** | Light, dark or system theme; palettes derived from artwork; larger text; reduced motion. |
| **Playback** | Queue behaviour, transitions and remembered level. |
| **Lyrics** | Automatic lookup, provider and line fill. |
| **Library** | Local metadata editing and restoration of originals. |
| **Storage** | Estimates for audio, artwork and lyrics; origin usage and quota; protection of stored files. |
| **About** | Version, licenses and third-party notices. |

### Accessibility and comfort

Phone controls are designed for touch. There are keyboard shortcuts, labelled controls and reduced-motion support. Contrast and text sizes can be adjusted from Appearance.

## Editing metadata without breaking anything

Metadata edits and custom covers are **local overrides**: Wave does not rewrite or export the tags of your files.

- Before the first local edit, `originalMetadata` is captured once.
- On restore, that copy is removed and the original comes back.
- Neither editing nor restoring changes the persisted audio Blob.
