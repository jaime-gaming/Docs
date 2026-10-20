---
title: "Overview"
icon: "compass"
order: 10
description: "What hellbot is, which event it runs and what guarantees it offers as a production bot."
updated: "2026-10-19"
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
docs/              the dashboard published to Pages, and the architecture notes
```

`engine.py` and everything below it **imports zero Discord code**. The monitor feeds it plain `Observation(now, participants)` values — with bots and `@clanker` already filtered out — and gets back plain domain events (`MilestoneReached`, `EventFailed`, `EventCompleted`, `EventCancelled`) that the announcer turns into messages. **That is why the entire rulebook is unit-testable.**

## Further reading in the repository

This guide summarizes and orders things. The repository also carries its own documentation, considerably more extensive, and it helps to know what is there and where.

| Document | Size | What it is |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/hellbot/blob/main/README.md) | 40 KB | Quick start, the control panel, the Discord setup checklist, the commands, how it works and the edge cases (all covered by tests) |
| [`docs/ARCHITECTURE.md`](https://github.com/jaime-gaming/hellbot/blob/main/docs/ARCHITECTURE.md) | 11 KB | The layers, the two clocks, the **11 invariants**, the SQLite v3 data model and the fields that suffice to reconstruct the event after a crash |
| [`Announcements.py`](https://github.com/jaime-gaming/hellbot/blob/main/Announcements.py) | 41 KB | Every piece of wording, reward and colour. The bot **does not start without it** |
| [`docs/index.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/index.html) | 60 KB | The public dashboard, *Welcome to Hell — Live Dashboard* |
| [`docs/dev.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/dev.html) | 31 KB | The dev and operator dashboard |
| [`tools/check.sh`](https://github.com/jaime-gaming/hellbot/blob/main/tools/check.sh) | 1.5 KB | Compile, pyflakes, ruff, mypy, pytest and simulations |
| [`tools/simulate.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/simulate.py) | 8 KB | Prints every message of a full run offline; `--fail-at 40` kills it after 40 hours |
| [`tools/healthcheck.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/healthcheck.py) | 3 KB | Inspects the **state file**, not the process |
| [`tools/make_icon.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/make_icon.py) | 2.5 KB | Derives the icons from the master logo; needs Pillow, which the bot itself does not |
| [`tools/demo_web.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/demo_web.py) | 2 KB | The real dashboard against a simulated bot, no Discord connection |
| [`Dockerfile`](https://github.com/jaime-gaming/hellbot/blob/main/Dockerfile) | 1 KB | `python:3.12-slim`, `/data` volume, uid 10001 |
| [`bot.py`](https://github.com/jaime-gaming/hellbot/blob/main/bot.py) | 113 B | Convenience entrypoint: imports `hell.bot.main` |
| [`docker-compose.yml`](https://github.com/jaime-gaming/hellbot/blob/main/docker-compose.yml) | 534 B | The service and its variables |
| [`requirements.txt`](https://github.com/jaime-gaming/hellbot/blob/main/requirements.txt) · [`requirements-dev.txt`](https://github.com/jaime-gaming/hellbot/blob/main/requirements-dev.txt) | 51 B · 66 B | Runtime and development |

> [!NOTE]
> `hell/` is **41 modules** and the whole repository **114 files**. The map of all 41, grouped by responsibility, is in [Architecture](/hellbot/architecture/).
