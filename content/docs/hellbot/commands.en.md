---
title: "Commands"
icon: "terminal"
order: 50
blurb: "the 25 commands, who can use them and what they do."
description: "hellbot's commands: who can use them, what they do and what protections the destructive ones carry."
updated: "2026-10-18"
---

All output is **embeds**. Mentions inside an embed never ping, so a milestone can list 250 eligible users without 250 notifications, while the `@everyone` ping stays in the message content.

## Event commands

| Command | Who | What it does |
| --- | --- | --- |
| `/hell start` | `@gamenight host` | Starts the event: status → `RUNNING`, records the absolute start timestamp, starts the 160 h timer, begins channel monitoring and per-user tracking, and posts the start announcement. **Rejected** if one is already running or the channel is empty (hard requirement). |
| `/hell status` | Everyone | Status, elapsed, remaining, % complete, progress bar, live headcount, current and next milestone, and milestones already reached. Used **in the channel's text chat** it instead replies with a link to the pinned live status card. |
| `/hell leaderboard` | Everyone | Real Timer (channel time) or **Gamble Time** wallet rankings (`board:`). In the channel chat, Real Timer replies with the link to the pinned leaderboard. |
| `/hell help` | Everyone | What the event is, every command and the rules in one card. |
| `/hell user` | Everyone | How long someone has spent in Hell: time, rank, share of the event and milestones claimed. |
| `/hell mystats` | Everyone | Your own stat card (time survived, rank, rewards). Handy if your DMs are closed. |
| `/hell milestones` | Everyone | All five milestones, their rewards, when each was reached and how many users were eligible. |
| `/hell export` | `@gamenight host` | The leaderboard as a CSV attachment, for handing out rewards outside Discord. |
| `/hell difficulty` | Everyone / host | Shows the 5 tiers and the current level; `action: set` (host only, `0`–`4` or `auto`) overrides it; `action: announce` (host only) posts it to the announcement channel. |

## Checks and diagnostics

| Command | Who | What it does |
| --- | --- | --- |
| `/hell alivecheck` | **DM only**: operator or `@gamenight host` | Runs a roll call immediately instead of waiting for the random timer. **Never** in a server channel. |
| `/hell doctor` | `@gamenight host` | Self-check: preflight results, live state, background tasks and the (redacted) configuration. |
| `/hell logs` | `@gamenight host` | Controls the live log stream: `status`, `on`, `off`, `test`, `flush` and the minimum severity. |
| `/hell security` | `@gamenight host` | **Anti-cheat report**: alive-check dodging, channel flapping, rate-limit spikes and monitor health. Anything suspicious also triggers an automatic alert to the operator's DMs. |
| `/hell errors` | Everyone | Looks up an error code (e.g. `/hell errors HEL-100`) and returns its full explanation: what it means and what to do about it. |
| `/hell reloadmessages` | `@gamenight host` | Re-reads `Announcements.py` so edited wording applies immediately. |

## Announcements and time

| Command | Who | What it does |
| --- | --- | --- |
| `/hell broadcast` | `@gamenight host` | Posts the host's message as a colored embed: `level: info/warning/error/…`, `target: announcements` or `vc`, with no plain text outside the embed. With `target: participants` the message is **DM'd verbatim (markdown) to every contestant** with recorded time (fallback: the current channel); closed DMs are counted, a dead connection stops the run and the host gets an honest summary. Also `!broadcast <level> participants <message>`. |
| `/hell adjtime` | `@gamenight host` | Adds or removes hours on a member's **Real Timer** or **Gamble Time** (`hours` may be negative). |
| `/hell gamble` | Everyone | Difficulty 3+: bet **Real Timer** (hourly fast-bet quota plus overflow timer) or **Gamble Time** (no rate limits; losing costs 1.5–2× the stake). Bets snap to 15-minute chips and you cannot bet all of your time (`gamble_max_bet_hours`). Every result shows the payout and session stats; a Real Timer loss also adds a server mute. |
| `/hell odds` | Everyone | The house odds card for the current difficulty: win chance and payout at the 15-minute chip and at the max bet, the jackpot band, loss costs per clock and the rate limits (or the unlock hint while gambling is locked). Also `!odds` or `!gamble odds`. |

