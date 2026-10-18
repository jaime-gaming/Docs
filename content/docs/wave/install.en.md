---
description: "Requirements, commands and first check to run Wave in the browser, on Windows and on Android."
updated: "2026-10-18"
---

Wave can be used three ways: in the browser (the fastest), as a native Windows application, or as an experimental Android build. None of them needs an account, an API key or a backend.

## In the browser

### Requirements

| Tool | Version |
| --- | --- |
| Node.js | 22.12 or later within Node 22, or Node 24 |
| npm | The one that ships with Node.js |
| Git | A recent supported version |
| Browser | Modern Chromium, Firefox or Safari |

JDK, Gradle, Android Studio and an Android SDK are not needed for the web client.

### Getting it running

```sh
git clone https://github.com/jaime-gaming/Wave.git
cd Wave
npm ci
npm run dev
```

Vite prints the development URL, normally `http://localhost:5173`. The server binds `0.0.0.0`, so it also works in proxied development environments.

> [!TIP]
> To test from a phone, open the server's reachable address **on the phone** — not the phone's own `localhost`.

There is no `.env` file, no keys and no backend to start. Browser-facing resources use same-origin URLs and optional lyrics query the public LRCLIB HTTPS API.

### First check

1. Open the address Vite printed.
2. Press **Add music**.
3. Select one or more audio files.
4. The collection appears instantly: press a song to play it.

Importable formats: **MP3, FLAC, WAV, OGG, M4A, AAC, Opus, AIFF and WebM**, up to **200 MB per file**. Actual playback depends on the browser's or operating system's codecs.

### Production build

```sh
npm run build      # strict type checking + bundle
npm run preview    # serve the bundle locally
```

Output goes to `dist/`, which Git ignores. To serve it under a repository subpath:

```sh
WAVE_BASE_PATH=/Wave/ npm run build
```

### Publishing on GitHub Pages

Without creating any custom workflow: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then **Branch: main** and **Folder: /docs**.

The compiled site lives in `docs/index.html` and `docs/site-assets/`; the `.nojekyll` file disables Jekyll processing. **Do not select the repository root**: its index is Vite source, not the production site.

After any change to the web source or to public assets:

```sh
npm ci && npm run build:pages
```

then commit the generated `docs` changes alongside the source. That command uses relative URLs (it works both on repository paths and custom domains), replaces the generated site assets and preserves the Markdown documentation. CI checks that the committed site matches a fresh build.

## Available commands

| Command | What it is for |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Strict type checking and production bundle |
| `npm run preview` | Local preview of the production bundle |
| `npm run lint` | ESLint checks |
| `npm run format` | Format source and documentation with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm test` | Run unit and component tests once |
| `npm run test:watch` | The same tests, in watch mode |
| `npm run test:e2e` | Browser tests with Playwright |
| `npm run build:pages` | Generate the publishable site in `docs/` |
| `npm run release:check` | Checks before a release |

### Browser tests

Chromium has to be installed before the first Playwright run:

```sh
npx playwright install chromium
npm run test:e2e
```

On Linux you may also need `npx playwright install --with-deps chromium`. The configuration starts a local Vite server automatically if none is available, and `CHROMIUM_EXECUTABLE_PATH` can point to an already installed Chromium in constrained environments.

Browser tests generate small WAV files in memory: they do not download or commit copyrighted music.

```sh
npx playwright show-report
```

## On Windows

Requirements: Windows and the **.NET 10 SDK** for development. The test ZIP is framework-dependent, so running it needs the **.NET 10 Windows Desktop Runtime**; it does not bundle it and it does not require administrator rights.

```powershell
dotnet run --project platforms/windows/Wave.Contracts.Tests -c Release
dotnet build platforms/windows/Wave.Windows -c Release
dotnet run --project platforms/windows/Wave.Windows
dotnet publish platforms/windows/Wave.Windows -c Release -r win-x64 --self-contained false -o artifacts/windows
```

The native application uses WPF, Windows Media Player and the standard system file pickers. Originals are copied to `%LOCALAPPDATA%/Wave/audio`, while library, playlists, preferences and listening state use atomically replaced JSON files.

> [!WARNING]
> Unsigned downloads can trigger SmartScreen or antivirus warnings. Wave uses normal, unpacked .NET files, runs without administrator rights and includes checksums, but **none of this guarantees zero false positives or establishes publisher reputation**. Do not disable your protection: disabling it is not a solution.

## On Android

Requirements: **JDK 17**, SDK and build tools **36**, **Gradle 8.13** and an Android Studio supporting **AGP 8.13**. Minimum API **26**.

Open `platforms/android`, let the IDE create the local SDK configuration and run:

```sh
gradle -p platforms/android testDebugUnitTest lintDebug assembleDebug
```

Output is `platforms/android/app/build/outputs/apk/debug/app-debug.apk`: a debug test artifact. The Ubuntu CI runner already provides the SDK. Tests cover the LRC and gain contracts.

Importing with the document picker copies the original bytes into app-private storage, so **uninstalling removes that copy**: keep the originals.

## Troubleshooting

| Symptom | Likely cause and what to do |
| --- | --- |
| `npm ci` fails | Node older than 22.12. Update Node and delete `node_modules/`. |
| A file does not play | The browser lacks that codec. Try Chromium or convert the file. |
| The collection disappeared | Browser storage was cleared or the session was private. Import again from the originals. |
| Another URL shows another library | Storage is per browser profile **and per origin**. That is the expected behaviour. |
| Lyrics do not appear | Automatic lookup is off by default: enable it in Settings, or import your own LRC. |
