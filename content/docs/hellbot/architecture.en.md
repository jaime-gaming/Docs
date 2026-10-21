---
title: "Architecture"
icon: "boxes"
order: 70
blurb: "modules, invariants and the map of all 41."
description: "hellbot's layers, invariants, data model and tests: why a 160-hour event cannot be lost."
updated: "2026-10-18"
---

If you are changing **behaviour**, start here. If you are changing **wording**, you only need `Announcements.py`.

## Layers

```text
                     Announcements.py        ← all wording, rewards and colours
                            │
                     hell/texts.py           ← loads it, hot-reloads it, never crashes on it
                            │
  ┌─────────────────────────┴───────────────────────────────────────────┐
  │  PURE CORE — no Discord imports, fully unit-testable                 │
  │                                                                      │
  │  timeline.py    global event clock            0 → 160h               │
  │  tracking.py    per-user session clocks       0 → Xh each            │
  │  grace.py       empty-VC grace window         15s state machine      │
  │  milestones.py  milestone table and lookups                          │
  │  leaderboard.py ranking, ties, podium rendering                      │
  │  reports.py     end-of-event stat cards                              │
  │  alivecheck.py  roll-call scheduling and resolution                  │
  │  engine.py      the state machine that ties the above together       │
  │  storage.py     SQLite persistence for all of it                     │
  └─────────────────────────┬───────────────────────────────────────────┘
                            │  Observation in · DomainEvent out
  ┌─────────────────────────┴───────────────────────────────────────────┐
  │  DISCORD EDGE                                                        │
  │                                                                      │
  │  monitor.py     1s channel polling, timed progress edits             │
  │  embeds.py      how every message looks                              │
  │  announcer.py   how every message is delivered                       │
  │  aliveio.py     roll-call pings, kicks and reply backfill            │
  │  dm.py          stat-card delivery                                   │
  │  logsink.py     live log stream to the operator's DMs                │
  │  cog.py + ui.py slash commands, confirmations, permission checks     │
  │  health.py      startup preflight (IDs, permissions, intents)        │
  │  bot.py         wiring and lifecycle                                 │
  └──────────────────────────────────────────────────────────────────────┘
```

`launcher/` is a separate desktop front-end (`envfile.py` for config I/O, `runtime.py` for the supervisor thread, `gui.py` for the Tk window). **It imports the bot; the bot never imports it.**

## Module map

The `hell/` package is **41 modules**. They are grouped here by what they do, with each one's real responsibility as its own docstring states it.

> [!NOTE]
> The `bot.py` at the root of the repository is five lines: it imports `main` from `hell.bot` and runs it. It exists for convenience, so you can type `python bot.py`; it holds no logic.

### Entrypoint, configuration and startup

| Module | Responsibility |
| --- | --- |
| `hell/bot.py` | The bot's real entrypoint |
| `hell/config.py` | Configuration loading, based on the environment and `.env` |
| `hell/paths.py` | Where each thing lives on disk |
| `hell/health.py` | Startup preflight checks |
| `hell/single_instance.py` | Refuses a second live process against the same database |
| `hell/logging_setup.py` | Rotating file and console logging, safe when there is no console |

### Engine, time and progression

| Module | Responsibility |
| --- | --- |
| `hell/engine.py` | The state machine: per-user time tracking and milestone detection |
| `hell/timeline.py` | **Timeline #1**, the global event one: 0 → 160h |
| `hell/tracking.py` | **Timeline #2**, per-user session time: 0 → Xh |
| `hell/timeutil.py` | Time helpers |
| `hell/milestones.py` | The milestone table. Structure only: the wording lives in `Announcements.py` |
| `hell/difficulty.py` | Difficulties: the challenge gets harder at each milestone |
| `hell/grace.py` | The empty-VC grace period: decides when a run is really dead |
| `hell/continuation.py` | The end-of-160h "keep on Hell?" vote |
| `hell/finale.py` | The 160-Hour Finale subsystem |
| `hell/tasks.py` | Background task helper |

The two timelines are separate on purpose: the event one is absolute and shared, and each user's only counts what has actually been observed.

### Voice channel observation

| Module | Responsibility |
| --- | --- |
| `hell/monitor.py` | Voice channel monitoring |
| `hell/alivecheck.py` | Roll call ("alive checks") and dead checks |
| `hell/aliveio.py` | The Discord implementation of the alive-check interface |

### Persistence

