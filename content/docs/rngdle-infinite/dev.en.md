---
description: "How the game is built, a map of the repository, commands, non-negotiable design rules and Playwright tests."
updated: "2026-10-18"
---

## What it is technically

RNGdle Infinite is a browser game built with **React + Vite**. It has no backend: everything happens in the client and the save lives in `localStorage`.

Two architecture decisions rule everything else:

- **The RNG and the scoring live in a Web Worker** (`src/roll.worker.js`). Keeping them off the UI thread is what allows long rolls and badge computation without freezing the screen.
- **The random source is its own** (`src/random.js`). It is not replaced by `Math.random` for rolls: the honesty of the number is a project rule, not an implementation detail.

> [!IMPORTANT]
> The game is an **independent recreation** of RNGdle. The scoring and rank data come from RNGdle Tools, and the badge artwork is by Twemoji (CC BY 4.0). Fonts are Inter and Space Mono (SIL Open Font License) and icons come from Lucide.

## Map of the repository

| Path | What lives there |
| --- | --- |
| `src/main.jsx` | The app shell: routes, roll screen wiring and device-link start-up |
| `src/roll.worker.js` | Roll and scoring in a worker |
| `src/random.js` | The random source |
| `src/badges.js`, `src/infinite-badges.js` | Badge definitions, families and EP values |
| `src/pets.js` | Companions: prices, bonuses and skills |
| `src/rack.js`, `src/draw-plan.js` | The skill rack and how draw skills plan their draws |
| `src/rebirth.js` | Rebirth ladder, prestige and Rollback |
| `src/progress.js` | Save format, migrations and the `PROGRESS_KEY` storage key |
| `src/sync.js` | Device linking (relay or PeerJS/WebRTC), heartbeat and reconnects |
| `src/components/` | Shared UI components and game icons |
| `src/data/` | Prepared game data; its `README.md` documents provenance and the pinned source |
| `tests/` | Playwright specs; `tests/helpers/` has the shared seeding and clock helpers |
| `tools/` | Node scripts: relay, Pages publishing, data preparation, screenshots and audits |
| `vite.config.js` | Dev server; it serves the device-sync relay at `/__sync/*` |
| `docs/` | Built site for GitHub Pages. **Generated: do not edit by hand** |
| `media/` | README screenshots, generated from the running game by `tools/screenshots.mjs` |

## Commands

```sh
npm install
npm run dev              # dev server on 0.0.0.0:5173, relay included
npm test                 # full Playwright suite (starts npm run dev itself)
npx playwright test tests/roll.spec.js   # a single spec
npm run build            # production build into dist/
npm run pages:publish    # rebuilds docs/ (after changes that ship)
npm run test:pages       # checks on the already committed docs/
npm run audit:economy    # price and roll-distribution audit
npm run format           # prettier over src, tests, root configs and README
```

### Chromium in restricted environments

Playwright's own Chromium download is usually blocked in sandboxes. If you already have a Chromium binary, export `CHROMIUM_PATH=/path/to/chromium` before running the tests. Some environments also need `--no-sandbox`, which `playwright.config.js` already passes when `CHROMIUM_PATH` is set.

## Rules that are not negotiable

These are design decisions made by whoever maintains the project. **They do not change as a side effect of other work.**

- **Honest roll.** A skill may change how many numbers are drawn or which one is kept, but **never** the scoring table, the badge values or the rank of a number. Wallet multipliers only multiply EP that is already banked.
- **Companions never change the roll.** They multiply the EP that lands in the wallet. **Trail and Drift are the only exceptions**, and they use their own random sample.
- **Rollback** stays hidden until the player has three prestiges. It is **hidden, not disabled**. It starts from 0 EP (no starting bonus) and can be repeated.
- **Bookmarks** are capped at 3. The README, the "Bookmarks (n/3)" chip and the tests all state that cap.
- **Companion signatures** take a slot on the rack, like any other circle.
- **Logos.** The new RNG-over-∞ mark is **only** for the favicon and the mobile app icon. The game's own logo is the original one, from before RNGdle Infinite.
- **Stored numbers.** Every number saved from one roll pays the wallet skill multipliers, not only the last one.
- **Presentation settings** never change odds, EP, prices or timings.
- **Offline.** Offline rolls pay EP and go into history. **Skill charging is online-only.**

