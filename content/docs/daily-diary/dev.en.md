---
description: "Diario's folder structure, modules and tests."
updated: "2026-10-18"
---

## Structure

```text
src/
├── components/
│   ├── ui.js             # interface pieces (calendar, SVG chart, icons…)
│   ├── ocean.js          # the sea: water, floating bottles, card and modal
│   └── habits.js         # routine: habit board, consistency grid, counters
├── data/constants.js     # moods, tags and the customisable pieces
├── utils/
│   ├── dates.js          # dates, day number, weeks, months, calendar
│   ├── routes.js         # routes, subpages, URL and site base
│   ├── stats.js          # metrics, median, coverage, streaks and trends
│   ├── ocean.js          # tides, weather, journey draw and each bottle's state
│   ├── drafts.js         # drafts: so nothing is left half-written
│   ├── pendingDay.js     # changes for a day that is not in the notebook yet
│   └── storage.js        # validate, save, load, delete, export, import
├── styles/
│   ├── main.css          # paper identity, cover, diary, routine, archive, progress
│   ├── sea.css           # the sea and its animations (water, shore, bottles, splash)
│   └── motion.css        # motion system, sidebar and view transitions
└── main.js               # navigation (Today · Archive · Routine · Progress · Thoughts · Settings) and the views
public/                   # icon, manifest and offline service worker
tests/                    # tests for the pure functions and for rendering (npm test)
```

## The separation that holds the project up

The important boundary is between `utils/` and `components/`:

| Layer | What it is | Why it matters |
| --- | --- | --- |
| `utils/` | **Pure functions**: dates, statistics, tides, drafts, storage | Testable without a browser or a DOM |
| `components/` | **Rendering**: interface, sea, habits | Tested by checking what they render |
| `data/constants.js` | The customisable pieces | One single place where moods, tags and presets live |
| `styles/` | Three sheets split by theme | `main.css` identity, `sea.css` the sea, `motion.css` motion |

The three `utils/` modules that solve this project's own problems:

- **`drafts.js`** — so nothing is left half-written. It manages `diario.drafts.v1` and the rule that a draft is only recovered if it is more recent than what is saved.
- **`pendingDay.js`** — changes for a day that is not in the notebook yet. It manages the `diario.pendiente-dia.v1` patch and its merge with the saved entry.
- **`stats.js`** — metrics, median, coverage, streaks and trends. This is where the decision to compare medians and demand more data before suggesting associations lives.

And the one that makes it possible for the sea to need no network:

- **`ocean.js`** — tides, weather, journey draw and each bottle's state, all as a **deterministic function** of the text, the date and the chosen sea.

## Defensive validation

`storage.js` does not only save and load: it **validates**. `validateEntry` cleans and rejects anything it does not recognise, so an entry with unexpected fields cannot corrupt the notebook or break the rendering.

The same happens with custom counters: a strange number in a counter is **ignored** instead of breaking the entry. And removing a part or a counter deletes nothing: it simply stops being rendered, and what you already wrote stays in every day in case you put it back.

## Routes

`routes.js` manages routes, subpages, URL and the site base. The build generates a static page per route, so deep links work on static hosting and Back and Forward really work.

The relative base (`base: './'` in Vite) is what lets the same build work at `user.github.io/daily-diary/` and on a custom domain without recompiling.

## Motion

`motion.css` contains the complete motion system: sidebar and view transitions. It respects two things at once:

1. The operating system's **`prefers-reduced-motion`**.
2. **The reduce-animations option** in Settings.

## Tests

```bash
npm test
```

The suite covers two distinct things:

| What | How |
| --- | --- |
| **Pure functions** | Dates, day number, weeks, months, median, coverage, streaks, trends, tides, journey draw, drafts, patches and storage validation |
| **Rendering** | That the views render what they should given some data |

## Build and deployment

```bash
npm run dev      # http://localhost:5173
npm run build    # generates docs/ (the production build)
npm run preview  # serves the build locally
```

`docs/` includes `.nojekyll` so GitHub Pages serves the assets as they are. The full deployment guide is in [Install & use](/daily-diary/install/).

## Modules the README's diagram does not list

The README's structure is accurate but incomplete: four modules under `src/utils/` are missing, and two of them are among the most interesting in the project.

### `persist.js` — the store

Its own header sums it up: **"write without losing anything"**. Everything saved in the notebook goes through here, and the idea is that a write must never run over what the person has just written.

| Piece | What it does |
| --- | --- |
| `writeRaw` | Writes and **verifies what was written**, because some browsers fail silently. It always returns a result and **never throws** |
| In-memory queue | If it does not fit, it keeps the pending write and warns |
| `retryPending` | Retries when the browser breathes: on returning to the tab, on closing a dialog, every few seconds |
| `onSaveChange` | Interested parties paint the "unsaved" warning **only when there really is something pending** |

The module knows nothing about the diary: only strings and keys. That separation is what makes it testable without an interface.

### `wellbeing.js` — each day's content

At 13.5 KB it is the module that turns the lists in `data/constants.js` into what you see each day, and it does so **with rules and no model at all**, like the rest of the notebook. Among others it exports:

- `daySeed`, `getDailyWord`, `getDailyTip`, `getPersonalQuote`, `getWritingPrompt` — the daily content, deterministic from the date.
- `getAgeProfile`, `getContextualAdvice`, `getGreeting` — the text adapts to the age profile and the context.
- `calculateGoalStats`, `calculateEntryCompletion` — the goal figures and how much of the day is written.
- `detectCrisisRisk` and `normalizeForMatch` — risk detection from the normalized text.
- `generateThemeFaviconSvg`, `generateThemeFaviconDataUri` — the favicon is generated from the chosen theme.

### `setupForm.js` — the profile, read without surprises

It is shared by **the welcome wizard and the Settings page**. It does not touch the DOM: it receives what the form says (name, age, goals…) and returns the patch ready for `saveSetup`. Keeping it apart is what stops the two places from diverging.

### `transitions.js` — 273 bytes with one concrete job

It invalidates late callbacks when a transition is cancelled or replaced. `createTransitionGuard()` keeps a generation counter: `begin()` returns a new generation and `cancel()` increments it, so any callback from the previous transition knows it is no longer its turn to paint.

## Conventions worth keeping

- **No network.** No remote font, no API, no model. If a function needs something from outside, it is breaking the project's promise.
- **Determinism wherever there is luck.** The sea is decided by a deterministic function stored in `localStorage`, not by randomness that changes on reload.
- **Version the keys.** Every key carries `.v1` in its name so migration is possible without breaking existing notebooks.
- **Notes are optional.** No view may require text in order to save a day.
