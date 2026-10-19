---
description: "What RNGdle Infinite is, how it plays in three steps and how it differs from the original RNGdle."
updated: "2026-10-19"
---

**RNGdle Infinite** is a browser incremental game: roll an integer between **0 and 1,000,000** and find out what makes it special.

> [!TIP]
> **[▶ Play](https://jaime-gaming.github.io/RNGdle-Infinite/)** — works on desktop and mobile, nothing to install.

## The idea in one sentence

Every number that comes up has patterns: pairs, runs, lucky sevens and many more. Every pattern it has is a **badge**, and badges give you **EP**. EP is your wallet: you spend it on upgrades, companions and skills to roll faster and earn more.

## The basics

1. **Roll.** Press **GENERATE**. You get a random integer between 0 and 1,000,000.
2. **Score.** The number earns EP for its patterns. Every pattern it has is a badge.
3. **Wait.** A short reveal and a cooldown set the rhythm. Upgrades shorten both.

There is no energy meter, no daily limit and no account. **You can play as much as you want** as soon as the reveal and the cooldown finish.

The reference tempos are a **45-second reveal** and a **60-second cooldown**. These are real durations of the game, not approximations: some automated specs run slowly on purpose to respect them.

## Ways to grow

| System | What it does |
| --- | --- |
| **Companions** | Thirteen friends that multiply the EP you earn. You carry one at a time; some are found for free while you roll. |
| **Skills** | Effects that charge up and fire on your next roll: double EP, extra rolls, no cooldown and more. |
| **Tasks and badges** | Goals to chase and a collection to complete. |
| **Rebirth** | Start over with a permanent bonus. |
| **Prestige** | A bigger reset, once you have half the collection and 30 million EP earned in the cycle. |
| **Rollback** | Appears after three prestiges, and is repeatable. |

## What it is not

> [!NOTE]
> **It is not the official RNGdle.** It is an independent recreation. Credit for the original idea and for the scoring data is in [FAQ](/rngdle-infinite/faq/).

Three limits that define the game:

- **You cannot pick a specific number.** No seed, no editor, no preset values.
- **A companion does not make you luckier.** Companions multiply the EP you earn; your number and its badges stay exactly the same.
- **Skills never change how a number scores.** They only affect what you earn or how long you wait.

## How it is built

```text
JavaScript · Vite · Web Worker · localStorage
Fonts: Inter, Plus Jakarta Sans and Space Mono (self-hosted)
Icons: Lucide
Tests: Playwright
```

Roll computation runs in a **separate Web Worker**, so the interface never blocks even while you chain rolls. The fonts are self-hosted in the build itself: the game never calls an external font service.

## Playing on another device

The save lives in your browser. To play on another device, open **Settings → Device link** on one and open the link (or scan the QR) on the other. The details and the caveats are in [Save & sync](/rngdle-infinite/save/).

## Running it locally

You need Node.js and npm:

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # the Playwright suite (needs a Chromium binary)
npm run build   # production build
```

The repository's `AGENTS.md` has the project map and the conventions for contributors and for coding agents.

## Further reading in the repository

This guide summarizes and orders things. This is what the repository holds, with its real sizes, in case you want to go to the source.

| Document | Size | What it is |
| --- | --- | --- |
| [`AGENTS.md`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/AGENTS.md) | 8 KB | The project map and conventions, written for contributors and for coding agents |
| [`src/data/README.md`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/README.md) | 13 KB | Where the scoring data comes from: the pinned commit, every table, its formats and what changing them requires. **Longer than the main README** |
| [`README.md`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/README.md) | 3 KB | The game's introduction |
| [`src/data/badge-metadata.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/badge-metadata.json) | 71 KB | The 233 badges with label, description, emoji, EP, family and rarity, in the pinned source's order |
| [`src/data/roll-samples.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/roll-samples.json) | 152 KB | Fifty observed results. **Used by tests only**, never imported into production |
| [`src/data/game-index.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/game-index.json) | 6 KB | Source and revision, population, row order, SHA-256 digests and table lengths, versioned paths and roll-tier thresholds |
| [`vite.config.js`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/vite.config.js) | 3 KB | The build and the dev server |
| [`src/data/diagram-hints.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/diagram-hints.json) | 2 KB | The observed contributor categories. **Never determines membership or EP** |
| [`package.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/package.json) | 1 KB | The scripts, including `prepare:data` and `audit:economy` |
| [`index.html`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/index.html) | 1 KB | The entry point |

> [!NOTE]
> The two `README.md` files read in the opposite order to what their size suggests: the root one introduces the game, and the one in `src/data/` is the technical documentation of the data.

## Guide tour

- [How to play](/rngdle-infinite/play/) — the roll, the scoring and the rhythm.
- [Systems & progression](/rngdle-infinite/systems/) — companions, skills, tasks, rebirth, prestige and rollback.
- [Save & sync](/rngdle-infinite/save/) — where it is stored and how to link another device.
- [FAQ](/rngdle-infinite/faq/) — common questions and credits.
- [Development](/rngdle-infinite/dev/) — how it is built, a map of the repository, commands and design rules.