| Module | Responsibility |
| --- | --- |
| `hell/storage.py` | SQLite in a single file, crash safe |
| `hell/models.py` | Plain data models, shared and with no Discord imports |
| `hell/dbdump.py` | Full database export for the operator: the "recap it later" file |

### Commands, messages and looks

| Module | Responsibility |
| --- | --- |
| `hell/cog.py` | Commands: the `/hell` slash commands and the `!` prefix ones over DM and chat |
| `hell/embeds.py` | How every message looks |
| `hell/announcer.py` | Delivery: channel resolution, sending and the live progress message |
| `hell/ui.py` | Interaction widgets and permission checks for `/hell` |
| `hell/assets.py` | Artwork resolution for embeds |
| `hell/texts.py` | The loader for `Announcements.py` |

`hell/cog.py` is by far the largest module in the package (115 KB): it concentrates command handling, which is where the most Discord surface is touched.

### Reports, leaderboard and communication

| Module | Responsibility |
| --- | --- |
| `hell/reports.py` | Per-user end-of-event reports, the "stat cards" |
| `hell/dm.py` | Delivery of those cards by direct message |
| `hell/broadcast.py` | Host broadcast by DM: one markdown message to every contestant |
| `hell/leaderboard.py` | The leaderboard: pure logic, no Discord imports |
| `hell/gamble.py` | Gambling: parse bets, persist limits and decide whether a roll is allowed |

### Security and robustness

| Module | Responsibility |
| --- | --- |
| `hell/security.py` | Suspicion and anomaly tracking: anti-cheat and auto-heal for the event |
| `hell/errorcodes.py` | Known, documented error codes |
| `hell/neterrors.py` | Uniform handling of transient "Discord unreachable" failures |

### Public status

| Module | Responsibility |
| --- | --- |
| `hell/web.py` | A lightweight aiohttp server serving live event data over WebSocket |
| `hell/status_writer.py` | Writes `docs/status.json` from the bot's internal state |
| `hell/pages_sync.py` | Pushes `docs/` to GitHub so Pages stays current |

The three form the public dashboard chain: internal state is written to `status.json`, served live over WebSocket and published to Pages.

### The texts

`Announcements.py`, at the root of the repository and 40 KB in size, is **the single file holding every message** the bot sends. `hell/texts.py` only loads it, and `hell/milestones.py` provides the structure without the wording.

> [!IMPORTANT]
> That is why `Announcements.py` is mandatory in any deployment: the bot reads all of its text from there and **refuses to start without it**. The `Dockerfile` copies it explicitly for the same reason.

### Container health

`tools/healthcheck.py` answers one concrete question: **is the bot actually watching the voice channel?** It exits 0 when healthy and 1 when not, which is what makes Docker or systemd restart it.

The interesting part is what it looks at: **the state file, not the process**. A live process whose monitoring loop has stalled is worse than a crashed one, because the event keeps running while nobody is watching the channel. So if an event is RUNNING and the last observation is older than the allowed lag (`--max-lag`), the bot is declared unhealthy.

## The eleven invariants

1. **Time is absolute.** Every calculation uses POSIX timestamps; nothing depends on process uptime, so a restart cannot shift or reset the timer.
2. **The clock never passes 160 h.** `EventTimeline.clamp()` is applied before any elapsed value is used or stored.
3. **Terminal is terminal unless explicitly resumed.** Once FAILED, COMPLETED or CANCELLED, ticks are inert and the leaderboard is frozen; only `/hell reset` clears it, or `/hell resume` with operator MFA to continue a failed run.
4. **A milestone fires exactly once.** `INSERT OR IGNORE` decides the winner; `announced` is only set after Discord accepts the message, so a crash between the two re-posts rather than loses it.
5. **Credit is only granted for observed seconds**, capped per tick (`MAX_TICK_CREDIT_SECONDS`), so downtime is never silently paid out. With one deliberate exception: an outage shorter than `DOWNTIME_CREDIT_SECONDS` is credited back to users seen in the channel **before and after** it, because they demonstrably never left.
6. **Bots and `@clanker` do not exist** as far as the core is concerned: the monitor filters them out before an `Observation` is built.
7. **An empty channel opens a grace window, not an immediate failure**, and failure is timestamped at the moment the channel emptied, never later. If an alive check leaves the channel empty, a **2-minute** recovery grace period is used instead of the normal 15-second window.
8. **Nothing in the message path can break the event.** Bad text, a missing placeholder, a failed send, a closed DM: all logged, none fatal.
9. **Background work never blocks the one-second loop.** Roll-call I/O and DM delivery run through `hell/tasks.spawn()`, which also logs failures.
10. **Crash-safe ordering: the database is never left contradicting Discord.** Every stateful operation writes its row **before** the Discord API call that depends on it, and cleans up (or marks `pending`) on failure.
11. **Pause is an offset, not a stop.** `/hell pause` does not change the event status: it records `paused_ts` and banks `paused_seconds` into the `event` row. Every time reading is converted with `_effective_now()` (`now − paused_seconds − in-progress pause`).

