---
description: "hellbot's live web dashboard: WebSocket, polling fallback, operator page and static publishing connected to the real bot."
updated: "2026-10-18"
---

The bot serves a **live web dashboard** on `WEB_PORT` (8080 by default; `0` disables it). There are two pages: the public `/` and the operator's `/dev`.

## How browsers connect

Browsers connect however they can, in this order:

| Route | What it offers |
| --- | --- |
| **WebSocket** (`/ws`) | The current snapshot **instantly on connect** and a fresh one every **5 seconds** |
| **Polling** (`/status.json`) | If WebSockets are blocked (some proxies), the page polls this file, which **is served live from the bot's current state**, never from the stale static file |
| **Health** (`/health`) | Reports connected clients and snapshot age |

> [!NOTE]
> The key design point is that `/status.json` is not a file on disk that somebody updates: it is a response generated from the bot's in-memory state on every request. That is why the polling fallback shows the same data as the WebSocket, only with up to 5 extra seconds of delay.

## Static publishing connected to the real bot

The same pages work **statically on GitHub Pages**, and there they connect to the **real bot**. The page discovers the bot's address three ways:

1. The **`?server=`** parameter in the URL.
2. The **🔌 button**, whose address is saved in the browser.
3. The **`docs/live-server.json`** pointer, which the bot publishes when `WEB_PUBLIC_URL` is set (it needs `GITHUB_PAGES_SYNC` to reach GitHub).

**CORS is open** on the bot's endpoints so cross-origin reads work. Only if no live bot answers does the page fall back to the synced static `status.json`.

```text
GitHub Pages (static)  ──►  is there a live bot?
                            ├─ yes ──► WebSocket / live status.json from the bot
                            └─ no  ──► synced static status.json
```

### What is committed in `docs/`

The two pages are not generated at deploy time: they are repository files, and `docs/` is exactly what `hell/pages_sync.py` uploads.

