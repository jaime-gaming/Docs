---
title: "Development"
icon: "code"
order: 70
blurb: "requirements, commands, browser tests and the ten typical failures."
description: "How Wave is developed: requirements, commands, browser tests, debugging, the ten typical failures and the five QA checklists."
updated: "2026-10-19"
---

The repository carries its own development guide, [`docs/DEVELOPMENT.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/DEVELOPMENT.md), 31 KB and 302 lines. This page gathers it in order: what you need to touch the web code and, above all, the cases the guide writes down because somebody already tripped over them.

> [!NOTE]
> All of this is about the **web client**. The native Android (Kotlin/Compose) and Windows (C#/WPF) implementations are independent projects with their own tooling; the build and status matrix is in [Platforms](/wave/platforms/).

## Requirements

| Tool | What is required |
| --- | --- |
| Node.js | 22.12+ within Node 22, or Node 24 |
| npm | The one that ships with Node.js |
| Git | A recent supported version |
| Browser | Modern Chromium, Firefox or Safari |
| Editor | Any editor with TypeScript support |

A JDK, Gradle, Android Studio and an Android SDK are **not required** for the web client. They are for the independent Android project.

## Initial setup

```bash
git clone https://github.com/jaime-gaming/Wave.git
cd Wave
npm ci
npm run dev
```

Vite prints the development URL, normally `http://localhost:5173`. Two configuration details that are not accidental:

- The server binds to **`0.0.0.0`**, not `127.0.0.1`, so that it also works inside a proxied development environment.
- The configured host allowlist accepts **`.e2b.app`** preview hosts. Other trusted hosts are added explicitly; the guide is adamant that **host validation is not disabled globally**.

No `.env` file, API key, account or separate backend is needed. Bundled browser-facing resources use same-origin URLs and optional lyrics requests use the public LRCLIB HTTPS API. **Another service's localhost URL is never hard-coded into client code.**

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Strict type checking and production bundle |
| `npm run preview` | Local preview of the production bundle |
| `npm run lint` | ESLint checks |
| `npm run format` | Format source and documentation with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm test` | Run unit and component tests once |
| `npm run test:watch` | Watch unit and component tests |
| `npm run test:e2e` | Playwright browser tests |

Build output is written to `dist/` and ignored by Git. **Not committed:** `node_modules/`, browser binaries, test reports, audio collections or generated artifacts. `package-lock.json` **is** committed, for reproducible dependency installation.

## Browser tests

Chromium has to be installed before the first Playwright run:

```bash
npx playwright install chromium
npm run test:e2e
```

Linux systems may also need `npx playwright install --with-deps chromium`. The Playwright configuration **starts a local Vite server automatically** unless one is already available. In constrained environments, `CHROMIUM_EXECUTABLE_PATH` can point to a compatible preinstalled Chromium binary.

Browser tests **generate small WAV files in memory**: they do not download or commit copyrighted music.

```bash
npx playwright show-report
```

> [!WARNING]
> A missing-browser failure is not a passing test. If Playwright cannot find Chromium, install it or set `CHROMIUM_EXECUTABLE_PATH`; do not take the result as good.

## Developing with local music

The run-through the guide proposes to confirm nothing has broken:

1. Choose **Add your music**, or drag files onto the app.
2. Wait for the import notification.
3. Select a track to play it.
4. Search by title, artist or album; try the grouping tabs and favorites.
5. Reload and confirm the library is still there.
6. Create a playlist, add two songs, use song options to move one up, and reload to verify the saved order.
7. Enable **Settings → Library editing**, edit metadata, choose a local JPEG/PNG/WebP cover and save. Reload, then restore the original information.
8. Turn editing off and verify that saved values remain but the controls disappear.
9. Disable animations and test the system reduced-motion preference separately.
10. Remove a track and verify that playlist references disappear while the original file stays untouched. Delete a playlist and verify that library music remains.

### Manual cases worth running

The guide lists the ones that have actually caused trouble:

- Tagged and untagged files, Unicode names and missing artwork.
- Duplicate imports and renamed copies.
- Corrupted media and files with unsupported codecs.
- Empty files, non-audio files and files over 200 MB.
- Browser storage disabled or full.
- Removing the current, first, last and only queue entries.
- Full-viewport player at **320/390/768/1024/1440 px**, including opaque dark and light artwork palettes, short-height no-scroll fit, queue focus and return to the initiating Home or bar button.
- Home counts and actions, card cover dimensions, and artist album ownership **with same-named albums by different artists**.
- Native 24-bit WAV import and playback, source-detail labels and byte-for-byte Blob preservation.
- Volume persistence, mute/reload/unmute, and restoring the selected order after shuffle.
- Repeat-off at the final track, repeat-one, repeat-all and shuffle.
- Keyboard-only navigation and narrow viewports.
- Reloading after favorites change; switching origins or browser profiles.
- Dark, light and system theme, reduced motion and the Animations switch.
- Version-1 database migration with existing audio and favorites.
- Playlist creation from song options, duplicate membership, reordering and deleting referenced music.
- Invalid or oversized artwork, canceling edits, multiple edits and restoration of the original.
- Favorite and metadata changes **while playing**: elapsed time must not reset.

> [!IMPORTANT]
> The development library belongs to the development origin. Switching between `localhost` and a preview URL **does not share the same collection**: they are two origins and therefore two separate IndexedDB databases.

## Debugging

With the browser tools:

| Panel | What to look at |
| --- | --- |
| **Console** | Runtime failures and which browser APIs are available |
| **Application / Storage** | The `wave-library` IndexedDB with its `tracks`, `playlists`, `artists` and `albumOrders` stores (**schema v3**), and in `localStorage` the keys `wave-theme`, `wave-editor-enabled`, `wave-animations-enabled`, `wave-volume`, `wave-last-audible-volume`, `wave-crossfade`, `wave-mix-enabled`, `wave-auto-lyrics` and `wave-playback-session-v1` |
| **Network** | Confirm that importing and playing music **does not upload files** |
| **Performance** | Import responsiveness and audio transitions |
| **Accessibility** | Control names, focus order and contrast |

> [!CAUTION]
> Audio contents and sensitive local filenames are not logged in production. Inspecting console and storage can expose personal collection metadata: **redact it before sharing a bug report**.

## Troubleshooting

The ten the guide documents by name.

### Dependencies fail to install

Check the Node.js version and package registry access. Use `npm ci` with the committed lockfile. **Do not delete or regenerate the lockfile merely to hide an installation error.**

### The library will not open or imports stop

IndexedDB may be disabled, restricted in private mode or out of space. Enable site storage or free up space. Files committed before a failed import remain saved. **Clearing Wave's site data resets the collection, favorites, playlists and local edits**: keep the original files first.

### Editing controls are missing

Enable **Settings → Library editing**. Basic playlist naming and membership work without it; song editing and custom playlist artwork or descriptions are gated behind that setting. Turning it off **preserves saved values**: it does not restore originals automatically.

### A custom image is rejected

Choose a readable JPEG, PNG or WebP of **5 MB or less and at most 40 million decoded pixels**. SVG and remote URLs are unsupported. The picker displays a recoverable error and keeps the existing cover. Accepted images are square-cropped and resized **in the browser**: original image and audio files are never rewritten.

### Animations do not run

The Animations switch is on by default, but **the operating system's reduced-motion preference takes precedence**. Test both preferences. And no: reduced motion is not bypassed to make a screenshot or a test pass.

### A track imports but will not play

Extension recognition and metadata parsing **do not imply codec support**. Try a known-good WAV or MP3 file and check the formats the browser supports. Unsupported or damaged audio produces a message rather than being silently treated as playable.

### Audio quality and source details

Wave plays the original stored Blob with native browser decoding: it adds **no transcoding, EQ or normalization**. Optional crossfade uses two native elements with equal-power volume ramps and is disabled by default. New imports retain source codec, sample-rate and bit-depth metadata when reported; older records may show only the filename format. Default volume is 100 %, and both the chosen level and the pre-mute level are persisted. Device routing, browser or OS resampling, hardware, recording quality and codec support still determine the output. **No bit-perfect audio is claimed, nor restoration of information already lost in a lossy file.**

### Playback does not start automatically

Browsers restrict autoplay. Playback starts through a user interaction. A rejected playback promise pauses the interface and prompts another attempt.

### A preview rejects its host

Keep the server bound to `0.0.0.0` and include the trusted proxy domain in Vite's allowlist. If a backend is added later, **proxy it through the same origin** instead of having the browser request a local `localhost`.

### Tests cannot find a browser

Install Playwright Chromium or set `CHROMIUM_EXECUTABLE_PATH`.

## Production deployment

```bash
npm ci
npm run lint
npm test
npm run build
```

Serve `dist/` from an HTTPS static host. No backend endpoints or secrets are required. Set appropriate cache headers for hashed assets and **avoid caching `index.html` indefinitely**. `vite preview` is for local verification, not a production server.

> [!WARNING]
> There is **no service worker or PWA manifest yet**. Once loaded, imported tracks play locally, but a completely offline cold start is not guaranteed.

## Persistence and motion regressions

These are the rules the guide flags because breaking them is not visible at a glance:

- Migrations stay conditional on `oldVersion`, and are tested with version-1 and version-2 databases **before** changing the schema. **`tracks` is never recreated just to add a new store.**
- Library-track deletion and playlist pruning belong **in one transaction**.
- Favorite and metadata writes must read the latest record: a record is not replaced with stale component props.
- The in-memory Blob is preserved when merging metadata, so the audio effect does not reload its source.
- `src/ui/motion.ts` is used rather than inventing animation durations in every component.
- Animated exits retain the DOM temporarily: scope text and label assertions to the active surface, or wait for actual removal. Exiting controls must remain inert.
- Native modal focus restoration happens **after** `dialog.close()`. The compact-player opener is supplied explicitly because expanding the player makes its footer inert. Browser tests exercise that focus path.
- In persistence tests, wait for the committed visible state before reloading: a click starts an asynchronous database write and reloading immediately can interrupt it.
- Browser fixtures and generated image files belong in ignored test output, **never in the production library**.

## Dependency and documentation maintenance

`npm outdated` and `npm audit`, review the changes and run the complete check suite after updates. Breaking upgrades are not applied blindly.

Documentation is kept **in English**, and API signatures, behavior, limitations and roadmap status are updated as the implementation changes. Review and licensing expectations are in [`CONTRIBUTING.md`](https://github.com/jaime-gaming/Wave/blob/main/CONTRIBUTING.md).

## The five QA checklists

The guide closes with five batches of checks. They are not theory: they are what runs before a version is considered good.

### Lyrics, crossfade and reordering

Cover LRC boundary timestamps, fractions, offsets and repeated stamps; embedded millisecond versus MPEG-frame tags; synchronized, plain and missing lyrics; reload, seek and pause, and native progression. Oversized or invalid imports are rejected **without replacing saved lyrics**. Manual photo save and removal is validated in the gallery, on Home and in the profile, and the song's album artwork must remain independent.

Crossfade browser tests instrument **real native `Audio` constructors**: two simultaneously unpaused elements, nonzero complementary gains, incoming identity before outgoing end, and pause stopping both. Engine tests also cover rejection and cancellation, outgoing-event isolation, mute, source URL cleanup and guarded queue changes. Repeat-one, single-entry repeat, manual skip, seek, removal and background or mobile restrictions are tested separately: **a mocked `play` promise is not evidence of real overlap**.

Full album and playlist memberships are reordered with pointer handles, buttons and keyboard, validating independent reload persistence, filtered browsing, current-queue preservation, 320 px fit and concurrent collection changes. **Album orders must never include a different artist's homonymous album.**

### Automatic lyrics and immediate storage

Playwright **intercepts LRCLIB with realistic contract responses**, so the suite does not depend on the provider being available. Synchronized and plain matches are verified, wrong title/artist/duration, 404 album fallback, instrumentation versus errors, response-size limits, timeouts and aborts, cache TTLs, local or embedded lyric precedence, stale metadata and deleted-track rejection. Opt-out is tested across reloads, deliberate retry, provider attribution, quick offsets and saved lyrics without another request.

> [!NOTE]
> Even so, a production-browser smoke test against live LRCLIB is still required, to validate current CORS and service availability: **a fixture is not proof of provider coverage**.

For immediate storage: import a tagged file without playing it, reload and compare the stored Blob hashes with the original. Import a renamed and redated byte copy and assert there is **a single** track and audio record. Keep legacy IDs and playlists stable when lazily recording a content hash. Check storage-write failure without corrupting previous successful imports, the persistence grant, denial and unsupported cases, original-quality audio, compact cover output and raw-only lyric records. Native browser storage usage may differ from library estimates.

Crossfade QA also checks opacity-only cover overlap and the absence of transition meters or banners, equal-power quarter-point gains, completion and cancellation cleanup, the sum of squared gains, mute and system reduced-motion behavior. New card, lyric and navigation movement must respect **both** motion preferences.

### Text fill and compact layout

Test line-fill start, midpoint and end, positive and negative offsets, final native duration, unknown duration, plain text, Unicode and whitespace preservation, wrapped text, seek reset and pause stability. Check **the actual glyph-clipped gradients** and assert there is no lyric progress bar. Enhanced LRC uses the supplied word stamps; ordinary LRC follows line timing and **does not fabricate word timing**. Under reduced motion its temporal feedback is kept while spatial and decorative movement is disabled.

> [!IMPORTANT]
> Keyboard tests after an editor closes must wait for the actual native `dialog` element **to detach**, not just for its accessibility role to disappear: an inert exiting dialog still holds the native modal layer and can prevent focus reaching the full player.

Validated are the 64 px collapsed-player geometry, explicit full-screen opening and focus return, Home collection and daily-mix controls without a duplicated session, desktop sidebar navigation, light and dark themes and **no document overflow at 320/390/768/1024/1440 px**, keeping stored music and the existing queue and playback semantics intact.

### Three-platform update

Home is the initial web page and **Settings is now a full page, not a dialog**. Lyrics starts open in a collapsible section each time Now Playing expands or the song changes. Redundant source and playback status text is removed. The original curved W mark replaces generic waveform bars. Online automatic lyrics is optional and off initially, while manual one-song lookup remains available. Exact and search requests validate artist, title and duration, identify the client and honor provider cooldowns: **availability cannot be guaranteed**. Crossfade uses incoming media time and equal-power gains, not elapsed wall time. Duplicate cleanup merges only records confirmed byte-identical and preserves references; same-name groups are reviewed non-destructively.

Separate native Android (Kotlin/Compose) and Windows (C#/WPF) source implementations exist; prior web-only scope statements apply to the web architecture, not the entire project. Hosted native compilation now passes, and Windows additionally runs contract and WPF layout smoke checks. Physical-device playback and full web parity remain separate gates.

### Listening stage and restoration

Check viewport bounds **and actual lyric visibility and hit targets**, not only hidden overflow, at 1440×900, 1024×768, 768×700, 390×844, 320×568 and 844×390. Cover enhanced LRC, plain or missing lyrics and long metadata or lines. Validate word start, middle and end, repeated stamps, offsets, malformed word timing, provider timelines beyond the recording duration and decoded-duration cache reconciliation.

Restore a nonzero native position after reload and delayed IndexedDB hydration with queue, order, shuffle and repeat intact and no autoplay. Test deleted references, selected-track removal, invalid or blocked `localStorage` and lifecycle saves.

## Where to go next

- [Architecture](/wave/architecture/) — the layers and data flow these rules protect.
- [Privacy & data](/wave/privacy/) — what is stored and what never leaves the device.
- [Platforms](/wave/platforms/) — the state of the three implementations.
