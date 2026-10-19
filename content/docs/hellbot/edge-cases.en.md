---
description: "hellbot's 32 edge cases and what the bot does in each: milestones, grace, roll call, pause, restarts, outages and mid-run edits."
updated: "2026-10-19"
---

A 160-hour event cannot be repeated. If something goes wrong at hour 90 there is no second run, so the odd cases are not an appendix: they are the rules. The repository's [`README.md`](https://github.com/jaime-gaming/hellbot/blob/main/README.md) lists them in a 32-row table, noting that **all of them are covered by tests**. Here they are grouped by theme, which is how you look them up when something is actually happening.

> [!NOTE]
> The right-hand column is the behaviour, not the intention. If the bot does something else, that is a bug: these cases have a test behind them.

## Milestones and ranking

| Case | What it does |
| --- | --- |
| Someone joins **exactly** as a milestone lands | Included in that milestone's eligible snapshot |
| Someone leaves **exactly** as a milestone lands | Excluded from the snapshot |
| A milestone lands while the voice channel is empty | Held back, then awarded to whoever is present when the channel recovers, or lost with the run |
| The bot restarts around a milestone | The atomic database claim prevents duplicates, and unsent announcements are re-posted on boot |
| 160 h hits during a 10 s update | The 1 s tick clamps everything to `start_ts + 160h`; **completion wins** over an empty channel at the deadline |
| Two people with identical total times | Shared rank and a deterministic display order |
| 250 people in the channel when a milestone lands | The message is split across embed fields and **never exceeds Discord's limits** |

## Who counts as a participant

| Case | What it does |
| --- | --- |
| A bot joins the channel | Ignored everywhere; it **cannot keep the event alive** |
| A `@clanker` joins | Disconnected immediately, no leaderboard time, and it cannot keep the event alive |
| Rapid, repeated joins and leaves | One-second sampling keeps the per-user totals correct |
| Someone leaves and returns | Totals continue accumulating |
| Someone joins in the middle of an alive check | Not pinged, not required to answer, and **never kicked for it** |

## Empty channel, grace and alive checks

| Case | What it does |
| --- | --- |
| The last valid participant leaves | A **15 s** grace window plus a no-ping warning; `FAILED` only if nobody returns |
| Someone rejoins with 1 s to spare | The window closes, the **«SAVED»** notice appears and the run continues untouched |
| The channel empties repeatedly | **Each empty period gets its own window**; survived time is never inflated |
| Restart in the middle of a grace window | The window resumes from the persisted `grace_started_ts` |
| Alive check plus restart | The check state is persisted: replies sent while offline are recovered, and an expired check **is cancelled instead of kicking people** |
| Everybody ignores the alive check | Everyone is disconnected, the channel empties and a **2-minute recovery grace period** starts before failure |

## Pause

| Case | What it does |
| --- | --- |
| The bot restarts while paused | The event comes back paused: both clocks stay frozen until `/hell resume` |
| Paused during a bug | The global and per-user clocks freeze; no milestones, no roll calls, no grace expiry, no failure. **Pause time is never counted** |
| Pause catches an open grace window | The countdown freezes too; on resume it **continues with the time it had left** |
| Pause crosses the 160 h mark | Completion waits for **effective** time: a paused run can never complete early |

## Restarts, outages and the Discord API

| Case | What it does |
| --- | --- |
| The event ends with DMs unsent | `dm_log` resumes delivery on the next start, **without duplicates** |
| A contestant has DMs closed | Recorded as blocked, reported in the summary, and `/hell mystats` still works |
| The Discord API is slow during a roll call | Kicks and announcements run **off the one-second loop**, so channel monitoring never stalls |
| No internet, bad token or a missing intent | A clean one-line error and a distinct exit code; the full traceback stays in `logs/` |
| The bot restarts mid-event | State is reloaded from SQLite; elapsed is `now - start_ts` and **nothing resets** |
| The bot is offline briefly (restart, deploy, crash) | The timer keeps running and **anyone in the channel before *and* after the outage gets that time credited back**: nobody loses progress to the bot's downtime |
| The bot is offline for a long time | The timer still keeps running, but the unobserved window is **not credited to anyone** and is reported in the progress message |
| The Discord API fails to send a message | Logged and retried on the next cycle; **the event state is untouched** |

## Editing the event mid-run

| Case | What it does |
| --- | --- |
| A milestone is edited into a broken shape | Rejected with a readable reason and **the previous table stays live** |
| The event length is edited while the run is going | Refused and logged: **the running clock is never reshaped** |

## Two deliberate policy calls

Both are explained by the README itself and deserve to stand apart, because they are choices rather than consequences.

> [!IMPORTANT]
> **Downtime does not fail the event.** The bot cannot prove the channel emptied while it was blind, so it does not fail. But nobody earns leaderboard time for that window, and the gap is shown in the progress and status output.

> [!WARNING]
> **If the channel is empty in the same tick a milestone would land, the failure wins.** Nobody was present to claim the reward.

## Where to go next

- [Event rules](/hellbot/rules/) — the normal rules, whose edge these cases are.
- [Architecture](/hellbot/architecture/) — the invariants that keep these behaviours holding after a restart.
- [Commands](/hellbot/commands/) — `/hell pause`, `/hell resume`, `/hell reset` and `/hell mystats`.
