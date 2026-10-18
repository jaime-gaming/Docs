---
description: "Common questions about RNGdle Infinite, the game's limits, offline behaviour and credits."
updated: "2026-10-18"
---

## FAQ

### Is there a roll limit?

**No.** Roll as often as you want once the reveal and the cooldown are over. There is no energy meter and no daily cap.

### Can I pick a specific number?

**No.** There is no seed, no editor and no preset values. The game is about reacting to what comes up.

### Does a companion make my rolls luckier?

**No.** Companions multiply the EP you earn. Your number and its badges stay the same.

### Do offline rolls count?

**Yes.** They pay their EP and show up in your history. The only difference is that **skills only charge while you are online**.

### Is this the official RNGdle?

**No.** It is an independent recreation. Credits for the original are further down.

### Where is my save stored?

In your browser's `localStorage`. There is no account and no server. Switching browser, using private browsing or clearing the site's data deletes it. The details are in [Save & sync](/rngdle-infinite/save/).

### Can I play on two devices at once?

Yes, with **Settings → Device link**. The device that creates the link is the primary one and it is the one running rolls and purchases, so the two screens do not fight over the same roll. **Anyone with the link can play with your account.**

### Do skills change which badges come up?

**Never.** Skills affect what you earn or how long you wait, not how a number scores.

### What is needed for prestige?

Two things at the same time: **half the badge collection** and **30 million EP earned in the cycle**.

### And the rollback?

It appears **after three prestiges** and it can be repeated.

## Credits

- **[RNGdle](https://www.rngdle.com/)** by Cam / sparrowpatch — the original idea.
- **[RNGdle Tools](https://rng.cubityfir.st/)** and its badge catalogue — the source of the scoring and rank data.
- Badge illustrations by **[Twemoji](https://github.com/jdecked/twemoji)**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Fonts: **Inter** and **Space Mono** (SIL Open Font License). Icons: **[Lucide](https://lucide.dev/)**.

> [!NOTE]
> RNGdle Infinite is an independent implementation. It is not affiliated with, sponsored by or endorsed by the authors of the original RNGdle or of RNGdle Tools.

## Running it locally

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # Playwright suite (needs a Chromium binary)
npm run build   # production build
```

`AGENTS.md` in the repository has the project map and the conventions for contributors and for coding agents.

## Reporting a problem

The game is published from the [`jaime-gaming/RNGdle-Infinite`](https://github.com/jaime-gaming/RNGdle-Infinite) repository. For a specific bug, an issue with this data makes it much easier to reproduce:

- The number that came up and what you expected it to score.
- The companion and skills active at that moment.
- Browser and device.
- Whether it came after an offline roll or a device link.
