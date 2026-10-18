---
description: "Layers, data flow, directory layout and internal modules of Wave's web client."
updated: "2026-10-18"
---

This page describes the web client, which is the reference implementation. Wave has no HTTP API and no backend: the interfaces documented here are **internal** and may change during `0.x` development.

## Scope and platform decision

The first implementation is a browser application in **React and TypeScript**. It is now accompanied by independent Kotlin/Compose projects for Android and C#/WPF for Windows. PixelPlayer remains a reference for local library organisation and playback interactions, **not an implementation dependency**.

The first milestone is a working end-to-end vertical slice: import local music, persist it, browse and search it, play it, organise playlists and, optionally, edit local metadata. No backend, no authentication. Optional automatic lyrics query LRCLIB directly from the browser; the audio stays local.

## Layers and responsibilities

```text
React interface
    ├── App: library views, filters, dialogs, import entry points
    └── components: artwork, player controls, accessible dialogs
            │
Application hooks
    ├── useLibrary: loading, import, favorites, removal, metadata overrides
    ├── usePlaylists: loading, ordered membership, CRUD, errors
    └── usePlayer: audio lifecycle, queue dispatch, Media Session
            │
Domain                        Data / browser adapters
    ├── Track / Playlist models       ├── IndexedDB repository
    ├── search / formatting           ├── metadata importer
    ├── pure playlist mutations       ├── artwork validation / crop
    └── pure queue reducer            └── HTMLAudioElement
```

Three rules hold the design up:

- **The domain layer has no React or storage dependencies.** They are pure functions and types.
- **Data modules do not render interface elements.**
- **Hooks coordinate side effects** and expose state to components.

For this first milestone, screen navigation and grouping live in `App.tsx`. Routing and feature-specific screens can be extracted when the application grows.

## Directory layout

```text
src/
├── components/
│   ├── Artwork.tsx
│   ├── ArtworkPicker.tsx
│   ├── TrackEditor.tsx
│   ├── PlaylistDialog.tsx
│   ├── PlaylistCollection.tsx
│   ├── AnimatedListItem.tsx
│   ├── LibraryContent.tsx
│   ├── Navigation.tsx
│   ├── Modal.tsx
│   └── PlayerBar.tsx
├── data/
│   ├── artwork.ts
│   ├── import.ts
│   └── library.ts
├── domain/
│   ├── playlists.ts
│   ├── player.ts
│   └── types.ts
├── hooks/
│   ├── usePlaylists.ts
│   ├── useLibrary.ts
│   └── usePlayer.ts
├── ui/               # shared motion preferences and tokens
├── test/
├── App.tsx
├── main.tsx
└── styles.css
```

## Data flow

Eight steps, from choosing a file to hearing it:

1. **Explicit selection.** The user selects or drops files. The browser cannot silently scan the device's music folders.
2. **Validation.** `useLibrary` checks extension, size and duplicate identity.
3. **Metadata.** The importer reads embedded tags locally and, when they are missing, falls back to a conservative two-part spaced-dash inference with unknown artist and album. Valid embedded tags take precedence and filename artist inference must agree with an embedded title. Explicit track and disc prefixes are stripped; genuine numeric titles are not.
4. **Persistence.** Each track and its audio Blob are saved in IndexedDB **before** entering the interface state.
5. **Derivation.** The interface derives visible tracks from search, view, grouping and sorting settings.
6. **Queue.** Selecting a track loads a snapshot of the visible identifiers into the queue reducer.
7. **Playback.** `usePlayer` resolves the active ID to a track, creates temporary Blob URLs and controls the native decoder engine.
8. **Events.** Browser events update duration and position or advance the queue. Audio errors pause and show an actionable message.

## Data model

Defined in `src/domain/types.ts`:

```ts
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileName: string;
  size: number;
  addedAt: number;
  favorite: boolean;
  blob: Blob;
  artwork?: string;
  audioInfo?: AudioInfo;
  contentHash?: string;
  lyricsLookup?: LyricsLookup;
  lyrics?: Lyrics;
  trackNumber?: number;
  discNumber?: number;
  originalMetadata?: TrackMetadata;
  editedAt?: number;
}

interface AudioInfo {
  codec?: string;
  sampleRate?: number;   // Hz
  bitsPerSample?: number;
  bitrate?: number;      // bits per second
  lossless?: boolean;
}

type RepeatMode = 'off' | 'all' | 'one';
type LibraryView = 'songs' | 'albums' | 'artists' | 'favorites' | 'playlists';
```

Field conventions:

| Field | Unit and meaning |
| --- | --- |
| `duration` | Seconds. Zero means unknown. |
| `size` | Bytes. |
| `addedAt` | Unix timestamp in milliseconds. |
| `artwork` | Data URL of a locally generated image. Optional. |
| `blob` | The persisted audio file. |
| `audioInfo` | Optional imported source metadata. It does **not** describe or guarantee device output quality. |
| `originalMetadata` | Captured once before the first local edit and removed on restoration. |
| `editedAt` | Milliseconds since the Unix epoch. |

Albums and artists are **derived groups**, not independently stored entities. Neither editing nor restoring changes the persisted audio Blob.

> [!NOTE]
> Earlier Kotlin examples for `MediaPlayerController`, `MusicLibrary`, playlists and settings managers were proposals, not working APIs. Their relevant behaviour is now represented by the TypeScript modules above; what is not implemented remains on the repository's roadmap.

## Decisions you notice while using it

**Deduplication by whole-file hash.** SHA-256 over the bytes, not the name. Two identical files with different names or dates do not take up space twice, and legacy IDs and playlist references are preserved.

**Audio is kept once, at original quality.** It is not recompressed. Covers, on the other hand, are compact JPEGs, and lyrics persist the raw text once, reconstructing the parsed lines on load.

**Overrides, not rewrites.** Metadata edits and custom covers live as local overrides. Wave does not touch your files' tags and does not export them.

**Migration with atomic pruning.** The version-1 library migration atomically removes references from deleted playlists, leaving no dangling pointers.

## Testing and quality

| Tool | What it covers |
| --- | --- |
| Vitest | Unit and component tests |
| Testing Library | Real interaction with components |
| Playwright | Browser integration |
| fake-indexeddb | In-memory IndexedDB for tests |
| ESLint + Prettier | Style and common errors |
| `tsc -b` | Strict type checking in the build |

Browser tests generate small WAV files in memory; they do not download or commit copyrighted music.

## Technical roadmap

Milestone 1 (local web player) is implemented. Four validations remain before declaring it stable: playback and import across current Firefox, Safari, Chromium and mobile browsers; profiling large-collection imports and memory use; reviewing keyboard interaction, screen readers, contrast and touch targets; and real-device background behaviour with interruptions and media keys.

From milestone 2, custom playlists, metadata overrides with restoration, cover replacement, artist photos, button and keyboard reordering, library migration and volume memory are done. Still pending: drag-and-drop queue reordering, backup, quota information, importing in a worker, folder import and the installable PWA.
