---
description: "What RNGdle Infinite is, how it plays in three steps and how it differs from the original RNGdle."
updated: "2026-10-18"
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

## Guide tour

- [How to play](/rngdle-infinite/play/) — the roll, the scoring and the rhythm.
- [Systems & progression](/rngdle-infinite/systems/) — companions, skills, tasks, rebirth, prestige and rollback.
- [Save & sync](/rngdle-infinite/save/) — where it is stored and how to link another device.
- [FAQ](/rngdle-infinite/faq/) — common questions and credits.
