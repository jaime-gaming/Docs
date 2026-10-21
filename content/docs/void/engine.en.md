---
title: "Inside the single file"
icon: "cpu"
order: 40
blurb: "what is inside the HTML: media, canvas, session and the translator."
description: "What is inside VOID's single file: the four layers, the fourteen audio elements, the cameras drawn with canvas, the session state and the automatic translator."
updated: "2026-10-20"
---

# Inside the single file

The whole game is one file. That is not a figure of speech: `VOID mxks version
(code).html` weighs **1,091,298 bytes**, has **20,077 lines** and **995,640
characters**, and inside it go the markup, the four style blocks and the two
script blocks. This page tells what is in there, read from the file itself and
not from the README.

It is useful for two things: knowing what is running when you play, and not
getting lost when opening it in an editor, which is the first thing anybody who
wants to contribute does.

## The four layers of a single file

There is no build, no dependencies and not a single `<link>`: the file asks
nothing from the outside to work. What there is, is this:

| Measure | Amount |
| --- | --- |
| Size and lines | 1,091,298 bytes · 20,077 lines · 995,640 characters |
| Blocks | 2 `<script>` · 4 `<style>` · 0 `<link>` |
| Code | 303 `function` declarations (302 distinct) · 1,367 `const` or `let` |
| Time | 233 `setTimeout` · 19 `setInterval` · 13 `requestAnimationFrame` |
| Comments | 715 line (`//`) · 27 block (`/* */`) |
| Network | 4 `fetch` · 0 `XMLHttpRequest` |

The four layers are those of any page —markup, style, script and resources—,
except that the first three share a file and the fourth barely exists: there are
two `<img>` and a single external video, the one in the `assets [DO NOT TOUCH]`
folder.

The four `fetch` calls all belong to the automatic translator, described below.
**No other part of the game calls any server**: there is no analytics, no
telemetry and no requests to the domains of the story, which appear in the
internal documents but not in the code.

## Fourteen audio elements and seven videos

The media layer is declared whole in the markup, with its `id` and its volume set
in advance. Nine music tracks, each one for a context:

| Track | Volume | Loop |
| --- | --- | --- |
| `ambientMusic` | 0.3 | yes |
| `officeMusic` | 0.25 | yes |
| `loginMusic` | 0.25 | yes |
| `desktopMusic` | 0.2 | yes |
| `glitchMusic` | 0.25 | no |
| `mailMusic` | 0.2 | no |
| `callMusic` | 0.2 | no |
| `windowOpenMusic` | 0.15 | no |
| `windowCloseMusic` | 0.15 | no |

And five effects with no declared volume, which inherit the element's:
`sfxClick`, `sfxHover`, `sfxDoor`, `sfxAlarm` and `sfxGlitch`. None of them
carries a `src` in the markup: the source is assigned at runtime, just like the
intro video, which declares `data-asset-name="VOIDMXKSnight_shift.mp4"` and is
resolved further down.

The seven `<video>` elements are the intro and **six surveillance cameras**,
`cam1` to `cam6`, all with `autoplay loop muted playsinline`. They start muted
because the sound of the cameras is not a track: it is something else.

## The cameras are canvas, not video

Here is the best hidden trick in the file. The cameras do not play recorded
video: **they are drawn**. There are seven calls to `createElement('canvas')`
with their seven `getContext`, and the code's own comments say so:

- Two **320×240** canvases for the CCTV feeds, with the comment "Crear canvas en
  lugar de video real (sin necesidad de internet)".
- Two offscreen **640×480** canvases to generate a temporary feed with
  `MediaStream`, and a variant for **camera 4 with extreme interference**.
- Two 320×240 overlays placed on top of an already existing `<video>`, only if
  there is no previous one, animated with `animateCCTV`.
- A full screen capture of the video, which takes the element's real dimensions
  (`video.videoWidth`) instead of fixed ones.

The grids, the noise and the silhouettes seen while playing are traced there,
line by line, on every frame. That is why the game's visual identity —the high
contrast CRT simulation— does not depend on any image file: it is generated while
it is watched.

## Eight paths to find the mp4

The only external resource is the intro video, and the file does not take for
granted where it is. It builds a list of candidates and tries them in order:

```text
VOIDMXKSnight_shift.mp4
./VOIDMXKSnight_shift.mp4
./assets [DO NOT TOUCH]/VOIDMXKSnight_shift.mp4
assets [DO NOT TOUCH]/VOIDMXKSnight_shift.mp4
../assets [DO NOT TOUCH]/VOIDMXKSnight_shift.mp4
../assets/VOIDMXKSnight_shift.mp4
../../assets/VOIDMXKSnight_shift.mp4
../../../assets/VOIDMXKSnight_shift.mp4
```

Each one is resolved with `new URL(path, window.location.href)` inside a
`try/catch`, and when one answers the element is marked with
`data-asset-resolved="1"` so it is not tried again. The name comes from
`data-asset-name`, so the video can be replaced without touching the code.

