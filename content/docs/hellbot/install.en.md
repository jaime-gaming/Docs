---
title: "Install & deploy"
icon: "download"
order: 40
blurb: "Windows, console, Docker, systemd and Discord permissions."
description: "Starting hellbot on Windows with no console, from the console on any system, or with Docker, plus the Discord permission checklist."
updated: "2026-10-18"
---

## Windows: double-click, no console

1. Download or clone the project folder.
2. Double-click **`run_bot.bat`** (or `run_bot_silent.vbs` if you do not even want the setup window to flash). The first run creates a virtual environment and installs the dependencies automatically.
3. The **control panel** opens. Fill in the Settings tab → **Save settings** → **Start bot**.

Prefer a single file to hand to somebody else? Run **`build_exe.bat`** once and you get `dist\WelcomeToHellBot.exe`: no Python needed on the target machine, no console window, and it keeps `.env`, `data\` and `logs\` next to itself.

For debugging with visible output there is **`run_bot_console.bat`**.

## Any OS: console

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # token, channel IDs and role IDs
python bot.py
```

## Docker

```bash
cp .env.example .env      # fill it in
docker compose up -d      # state lives in the hell-data volume
```

There is a systemd unit in `deploy/hellbot.service`.

### What the image does

The `Dockerfile` starts from `python:3.12-slim` and makes four decisions worth knowing before running the bot in a container:

| Decision | Detail | Why it matters |
| --- | --- | --- |
| **State on a volume** | `VOLUME /data`, with `DATABASE_PATH=/data/hell.sqlite3` | Restarts **and image rebuilds** never lose the timer, the leaderboard or the milestone history |
| **Unprivileged user** | `hellbot`, uid 10001, owning `/data` and `/app` | The bot does not run as root |
| **A real healthcheck** | every 60 s, 10 s timeout, 90 s start period, 3 retries | It runs `tools/healthcheck.py --max-lag 120`: if an event is running and the last channel observation is older than that, the container is marked unhealthy and restarted |
| **Only what runtime uses** | it copies `hell/`, `tools/healthcheck.py`, `docs/`, `Announcements.py` and `bot.py` | `Announcements.py` is mandatory: the bot reads all of its text from there and will not start without it |

The `.dockerignore` keeps `.git/`, virtual environments and caches out of the build context, and — the important part — **everything that is state or secret**: `.env`, `data/`, `logs/` and the `*.sqlite3` files with their `-wal` and `-shm`. A database or a set of credentials is never baked into the image.

> [!TIP]
> The healthcheck looks at the **state file, not the process**. A bot that is alive but whose monitoring loop has stalled is worse than a crashed one, because the event keeps running while nobody is watching the channel. That is exactly the failure the healthcheck is designed to catch.

The start command is `python bot.py`, which is the five-line entrypoint calling `hell.bot.main`.

> [!WARNING]
> **Port 8080 already in use** (`Web dashboard NOT started: port 8080 is already in use`): the dashboard binds `WEB_PORT` (8080 by default) inside the container and docker-compose publishes the *same* value, so change it in one place: `WEB_PORT=8090` in `.env` and `docker compose up -d` again.
>
> If the log says the port is in use but nothing else is running, look for a **second bot instance** (`docker ps | grep hell` or `ps aux | grep bot`): only one process per `.env` may run. Two instances double-credit time and fight over every `/hell` command. As a safety net the bot refuses to start a second instance against the same database (a `flock` on `<data dir>/hellbot.lock`), so a duplicate copy exits immediately with a clear error instead of running amok.

## The control panel

`launcher_main.py` — what the `.bat` and the `.exe` start — is a small Tk desktop app:

| Tab | What it offers |
| --- | --- |
| **Dashboard** | Bot state, event state, live channel headcount, next milestone, progress bar for the 160 h and the result of the Discord-side configuration checks. |
| **Log** | The same lines that go to `logs/hellbot.log`, colour-coded and live, with a button to open the folder. |
| **Settings** | Every `.env` value with inline help, the token masked behind a *show* toggle, validation before saving and an atomic write so a crash cannot corrupt the file. |

The bot runs on its own asyncio loop in a background thread, so the window never freezes; closing it asks for confirmation and shuts the bot down cleanly. Errors (bad token, missing intent, no network) appear as pop-ups and on the Dashboard instead of vanishing into a console nobody sees.

## Discord setup checklist

**1. Developer Portal → Bot → Privileged Gateway Intents**: enable **Server Members Intent** and **Message Content Intent**. The second one is required so the bot can read alive-check replies: without it **nobody can ever answer a roll call**.

