---
description: "What hellbot is, which event it runs and what guarantees it offers as a production bot."
updated: "2026-10-18"
---

**hellbot** is the Discord bot that runs *Welcome to Hell*: keep at least **one real human** in a single voice channel, **continuously, for 160 hours**. If that channel empties and nobody returns within the grace period, the run dies **permanently**.

> [!NOTE]
> Python 3.10 / 3.11 / 3.12 · discord.py 2.3+ · tests passing · **88% coverage** · ruff and mypy clean.

## The central rule

```text
160 consecutive hours · five milestones: 32h · 64h · 96h · 128h · 160h
```

- Started by hand with `/hell start`, restricted to `@gamenight host`.
- The voice channel **must** contain at least one valid human, or the start is refused. **Not configurable.**
- Bots never count. `@clanker` is kicked on sight. Being AFK **does** count.
- **15-second grace period** when the channel empties, with a no-ping warning.
- **Random alive checks** every 1–6 h: reply `Yes` within 5 minutes or get disconnected.
- **Personal stat card by DM** at the end, for every contestant.
- Hosts can post **colored embeds** and **DM a markdown message to every participant**.

## What it looks like in Discord

```text
WELCOME TO HELL
🔥 THE 160 HOUR CHALLENGE
▰▰▰▰┃▰▰▰▰┃▰▱▱▱┃▱▱▱▱┃▱▱▱▱
73h 24m of 160h 00m  ·  45.9%  ·  🔥🔥◦◦◦

Status              👥 Currently in Hell   ⏳ Time remaining
RUNNING             7                      86h 36m

✅ Current milestone  🔥 Next milestone      🕛 Started
64h cleared           96h · in 22h 36m       in 3 days

Live · updates every 20s · /hell status · /hell leaderboard
```

All output is **embeds**. Mentions inside an embed never ping, so a milestone can list 250 eligible users without 250 notifications, while the `@everyone` ping stays in the message content.

## Guarantees for an event that cannot be repeated

A 160-hour event cannot be restarted if something goes wrong, so the bot is designed around that constraint:

| Risk | How it is covered |
| --- | --- |
| The bot restarts | Timestamp-based and persisted in SQLite: **a restart never resets the timer** |
| A bug halfway through the event | `/hell pause` freezes the global clock and every user clock; nothing can fail while paused |
| A destructive command run by mistake | `/hell stop`, `/hell reset` and resuming a failed run require a **one-time code** DM'd to the operator |
| An internal fault taking time off participants | A short outage is **credited back** to whoever never left the channel |
| Wording that has to change live | All wording lives in one file, `Announcements.py`, **hot-reloadable** |
| Nobody knowing what happened | **Live log stream** DM'd to the operator: joins, leaves, kicks, milestones and errors |

## What it includes beyond the timer

- **Time gambling** from difficulty 3, with two clocks (Real Timer and Gamble Time), quotas, public odds and session stats.
- **Progressive difficulties 0 to 4** that expand with every milestone reached.
- **Hell 2**: at 160 h a vote decides whether to continue to **320 h**, with no further milestones and one secret final reward.
- **Live web dashboard** with WebSocket and polling fallback, which works even published as a static page connecting to the real bot.
- **Desktop control panel** with no console, and a one-file `.exe`.
- **Large test suite**: engine, persistence, Discord edge cases, GUI and deployment.

## Project structure

```text
Announcements.py   every message the bot sends, in one editable file
hell/              the bot: pure core (engine, timelines, grace, leaderboard…)
                   + Discord edge (monitor, embeds, announcer, commands…)
launcher/          desktop control panel (config editor, supervisor, tkinter UI)
tools/             check.sh (lint+types+tests) and simulate.py (offline dry-run)
docs/              architecture notes
```

`engine.py` and everything below it **imports zero Discord code**. The monitor feeds it plain `Observation(now, participants)` values — with bots and `@clanker` already filtered out — and gets back plain domain events (`MilestoneReached`, `EventFailed`, `EventCompleted`, `EventCancelled`) that the announcer turns into messages. **That is why the entire rulebook is unit-testable.**

## Guide tour

- [Event rules](/hellbot/rules/) — timelines, milestones, difficulties, gambling and the finale.
- [Install & deploy](/hellbot/install/) — Windows, console, Docker, systemd and Discord permissions.
- [Commands](/hellbot/commands/) — the 25 commands, who can use them and what they do.
- [Live dashboard](/hellbot/dashboard/) — the public page and the operator page.
- [Architecture](/hellbot/architecture/) — modules, invariants and the edge cases covered by tests.
