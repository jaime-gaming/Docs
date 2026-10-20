---
title: "FAQ"
icon: "help"
order: 50
blurb: "common questions and credits."
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

### How many numbers can I store?

**Three.** That is the bookmark cap and it shows in the **"Bookmarks (n/3)"** chip in the interface. What matters is not the cap but how it is paid: **every stored number pays the wallet skill multipliers**, not only the last one.

### Do companion signatures take a slot?

**Yes.** A signature takes a slot on the rack like any other circle. They do not sit apart and they are not free: equipping a signature spends a slot.

### Is rollback locked until the third prestige?

It is **hidden, which is not the same as disabled**: before three prestiges it is not shown at all. When it appears, it **starts from 0 EP** (no starting bonus) and **it can be repeated**.

### Do Trail and Drift change my roll?

They are **the only two exceptions** to the rule that companions do not touch the roll, and they do it in a bounded way: **they use their own random sample**. They do not modify your number or its score; they generate an additional result of their own.

### Do presentation settings affect what I earn?

**Never.** They do not change odds, EP, prices or timings. They are cosmetic by definition.

### Does my save pass through a server when linking devices?

**No.** On static hosting the link goes over **PeerJS on WebRTC** and the public broker **only does the handshake**: the save travels device to device and never passes through it. The details are in [Save & sync](/rngdle-infinite/save/).

### Can I modify the game or contribute?

Yes. The [Development](/rngdle-infinite/dev/) guide has the map of the repository, the commands and the tests. Before touching anything it is worth reading its **rules that are not negotiable**: the honest roll, that companions do not change the roll, the cap of 3 bookmarks, and that presentation settings do not touch the economy.

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