This nuances the claim that nothing can be moved: the HTML tolerates the folder
being next to it, one level up or even three levels up, and tolerates it being
called `assets`. What it does not tolerate is the video changing its name,
because the eight candidates all end in `VOIDMXKSnight_shift.mp4`.

## The state lives in the session

There is no saved game. The file uses `sessionStorage` for five things and
`localStorage` for a single one, and the difference is deliberate:

| Key | Where | What for |
| --- | --- | --- |
| `disclaimerShown` | session | So the health warning shows once per session |
| `interview_completed_this_session` | session | Mark that the interview is already complete |
| `void_external_flags` | session | Story state flags |
| `void_ngplus_level` | session | The New Game+ level |
| `void_show_amnesia_now` | session | Trigger the amnesia message only once |
| `voidTranslations` | **localStorage** | The translations cache |

`checkForNewGamePlus()` comments it without beating around the bush:
"localStorage deshabilitado - no hay persistencia entre sesiones / Pero
sessionStorage permite recordar dentro de la misma sesión". On detecting a saved
level it increments it, sets `isNewGamePlus` and logs it to the console as
`[NG+]`.

The amnesia message depends on two conditions at once: being in New Game+ and
`void_show_amnesia_now` being `'true'`, which is what the stretch that has just
completed the interview leaves written. It is read, **deleted** and shown after
500 ms, so it cannot come out twice.

> [!NOTE]
> The practical consequence is that closing the tab resets the progress and the
> New Game+ level. It is not a bug to fix: it is how it is written, with
> persistence disabled on purpose. The only thing that survives the tab is the
> translations cache.

## The automatic translator

The game is written in Spanish and **translates itself into English while you
play**. The block is called `AutoTranslator` and its header sums it up: it
translates the Spanish content using Google Translate as primary and other APIs
as fallback, with the translations cached to avoid repeating the work.

| Order | API | Address | Limit per request |
| --- | --- | --- | --- |
| 1 | `GoogleTranslate` | `translate.googleapis.com/translate_a/single` | 5,000 characters |
| 2 | `MyMemory` | `api.mymemory.translated.net/get` | 500 characters |
| 3 | `LibreTranslate` | `translate.argosopentech.com/translate` | 3,000 characters |

The text is split into chunks of up to **4,500 characters** (`maxChunkSize`) and
between requests it waits **200 ms** to avoid hitting rate limits. Each API
declares its own method: the first two do a `GET` with parameters and the third a
`POST` with `{ q, source: 'es', … }`, which is where it is written down that the
source language is Spanish.

When one fails it goes into `failedAPIs`, a `Set` that discards it for the rest
of the session, and the next one takes over. Meanwhile progress is reported with
`lastStage`, `lastCurrent`, `lastTotal`, `lastPercentage` and `lastItem`, and
there is a corner indicator (`cornerProgressEnabled`) with its own dismiss timer.

> [!TIP]
> Before calling any API a fourth `fetch` is attempted, to
> `void-translations-en.json` next to the HTML and with `cache: 'no-store'`. That
> file **is not in the repository**, and it is not needed: it is the way to
> replace the automatic translation with a hand-made one. If it exists and can be
> read, it is used whole; if not, `'JSON file not found'` is thrown and the
> translator goes on its way.

> [!WARNING]
> With the automatic translation active, fragments of the game's text leave the
> browser towards three third-party services. It is the only external traffic in
> the whole file, but it is worth knowing: it is not an offline game when played
> in English, and the `localStorage` cache means the second time nothing goes out
> at all.

## What it explains about the warnings

Several things in [Warnings & FAQ](/void/faq/) stop being mysterious seen from
here. That the English version is unfinished is consistent with it being a
runtime machine translation, with its three APIs and its per-request limits. That
the health warning comes out every time the game is opened in a new tab is
`disclaimerShown` in `sessionStorage`. And that the CRT simulation can cause
ghost images does not depend on a resource that could be removed: it is drawn on
every frame.

To play it as it comes, the way is in
[Install & play](/void/install/); for the story on top of all this, in
[The VOID Corp world](/void/world/).

## Contributing from here

The file to open is
[`VOID mxks version (code).html`](https://github.com/jaime-gaming/VOID/blob/main/VOID%20mxks%20version/VOID%20mxks%20version%20%28code%29.html),
and it is edited with an editor that can hold a million characters in a single
file. Two pieces of advice that come from reading it:

- The 715 line comments are in both languages and explain intention, not syntax:
  "Cámara 4 con interferencia extrema" says more than the code that comes after
  it. Searching by them is the fastest way to get your bearings.
- Almost all of the game's timing is the 233 `setTimeout`. When touching one it
  is worth looking for its cancellation partner, because in a file with no modules
  an orphaned delay keeps firing after changing scene.