### Invariant 10 in detail

It is the one holding everything else up:

- **Grace expiry** runs `_terminate(FAILED)` — a single `save_state` that sets `status` and clears `grace_started_ts` — before any in-memory cleanup, so a crash can never leave the event RUNNING with no window.
- An **alive check** is persisted to `alive_check` **before** `send_check` is called. A failed send deletes the tentative row (never "DB says active, Discord says it does not exist") and a successful send is followed by a second write adding the real `channel_id` and `message_id`. An *exception* from `send_check` (network error) cleans up exactly like a `None` result, so no phantom check can later kick people who never saw a roll call.
- **Resolution** writes `alive_check_history` and clears the pending row **before** kicking anybody, so a crash mid-kick leaves a resolvable history and no stale pending check.
- Each **stat-card DM** is recorded in `dm_log` as `pending` **before** the API call and updated to `sent`, `blocked` or `failed` after, so a crash mid-delivery retries exactly the right recipients and never double-messages anyone marked `sent`.

### Invariant 11 in detail

While paused, both timelines stand still, milestones, grace and completion are inert, and after `/hell resume` the clocks continue exactly where they stopped. An open empty-channel grace window is shifted forward by the pause on resume, so its countdown resumes with the time it had left. A restart while paused comes back paused, and the container healthcheck treats a paused event as **healthy**: a frozen `last_tick_ts` is *not* a stalled monitor.

## Data model (SQLite, schema v3)

| Table | What it holds |
| --- | --- |
| `event` | One row: status, start and end timestamps, channel and message IDs, grace window, `last_valid_observed_ts` and pause state (`paused_ts`, `paused_seconds`, `pause_reason`) |
| `user_time` | Per-user accumulated seconds (timeline 2) |
| `presence` | Who is in the channel right now (written only on change) |
| `milestones` / `milestone_members` | Claims, timestamps and eligible snapshots |
| `final_leaderboard` | Frozen rankings |
| `alive_check` / `alive_check_history` | Pending roll call and past results |
| `dm_log` | Who already received a stat card (resumable delivery) |
| `meta` | Schema version, next roll-call time and unobserved seconds |

Migrations are **additive** and run at startup (`Store._migrate`).

### Crash reconstruction fields

These fields on the `event` row are enough to reconstruct the full event state after any crash; everything else is derived:

| Field | Stores |
| --- | --- |
| `start_ts` | When the event started |
| `status` | IDLE, RUNNING, FAILED, COMPLETED or CANCELLED |
| `last_tick_ts` | Last trusted channel observation (any population) |
| `last_valid_observed_ts` | Last observation with at least one valid human |
| `grace_started_ts` | When the grace window began |
| `paused_ts` / `paused_seconds` | Whether the event is frozen and how much time has been banked as paused |
| `end_ts` | When it terminated, stored as pause-adjusted event time |
| `milestones` table | Which milestones were reached and when |
| `user_time` table | Per-user accumulated seconds |

Given those plus the wall clock, `resume_after_restart()` can continue watching, resume a grace window, freeze the leaderboard or re-send missed announcements **without guessing anything**. The same invariants are exercised by the crash-injection tests in `tests/test_resilience.py`.

## Edge cases covered by tests

