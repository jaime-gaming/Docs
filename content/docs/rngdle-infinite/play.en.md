---
title: "How to play"
icon: "play"
order: 20
blurb: "the roll, the scoring and the rhythm."
description: "The game loop: roll, score, wait and spend EP. What every part of the screen means."
updated: "2026-10-18"
---

## The loop

RNGdle Infinite is a three-beat cycle that repeats without limit:

```text
GENERATE  ──►  reveal  ──►  cooldown  ──►  GENERATE
                  │
                  └──► the number's badges ──► EP ──► upgrades
```

Every lap is faster and more profitable than the last, because the EP you earn is reinvested in shortening the reveal and the cooldown and in multiplying what each roll produces.

## Rolling

Press **GENERATE**. You get a random integer between **0 and 1,000,000**, both included.

There is no seed, no editor and no preset values: **you cannot pick a specific number**. That is deliberate. The whole game is about reacting to what comes up, not about constructing the roll.

## Scoring

The number earns EP for its **patterns**. Some examples of what is looked for in the digits:

- **Pairs** — repeated digits next to each other.
- **Runs** — consecutive ascending or descending sequences.
- **Lucky sevens** — the sevens that show up.
- And many more patterns from the badge catalogue.

Every pattern the number has is a **badge**. Badges do two jobs at once:

1. They **pay EP** on that roll.
2. They **fill your collection**, which is what unlocks the bigger resets.

> [!IMPORTANT]
> **Skills never change how a number scores.** Your number and its badges are the same whichever companion you carry and whichever skill is charged. What changes is how much EP those badges produce, or how long you wait between rolls.

## Waiting

There are two pauses and they serve different purposes:

| Pause | What it is | What it is for |
| --- | --- | --- |
| **Reveal** | The animation showing the number and its badges | Gives the payoff and lets you read what came up |
| **Cooldown** | The wait before you can roll again | Sets the rhythm and gives upgrades value |

**Upgrades shorten both.** It is the highest-impact early investment in the game: less waiting per roll means more rolls per minute, and therefore more EP per minute. Without upgrades, the reference tempos are a **45-second reveal** and a **60-second cooldown**.

> [!NOTE]
> **Presentation settings never change these timings**, nor the odds, the EP or the prices. They are cosmetic by definition: if one shortened the cooldown, it would be an upgrade and it would live in the shop.

> [!NOTE]
> **There is no roll limit.** You roll as often as you want once the reveal and the cooldown are over. There is no energy meter and no daily cap either.

## Spending EP

EP is your wallet. Three destinations:

- **Upgrades** — shorten the reveal and the cooldown and multiply the earnings.
- **Companions** — multiply the EP you earn. You carry one at a time.
- **Skills** — charged effects that fire on the next roll.

## Bookmarks and stored numbers

When a roll produces several numbers, you can **store them**. Two rules worth having clear, because they change what each roll is worth:

- **The cap is 3 bookmarks.** The interface shows it in the **"Bookmarks (n/3)"** chip, and that 3 is a closed decision of the project.
- **Every stored number pays the wallet skill multipliers**, not only the last one.

The second one is what makes extra-draw skills pay off far better than they look at first glance: you are not storing one number, you are cashing all of them.

Wallet multipliers, mind you, **only multiply EP that is already banked**: they never alter the raw score of a number or its rank.

## Offline rolls

Rolls made offline **do count**: they pay their EP and show up in your history. The difference is that **skills only charge while you are online**.

## Progression rhythm

The progression has three clear steps:

1. **First hours** — improve roll speed and buy the first companions.
2. **Mid-game** — complete half the badge collection and accumulate EP per cycle, which is what opens prestige.
3. **Long cycle** — chain rebirths, unlock prestige and, after three prestiges, the rollback.

The details of each step are in [Systems & progression](/rngdle-infinite/systems/).
