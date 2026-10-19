---
description: "What Diario is, what sets it apart from other journaling apps and what it includes."
updated: "2026-10-18"
---

**Diario** is a personal notebook: minimal and **100% local**. No backend, no accounts, no AI and no external APIs — summaries, statistics and trends are computed in your browser with JavaScript, rules and text templates.

> [!TIP]
> **[Open Diario](https://jaime-gaming.github.io/daily-diary/)** — works on desktop and mobile, and offline after the first load.

## The idea

The navigation is organised around four areas — **Today**, **Routine**, **Archive** and **Progress** — and **Thoughts** is an optional space, not the theme of the whole notebook.

That design decision matters: many journaling apps push you to write text every day. Diario lets you **log only your mood or a figure and save**, without writing anything. Notes are optional and the notebook **never writes text on its own**.

## What it includes

| Area | What it does |
| --- | --- |
| **Today** | Mood, sleep, dedication, notes, tags, energy, stress and gratitude |
| **Routine** | Habits, streaks, 35-day consistency, counters and tasks for tomorrow |
| **Archive** | History with search and filters, and a calendar coloured by each day's mood |
| **Progress** | Statistics, your week and the month summary |
| **Thoughts** | Bottles cast into the sea, readable only when they come back |
| **Settings** | Profile, appearance, content and data |

On top of that:

- **Real routes** with working Back and Forward, and static pages generated at build time.
- **Local saving with no surprises**: a day only enters the notebook when you press **«Save day»**.
- **Day summary** generated with `if/else` templates and fixed phrases, **with no model at all**.
- **Statistics** with an adaptive SVG chart, explicit scales, gaps for missing days and a sleep goal.
- **Mobile** with a compact header and bottom navigation that respects the device's safe areas.
- **Motion** with page transitions and card animations, respecting `prefers-reduced-motion` and the reduce-animations option in Settings.
- **Privacy and data**: export and import JSON, download a copy and delete everything, with confirmation.

## What it does not do

> [!IMPORTANT]
> - **There is no autosaving of entries.** While you write, every keystroke goes into a local draft, but the day does not enter the notebook until you save it.
> - **Your text is never analysed by models.** Summaries are templates and rules.
> - **No servers, tracking, ads or remote fonts.** Nothing leaves the device.
> - **The sea is not magic.** Bottles do not travel anywhere: whether they return is decided by a deterministic function of the text, the date and the chosen sea.

## How it is built

```text
JavaScript · Vite · localStorage · Service Worker
No backend or AI dependencies
Tests for the pure functions and for rendering (npm test)
```

The production build goes to `docs/`, which is what GitHub Pages serves. With `base: './'` and relative links it works both at `user.github.io/daily-diary/` and on a custom domain.

## Further reading in the repository

This guide summarizes and orders things. This is what the repository holds, with its real sizes, in case you want to go to the source.

| Document | Size | What it is |
| --- | --- | --- |
| [`src/main.js`](https://github.com/jaime-gaming/daily-diary/blob/main/src/main.js) | 179 KB | The whole application: bootstrap, routing, state and views. By a wide margin the largest file in the repository |
| [`src/data/constants.js`](https://github.com/jaime-gaming/daily-diary/blob/main/src/data/constants.js) | 25 KB | The lists the daily content draws from: words, tips, themes, suggested habits, quotes, rituals and tones |
| [`README.md`](https://github.com/jaime-gaming/daily-diary/blob/main/README.md) | 13 KB | The introduction, the structure diagram and the conventions |
| [`vite.config.js`](https://github.com/jaime-gaming/daily-diary/blob/main/vite.config.js) | 2 KB | The build and the dev server |
| [`index.html`](https://github.com/jaime-gaming/daily-diary/blob/main/index.html) | 957 B | The entry point |
| [`package.json`](https://github.com/jaime-gaming/daily-diary/blob/main/package.json) | 498 B | The scripts and dependencies |
| [`render.yaml`](https://github.com/jaime-gaming/daily-diary/blob/main/render.yaml) | 299 B | The Render deployment |

> [!NOTE]
> There is no `docs/` folder: the README is all the documentation the project has. The modules its structure diagram does not list are described in [Development](/daily-diary/dev/).

## Guide tour

- [Install & use](/daily-diary/install/) — running it locally, deploying it and the saving model.
- [The five areas](/daily-diary/areas/) — Today, Routine, Archive, Progress and Thoughts in detail.
- [Data & privacy](/daily-diary/data/) — the `localStorage` keys, the entry format and backups.
- [Structure & development](/daily-diary/dev/) — folders, modules and tests.