| Case | Behaviour |
| --- | --- |
| User joins exactly at a milestone | Included in that milestone's eligible snapshot |
| User leaves exactly at a milestone | Excluded from the snapshot |
| A bot joins the channel | Ignored everywhere; cannot keep the event alive |
| A `@clanker` joins | Disconnected immediately, no leaderboard time, cannot keep the event alive |
| Last valid participant leaves | 15 s grace window and no-ping warning; FAILED only if nobody returns |
| Someone rejoins with 1 s to spare | Window closes, "SAVED" notice, run continues untouched |
| Channel empties repeatedly | Each empty period gets its own window; survived time is never inflated |
| Milestone lands while the channel is empty | Held back, then awarded to whoever is present when the channel recovers (or lost with the run) |
| Restart mid-grace-window | Window resumes from the persisted `grace_started_ts` |
| Event ends while some DMs are unsent | `dm_log` resumes delivery on the next start, without duplicates |
| Contestant has DMs closed | Recorded as blocked, reported in the summary, `/hell mystats` still works |
| Slow Discord API during a roll call | Kicks and announcements run off the 1-second loop, so channel monitoring never stalls |
| A milestone edited into a broken shape | Rejected with a readable reason; the previous table stays live |
| Event length edited mid-run | Refused and logged: the running clock is never reshaped |
| No internet, bad token or missing intent | Clean one-line error, distinct exit code and full traceback in `logs/` |
| Rapid join/leave churn | 1-second sampling keeps per-user totals correct |
| Bot restarts mid-event | State reloaded from SQLite; elapsed = `now - start_ts`; nothing resets |
| Bot restarts while paused | The event comes back paused: both clocks stay frozen until `/hell resume` |
| Bot restarts around a milestone | Atomic DB claim prevents duplicates; unsent announcements are re-posted on boot |
| 160 h hits during a 10 s update | The 1 s tick clamps everything to `start_ts + 160h`; completion wins over an empty channel at the deadline |
| Identical total times | Shared rank and deterministic display order |
| 250 people in the channel at a milestone | Message split across embed fields; never exceeds Discord's limits |
| Bot offline briefly | The timer keeps running and anyone in the channel before **and** after gets that time credited back |
| Bot offline for a long time | The timer still runs, but the unobserved window is **not** credited to anyone and is reported in the progress message |
| Alive check plus restart | Check state is persisted; replies sent offline are recovered and an expired check is cancelled instead of kicking people |
| Alive check ignored by everyone | Everyone is disconnected, the channel empties and a 2-minute recovery grace period starts |
| Event paused during a bug | Both clocks freeze: no milestones, no roll calls, no grace expiry and no failure |
| Pause crosses the 160 h mark | Completion waits for *effective* time: a paused run can never complete early |
| Someone joins mid-check | Not pinged, not required to answer, never kicked for it |
| API hiccup on a message | Logged and retried on the next cycle; event state untouched |

Two deliberate policy calls worth knowing:

- **Downtime does not fail the event** (the bot cannot prove the channel emptied while it was blind), but nobody earns leaderboard time for that window and the gap is shown in the progress and status output.
- If the channel is empty **in the same tick** a milestone would land, the failure wins: nobody was present to claim the reward.

## Testing

`tests/` mirrors the layers. No network, no Discord token and no display needed:

| File | Covers |
| --- | --- |
| `test_engine`, `test_grace`, `test_properties` | The state machine, the grace rule and randomised chaos runs asserting the invariants above |
| `test_storage`, `test_reports`, `test_leaderboard_and_milestones` | Persistence, stat cards and ranking |
| `test_alivecheck`, `test_health_and_aliveio` | Roll calls end to end and preflight diagnostics |
| `test_announcer`, `test_announcements_file` | Embed limits, and that `Announcements.py` really drives every message |
| `test_integration`, `test_command_flows`, `test_bot`, `test_monitor` | The Discord edge through fakes: monitor → engine → announcer → channel, every slash command callback and event routing |
| `test_gui`, `test_launcher`, `test_logging`, `test_logsink` | The desktop launcher (headless via `tests/faketk.py`) and logging |
| `test_deployment`, `test_consistency` | That the container really starts from the files it copies; config, commands and docs cannot drift apart |
| `test_resilience` | The "Discord said no" paths: forbidden channels, rate limits, deleted messages, restarts mid-roll-call, plus **crash injection** at every DB-write to Discord-API boundary |

```bash
pip install -r requirements-dev.txt

./tools/check.sh          # compile + pyflakes + ruff + mypy + tests + simulations
./tools/check.sh --fast   # same, without the simulations
python -m pytest          # tests only — no Discord connection required

python tools/simulate.py              # print every message of a full 160h run, offline
python tools/simulate.py --fail-at 40 # …of a run that dies after 40 hours
```

`tools/simulate.py` drives **the real engine and the real message renderers** offline: it is the fastest way to review wording or verify a rule change end to end. Tooling configuration lives in `pyproject.toml`.

There is a ready-made GitHub Actions workflow (tests on Python 3.10–3.12, lint and both simulation paths) in `deploy/github-actions-ci.yml`: copy it to `.github/workflows/ci.yml` to enable it.

**Branding.** `assets/hellbotlogo.png` is the master artwork. After changing it, run `python tools/make_icon.py` to regenerate the window icon, the header logo and the multi-size Windows `.ico` used by the built executable.