| File | Size | What it is |
| --- | --- | --- |
| [`docs/index.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/index.html) | 60 KB | The public dashboard, titled *Welcome to Hell — Live Dashboard* |
| [`docs/dev.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/dev.html) | 31 KB | The operator one, *Welcome to Hell — Dev & Operator Dashboard*; it links back to `index.html` |
| [`docs/status.json`](https://github.com/jaime-gaming/hellbot/blob/main/docs/status.json) | 3.5 KB | The static fallback snapshot |
| [`docs/ARCHITECTURE.md`](https://github.com/jaime-gaming/hellbot/blob/main/docs/ARCHITECTURE.md) | 11 KB | The architecture notes |
| [`docs/_config.yml`](https://github.com/jaime-gaming/hellbot/blob/main/docs/_config.yml) | 418 B | Site title and description |
| [`docs/.nojekyll`](https://github.com/jaime-gaming/hellbot/blob/main/docs/.nojekyll) | 0 B | Tells Pages to serve the files as they are |

The empty `.nojekyll` is what wins: as long as it is there, Pages serves the files without processing them, so the `theme: jekyll-theme-cayman` in `_config.yml` **never gets applied**. Only the title and the description in that config really count.

> [!NOTE]
> The `_config.yml` description itself states the dashboard's scope: errors, warnings, rate limits and monitor health, **with no participant data and no tokens**.

> [!WARNING]
> The comment in `_config.yml` says `index.html` and `status.json` are deployed by `.github/workflows/gh-pages.yml`, but **that workflow does not exist**: the repository has no `.github/` folder at all. What publishes `docs/` is the bot itself at runtime, through `hell/pages_sync.py` and `GITHUB_PAGES_SYNC`.

### Seeing the dashboard without connecting to Discord

[`tools/demo_web.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/demo_web.py) (2 KB) brings up **the exact production stack** — the `hell.web` server plus `HellBot._push_web_snapshot` — against an in-memory event with fake contestants. That is the way to check the dashboard in a browser without touching Discord.

## Related variables

| Variable | Default | What it does |
| --- | --- | --- |
| `WEB_PORT` | `8080` | Dashboard port. `0` disables it. |
| `WEB_PUBLIC_URL` | — | Public HTTPS origin of the bot, used to publish the `live-server.json` pointer |
| `GITHUB_PAGES_SYNC` | — | Lets the bot reach GitHub to publish the pointer |

> [!WARNING]
> If port 8080 is already in use, the log says `Web dashboard NOT started: port 8080 is already in use`. Since the dashboard binds `WEB_PORT` inside the container and docker-compose publishes the *same* value, change it in one place: `WEB_PORT=8090` in `.env` and `docker compose up -d` again.

## Live log stream by DM

Apart from the dashboard, everything the bot logs is mirrored to the operator's DMs in real time, batched into code blocks:

```text
23:57:12 • [monitor]    ➕ Alice joined the VC (3 valid human(s) inside)
23:57:14 • [monitor]    ➖ Bob left the VC (2 valid human(s) inside)
23:57:20 • [monitor]    Kicked @clanker Clank3r (555) from the VC
23:57:31 • [alivecheck] Alive check a1b2c3 started for 4 user(s); deadline in 300s
23:58:02 ⚠️ [engine]     VC is EMPTY — grace period of 15s started
23:58:17 ⚠️ [engine]     Event FAILED — VC empty since …, grace expired at …
23:58:19 ❌ [bot]        Unhandled exception in on_message
                        Traceback (most recent call last): …
```

- The recipient is `LOG_DM_USER_ID` (defaults to **984083829767675965**, Jaime Gaming).
- **One pipeline**: the same records go to `logs/hellbot.log`, to the launcher's Log tab and to the DM, so nothing can be visible in one place and missing in another.
- **Rate-limit safe**: lines are buffered and flushed every `LOG_DM_FLUSH_SECONDS` (3 s), at most three messages per flush; floods are summarised as `… N line(s) dropped` instead of spamming.
- **Alarm bell**: when something goes seriously wrong — a line at `LOG_DM_PING_LEVEL` (`ERROR` by default) or worse, or any Discord rate limit — the operator gets a DM that **@-pings them**, with the offending lines in a code block. Pings are throttled to one per `LOG_DM_PING_COOLDOWN_SECONDS` (5 minutes by default), so an error storm buzzes once, not once per line. The regular batched stream follows without mentions.
- **Self-protecting**: records from the stream itself are excluded, and discord.py's HTTP and gateway records are suppressed while the stream is posting (no feedback loops). Rate-limit warnings from normal operation **do** reach the stream and trigger the ping. If the operator's DMs are closed, the stream disables itself and says so in the file log.
- Attached **before** the gateway connects, so startup problems (bad token, missing intent, failed preflight) are delivered as soon as the DM channel opens.
- `/hell logs` toggles it live, changes severity or sends a test line.

## Progress message in the channel

One embed, created once and **edited** every `PROGRESS_INTERVAL` seconds (20 by default). Its ID is persisted, so it keeps being edited after a restart; if someone deletes it, it is recreated.

It shows status, `73h 24m / 160h 00m`, percentage, a `█████████░░░░░░░░░░░` bar, live headcount, current milestone, next milestone with a live countdown and time remaining. Identical renders are skipped and, once the event ends, the final state is written once and the loop stops editing.

## End-of-event stat cards

When the run ends — completed, failed or cancelled — every contestant is DM'd their own card:

```text
WELCOME TO HELL

128:42:15 SURVIVED

YOU WERE... TOP 3
out of 41 contestant(s)

YOU WON 2 REWARDS
• 32h — @hell (limited)
• 64h — Limited-time Verity in Find the Verities
```

The final Top 3 of a completed run get all five milestone rewards plus `@cool people :D` listed.

Delivery is **resumable**: every attempt is written to `dm_log`, so a restart never double-messages. It is paced at one DM per second, and users with closed DMs are reported in the channel summary; they can run `/hell mystats` to see the same card.