## Protected commands

These three require **two-step operator approval**, because they are irreversible or they change the state of a 160-hour run.

| Command | Who | What it does |
| --- | --- | --- |
| `/hell stop` | `@gamenight host` | **Two-step, operator-approved.** The bot DMs a one-time code to the operator; the host runs `/hell approve` with it → event marked **CANCELLED** (explicitly *not* FAILED) and leaderboard frozen. |
| `/hell reset` | `@gamenight host` | **Two-step, operator-approved.** Same code flow → all event data wiped for a fresh run. |
| `/hell approve` | `@gamenight host` | Enters the 6-character code DM'd to the operator to confirm the pending `/hell stop`, `/hell reset` or the resumption of a failed run. Codes **expire after 5 minutes** and work **exactly once**; a new request invalidates the previous code. |

## Pause and resume

| Command | Who | What it does |
| --- | --- | --- |
| `/hell pause` | `@gamenight host` | **Emergency freeze.** Stops the 160 h clock **and** every contestant's clock instantly: no milestones can fire, no alive check can kick and the grace countdown freezes too. **Nothing can fail while paused.** Persisted, so a restart stays paused. |
| `/hell resume` | `@gamenight host` | Unfreezes after a pause, continues a failed run (requires operator MFA via `/hell approve`), or after a **Yes** majority in the 160 h *keep on Hell?* vote starts **Hell 2**: the same run continues to **320 h**, with no milestones after 160 h and only one secret final reward. |
| `/hell restart` | **Operator DM only** | **Restarts the bot process.** Exits with code 42 so Docker, systemd or the launcher picks it up again. Event state is preserved in SQLite and recovers automatically. |

## Server and direct messages

**Server commands.** Run with slash commands (`/hell <command>`) **or** with the `!` prefix directly in server channels: `!status`, `!leaderboard`, `!gamble 0.5`, `!hell status`. `!status` and `!leaderboard` used in the channel's text chat reply with the pinned-card links, exactly like their slash twins.

**DM commands.** The same `!`-prefixed commands also run in DMs with the bot: `!status`, `!help`, `!restart`, `!doctor`, `!hell status`. `!` commands enforce **the same host and operator authorization checks** everywhere they run.

`!dump` (operator, DM only) exports the **entire database** as a restorable `.sql` file plus a human-readable `.txt` recap. It is taken read-only, so the live event is never paused.

## Changing what the bot says

Every message, title, footer, reward, emoji and colour lives in one file at the root of the project: **`Announcements.py`**. No logic, just text.

```python
    {
        "hours": 32,
        "title": "🔥 32 HOURS SURVIVED",
        "blurb": "Welcome to Hell has reached the first milestone.",
        "flavour": "The first gate is behind you. 128 hours to go — the easy part is over.",
        "reward": "@hell (limited)",
        "short_reward": "@hell",
    },
```

It is organised in numbered sections — milestones, start, live progress, grace period, failure, cancellation, completion, leaderboard, alive checks, stat cards, command replies and colours — and each block lists the `{placeholders}` it accepts.

- **Edit the text between the quotes**, keep the `{placeholders}` you want and save.
- `CMD_STATUS_VC_LINK` and `CMD_LEADERBOARD_VC_LINK` (section 12) are the message links the bot posts for `/hell status` and `/hell leaderboard` **in the channel chat**: paste your own pinned-message links there.
- Run **`/hell reloadmessages`** (host only) and the new wording is live: no restart and no risk to a running 160-hour event.
- If your edit has a syntax error or a missing name, the bot **keeps the previously loaded text** and tells you exactly what broke (`hell/texts.py`). **It never crashes on bad copy.**
- An unknown `{placeholder}` degrades to the raw template and is logged, rather than killing the announcement it belongs to.