**2. Invite the bot with these permissions:**

| Permission | Why |
| --- | --- |
| View Channel + Connect on the target channel | To see who is inside |
| **Move Members** | To disconnect `@clanker` users |
| Send Messages / Embed Links / Read Message History in the announcement channel | Announcements and editing the progress message |
| **Mention @everyone** | Milestone, start, failure and completion pings |
| Manage Messages *(optional)* | Lets the bot pin the live progress message |

The bot verifies all of this on startup (`hell/health.py`) and tells you exactly what is missing, in the log and in the launcher's Dashboard.

## Configuration variables

### Required

| Variable | Meaning |
| --- | --- |
| `DISCORD_TOKEN` | Bot token |
| `GUILD_ID` | Server ID (slash commands sync instantly to this guild) |
| `VOICE_CHANNEL_ID` | The Hell channel (default `1539756705997652079`) |
| `ANNOUNCE_CHANNEL_ID` | Text channel for announcements and the live progress message |
| `GAMENIGHT_HOST_ROLE_ID` | `@gamenight host`: the only role allowed to start, stop and reset |
| `CLANKER_ROLE_ID` | `@clanker`: auto-disconnected, never earns leaderboard time |

### Optional

| Variable | Default | Meaning |
| --- | --- | --- |
| `HELL_ROLE_ID`, `HELLIST_ROLE_ID`, `HELL_MASTER_ROLE_ID`, `COOL_PEOPLE_ROLE_ID` | — | Only used to render real role mentions in reward messages |
| `DATABASE_PATH` | `data/hell.sqlite3` | Database path |
| `MONITOR_INTERVAL` / `PROGRESS_INTERVAL` | `1` s / `20` s | Monitor and progress-message frequency |
| `STARTUP_GRACE_SECONDS` | `15` | Channel reads right after boot are observed but cannot fail the event (cold-cache guard) |
| `EMPTY_VC_GRACE_SECONDS` | `15` | How long the channel may be empty before the run fails |
| `SEND_FINAL_DMS` / `DM_DELAY_SECONDS` | `true` / `1` | End-of-event stat cards |
| `LOG_DM_ENABLED` | `true` | Live log stream |
| `LOG_DM_USER_ID` | `984083829767675965` | Who receives it |
| `LOG_DM_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING` or `ERROR` |
| `LOG_DM_FLUSH_SECONDS` | `3` | Batching interval |
| `LOG_DM_PING_LEVEL` | `ERROR` | Lines at this severity or worse, plus any Discord rate limit, @-ping the operator by DM |
| `LOG_DM_PING_COOLDOWN_SECONDS` | `300` | Minimum seconds between alert pings |
| `MAX_TICK_CREDIT_SECONDS` | `5` | Cap on credit per check, so downtime is never silently paid out |
| `DOWNTIME_CREDIT_SECONDS` | `300` | An outage up to this long is credited back to whoever was in the channel before **and** after |
| `HEARTBEAT_MINUTES` | `15` | Proof-of-life line in the log |
| `ALIVE_CHECK_ENABLED` | `true` | Enable alive checks |
| `ALIVE_CHECK_MIN_HOURS` / `ALIVE_CHECK_MAX_HOURS` | `1` / `6` | The random window |
| `ALIVE_CHECK_TIMEOUT_MINUTES` | `5` | Time to answer |
| `ALIVE_CHECK_STRICT` | `false` | `true` accepts only the exact string `Yes` |
| `ALIVE_CHECK_CHANNEL_ID` | — | Where the roll call is posted; empty = **the channel's own text chat** |
| `LOG_LEVEL` | `INFO` | Log level |
| `WEB_PORT` | `8080` | Dashboard port; `0` disables it |

> [!IMPORTANT]
> **The voice-channel requirement is not configurable.** `/hell start` refuses to start the event while the target channel has no valid human in it: an empty-channel start is impossible, whatever the `.env` says. It is a hard rule, not a toggle.

> [!WARNING]
> **Booleans are parsed strictly.** `true`/`yes`/`on`/`1` and `false`/`no`/`off`/`0` are accepted. Anything else — for example a typo like `ture` or `flase` — **fails startup** with a clear error, instead of silently disabling the feature it was meant to turn on.

## Development

```bash
./tools/check.sh          # lint + types + tests
python tools/simulate.py  # offline simulation, no Discord
```

The suite covers the engine, persistence, Discord edge cases, GUI and deployment, with ruff and mypy clean and 88% coverage.