> [!WARNING]
> If a request seems to conflict with one of these rules, the procedure is to **stop and ask** instead of guessing. That is the explicit convention of the repository.

## Tests

The suite is Playwright and it starts the dev server by itself. Some specs are slow **on purpose**, because they test the real tempos of the game: the 45-second reveal and the 60-second cooldown.

Notes that save time:

- `tests/helpers/progress.js` seeds the save. Use it instead of hand-writing `localStorage` for `PROGRESS_KEY`.
- A page that reads `?sync=` does so in an effect **after mount**. Wait for the stored link before navigating away, or the join races the navigation.
- `tests/device-link-webrtc.spec.js` needs the `peer` dev dependency. It must stay in `devDependencies`.
- Timing-sensitive specs (`roll`, `auto-originals`) can be flaky under heavy parallel load. **Re-run them alone** before assuming a regression.
- For long flows, set `test.setTimeout` rather than shortening the game's timers.

## Publishing

GitHub Pages serves `docs/` from the `main` branch, with the base path `/RNGdle-Infinite/`.

The flow after a change that ships:

1. Run `npm run pages:publish`, which rebuilds `docs/`.
2. Commit the regenerated `docs/`.

> [!CAUTION]
> `docs/` is **generated content**. Editing it by hand is lost on the next publish, and committing a `docs/` that was not regenerated leaves the public version out of sync with the code.

## The scoring data

This is the most delicate part of the project and it has its own document, `src/data/README.md`, which at 12.8 KB is **longer than the main README**.

Scores and ranks are not computed: they are **looked up** in factual tables downloaded from RNGdle Tools on **14 September 2026** and pinned to commit `8190166af9f259a9d3a0a941b2c9902bfbbe713f` of `CubityFirst/rngdle-ep-calculator`.

| File | What it holds |
| --- | --- |
| `public/data/ep-table.bin.gz` | The factual total EP of **every integer from 0 to 1,000,000 inclusive**. 2,099,404 compressed bytes and 4,000,004 inflated: little-endian unsigned 32-bit EP at offset `4 × number` |
| `public/data/badge-table.bin.gz` | Factual earned-badge membership. 395,276 compressed bytes and 29,125,233 inflated: **233 badge-major bitset rows**, 125,001 bytes each |
| `src/data/badge-metadata.json` | The 233 labels, descriptions, emojis, EP values, family names and rarities, in the pinned upstream definition order |
| `src/data/game-index.json` | Source and revision, population, row order, SHA-256 digests and lengths of both tables, versioned transport paths, roll-tier thresholds and tier counts |
| `src/data/diagram-hints.json` | Contributor categories observed in reference test cases |
| `src/data/roll-samples.json` | Fifty observed results, **used only by tests** |

Badge membership is read like this, and the seven padding bits at the end of each row are ignored:

```js
bits[row * 125001 + (number >> 3)] & (1 << (number & 7))
```

> [!IMPORTANT]
> The probabilities are **not estimates**. Each badge's `matchingNumbers`, `probabilityPercent` and formatted `probability` are derived from the bitsets. Likewise, runtime ranks are recalculated over the complete EP population instead of being copied from the samples.

### Why the same table exists in two formats

In `public/data/` the `.bin.gz` files live alongside `.json` files with a hash in the name. They are not duplicates:

- **The `.json` ones are what runtime serves.** They are generated by `npm run prepare:data` and are transport envelopes holding `{encoding: "gzip-base64", data: "…"}`.
- They are ASCII JSON on purpose: that way a preview proxy cannot rewrite the gzip or the binary on the way through.
- The name carries the content hash so that **an old table cannot end up paired with a newer manifest**.
- **The `.bin.gz` files stay around for offline tests and for reproduction**, but the app never fetches them.

### Changing the pinned revision

The document is explicit: if the source revision changes, the metadata, the row ordering and the roll-tier thresholds must be reviewed **together**. You do not replace one table and stop there. The tests audit every legal score, every badge probability, the tier counts, the hashes and agreement with the fifty reference results.

And one more rule: **no upstream executable engine is stored in production**.

## Economy

`npm run audit:economy` checks two things worth auditing together because they influence each other: shop **prices** and the **roll distribution**. If you change a badge, a companion or a price, this is the command that tells you whether the economy still makes sense.
