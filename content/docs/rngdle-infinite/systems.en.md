---
description: "Companions, the skill rack, tasks and badges, rebirth, prestige and rollback: how RNGdle Infinite progresses and what nothing may change."
updated: "2026-10-18"
---

Six systems carry the progression. The first three are used from minute one; the last three are resets that unlock as you advance.

Before getting into them, the rule that runs through all of them: **the roll is honest**. Nothing you buy can change the scoring table, the value of a badge or the rank of a number. What you buy multiplies what you earn or shortens what you wait.

## Companions

**Thirteen friends** that multiply the EP you earn.

- You wear **one at a time**.
- Some are **found for free** while you roll: you do not have to buy them all.
- Switching companion is immediate and loses no progress.
- Their prices, bonuses and skills are defined in `src/pets.js`.

> [!WARNING]
> **A companion does not make your rolls luckier.** It multiplies the EP you earn, but your number and its badges stay exactly the same. It is an earnings multiplier, not an odds multiplier.

### The two exceptions: Trail and Drift

**Trail and Drift are the only companions that step outside the previous rule**, and they do it in a very specific way: **they use their own random sample**. That is, they do not alter your number or its score; they generate an additional result of their own, with its own draw.

The distinction matters if you are auditing the economy or writing a test: any other companion that started touching the roll would be a defect, not a feature.

## Skills

Effects that get **charged** and **fire on your next roll**. Among them:

- **Double EP** on the roll where they activate.
- **Extra draws**.
- **No cooldown**.

Two important rules:

1. **Skills never change how a number is scored.** They affect what you earn or how long you wait, not which badges your number has. A skill may change *how many* numbers are drawn or *which one* is kept, and that is the end of its reach.
2. **They only charge while you are online.** Offline rolls pay their EP and land in history, but they do not charge skills.

### The rack

Skills are placed on a **rack** of slots, managed by `src/rack.js`. Draw skills plan their draws through `src/draw-plan.js`, which is where it is decided how they are distributed when a roll involves several numbers.

> [!NOTE]
> **Companion signatures take a slot on the rack**, like any other circle. They are not free and they do not sit apart: if you equip a signature, you are spending a slot you could have given to another skill.

### Stored numbers and multipliers

When a roll stores several numbers, **every stored number pays the wallet skill multipliers, not only the last one**. It is easy to assume the opposite, and the difference shows up clearly on rolls with extra draws.

Wallet multipliers, for their part, **only multiply EP that is already banked**: they are never applied to the raw score of a number in a way that alters its rank.

## Bookmarks

**Bookmarks are capped at 3.** That ceiling appears in three places at once and all three must agree: the README, the **"Bookmarks (n/3)"** chip in the interface, and the automated tests.

If you ever saw a chip showing a different maximum, that would be a defect: 3 is a closed decision, not a pending tweak.

## Tasks and badges

Two parallel collections:

| Collection | What it is | What it is for |
| --- | --- | --- |
| **Badges** | Every distinct pattern that has appeared in any of your numbers | Filling the collection, which is a prestige requirement |
| **Tasks** | Concrete goals to chase | Giving the run direction between one reset and the next |

Badges are defined in `src/badges.js` and `src/infinite-badges.js`, with their families and their EP values. Every pattern your number has — pairs, runs, lucky sevens and more — is a badge, and each one adds EP.

Completing **half the collection** is one of the two prestige requirements.

## Rebirth

**Starting over with a permanent bonus.**

It is the first reset available and the cheapest: you lose the cycle's progress in exchange for a multiplier that is kept forever. It is the way to unstick a run when the cycle's upgrades stop paying off. The rebirth ladder lives in `src/rebirth.js`, together with prestige and Rollback.

## Prestige

**A bigger fresh start.** Two conditions must be met at the same time:

1. Have **half the badge collection**.
2. Have earned **30 million EP in the cycle**.

Prestige resets more things than rebirth and gives a bigger bonus in return. It is the central step of long-term progression.

## Rollback

It appears **after three prestiges**, and **it can be repeated**.

Two nuances that are often misread:

- **It is hidden, not disabled.** Before the third prestige it is not shown at all; it is not a visible-but-locked button.
- **It starts from 0 EP**, with no starting bonus. It is not a reset with an advantage: it is a clean reset you can do again.

It is the most advanced system in the game and the one that closes the long cycle: once unlocked, it becomes part of the reset routine instead of a one-off goal.

## What never changes anything

There are settings that exist so the run feels better without touching the game itself. They are worth keeping separate from everything above:

> [!IMPORTANT]
> **Presentation settings never change odds, EP, prices or timings.** They are cosmetic by definition. If one of them altered the economy, it would stop being a presentation setting.

Alongside that, the **logos** are not interchangeable either: the new RNG-over-∞ mark is only for the favicon and the mobile app icon, and the game's logo is still the original one, from before RNGdle Infinite.

## How it fits together

```text
roll ──► EP ──► upgrades (speed)          ┐
             ├─ companions (multiplier)   ├── current cycle
             └─ skills (next roll)        ┘
                       │
             badges + tasks ──► collection
                       │
              half the collection + 30M EP in the cycle
                       │
                   ┌───┴────┐
               rebirth   prestige ──► ×3 ──► rollback (repeatable, from 0 EP)
```

The practical reading: **roll speed and companions pay for themselves within the cycle**, while **the badge collection is what actually moves the run forward in the long term**, because it is the requirement that opens the bigger resets.
