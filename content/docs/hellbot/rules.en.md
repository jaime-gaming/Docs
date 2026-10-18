---
description: "The complete rulebook: two timelines, milestones, difficulties, gambling, alive checks and the 160-hour finale."
updated: "2026-10-18"
---

## Two explicit timelines

The code keeps these two clocks in separate modules **on purpose**: mixing them up is the classic way this kind of bot goes wrong.

| | Module | Range | Moved by | Stopped by |
| --- | --- | --- | --- | --- |
| **Global event timeline** | `hell/timeline.py` — `EventTimeline` | **0 → 160 h** | Nothing but the wall clock | The run ending (FAILED / COMPLETED / CANCELLED) |
| **Per-user session timeline** | `hell/tracking.py` — `UserTimeTracker` | **0 → X h** per person | That person being in the channel | That person leaving (their clock only) |

A user disconnecting, leaving, being alive-check-kicked or being removed as `@clanker` **never** touches the global 0 → 160 h progress, as long as at least one valid participant remains. Their own 0 → X h clock simply pauses and resumes where it left off when they come back.

## The one-second loop

1. Read the target voice channel members.
2. Drop bots.
3. `@clanker` → `member.move_to(None)` immediately (plus an `on_voice_state_update` fast path), and they never appear in the participant list.
4. The remaining humans are the valid participants; each one's own clock is credited for the observed interval.
5. If `valid_human_count == 0` → the **grace period** opens. Only when it expires is the run FAILED permanently, with the leaderboard frozen and saved.

## Empty-channel grace period

```text
Channel empties ──► GRACE OPEN (15s) ──► somebody joins in time ──► run continues
                                    └──► nobody joins ──────────► run FAILED
```

- The warning embed goes to the progress or announcement channel **with pings explicitly disabled** (`AllowedMentions(everyone=False, users=False, roles=False)`): it alerts whoever is already watching without waking the server.
- If a valid human joins before the deadline, a "✅ SAVED — THE RUN CONTINUES" notice is posted, also without pings, and the 160 h clock — which never stopped — carries on.
- Nobody accrues per-user time during the window and milestones do not fire while the channel is empty (there would be nobody to claim them). A milestone landing mid-window fires on the first tick with people back in.
- If the window expires, the event fails **as of the moment the channel emptied**, not the moment the window ran out: grace can never inflate survived time.
- The window is persisted (`event.grace_started_ts`), so a restart mid-countdown resumes it.
- Length is `EMPTY_VC_GRACE_SECONDS` (15 by default; `0` restores instant failure).

## Milestones

Driven purely by the **global** timer (`now - start_ts`), never by individual user time.

| Milestone | Reward |
| --- | --- |
| 32 h | `@hell` — limited |
| 64 h | Limited-time Verity in [Find the Verities](https://www.roblox.com/games/138268356635577/Find-the-Verities) |
| 96 h | `@hell-ist` — limited |
| 128 h | Music permissions for everyone, provided they are not abused |
| 160 h | `@hell master` — limited |

Each is claimed with an `INSERT OR IGNORE` in SQLite: **only the writer that actually inserted the row announces**, so a milestone can never fire twice, not even if the bot restarts in the very second it lands. The `announced` flag is only set after Discord accepts the message, so a crash in between re-posts it on the next startup instead of losing it.

> [!NOTE]
> **Rewards are announcement-only.** The bot never assigns roles: it posts exactly who is eligible at each milestone so a human can hand them out.

At **160 h** the event also becomes `COMPLETED`: the timer stops (it never counts past 160 h), leaderboard accumulation stops, rankings are frozen and displayed, and the final Top 3 are announced as receiving **every milestone reward + `@cool people :D`**.

## Difficulties 0 to 4

Difficulties make the challenge harder as the event progresses, expanding at every milestone reached.

| Level | Range | Alive checks | Dead checks | Gambling |
| --- | --- | --- | --- | --- |
| **0 · Starter** | 0–32 h | every 1–6 h | No | No |
| **1 · 32 h milestone** | 32–64 h | every 1–5 h | No | No |
| **2 · 64 h milestone** | 64–96 h | every 1–4 h | Yes: reply `Yes` and get **muted 1 minute** | No |
| **3 · 96 h milestone** | 96–128 h | every 1–3 h | More frequent, **1–5 minute** mutes | **Unlocked**: max 1 h bet, 2 bets/h, 38% win (+1.5×) / loss (−1.0× + 1 min mute) |
| **4 · 128 h milestone** | 128–160 h | every 1–2 h | **5–15 minute** mutes | High stakes: max 2 h, 3 bets/h, 28% win, 2.5× multiplier |

## Alive checks

At a **random interval between 1 and 6 hours**, while the event is running, the bot posts in the channel chat:

```text
@alice @bob @carol
🚨 ARE YOU ALIVE? Say: Yes
Reply with Yes in this channel within 5 minutes or you will be disconnected from the VC.
You keep all your leaderboard time and can rejoin immediately.
```

- Everyone **currently in the channel** is pinged; bots and `@clanker` users are never included.
- Each has **5 minutes** to reply `Yes` in that channel (case-insensitive by default; `ALIVE_CHECK_STRICT=true` demands the exact string). Counted answers get a ✅ reaction.
- Replying **No** — or any of its synonyms (`nope`, `nah`, `never`, `hell no`, `no way`, `nop`, `not sure`, `para nada`, `nunca`, …) — is an **instant but painless exit**: you are disconnected, you keep all your leaderboard time, and when you rejoin the bot DMs you *"Psssst, you don't have to do the Alive Check."* so you know coming back needs no answer.
- Whoever stays silent is **disconnected from the channel**. Their accumulated time is **not** touched and they may **rejoin immediately**.
- A disconnect never fails the event by itself: the run only ends if the channel is left with no valid humans at all.
- People who join *during* a check are not required to answer; people who already left are not chased.
- The pending check is persisted. If the bot restarts mid-check it resumes and even reads back answers posted while it was offline; if the 5 minutes expired during the downtime the check is **cancelled** — nobody is punished for the bot being away.
- **The next check time is never announced** (that would defeat the point). `/hell status` only says checks happen randomly every 1–6 h. The moment is drawn uniformly inside the current difficulty's range, so it can land on **any second of that window**.

## Gambling

Unlocked at **difficulty 3** (96 h). Players bet from the Hell channel with `/hell gamble` or `!gamble [hours] [real|gamble]`. Every roll needs at least **15 minutes of clock left**: betting your entire time is always refused. Bets snap to **15-minute chips** and are capped by difficulty (1 h at D3, 2 h at D4).

Two clocks, one house:

**Real Timer** — the rate-limited game. You lose the stake **and** get a server mute (1 minute base, +1 minute per extra 15-minute chip). Cooldown 5 min (D3) or 4 min (D4) between **fast bets** (2/h at D3, 3/h at D4); once the quota is used, the same bet stays possible on a separate **overflow timer** (45 min at D3, 30 min at D4). Cooldowns and history persist in SQLite per event, so a restart — or a brand-new run — never leaks stale state.

**Gamble Time** — a private wallet everybody starts with **1 h** in. No rate limits, but a loss costs **1.5×–2× the stake** (heavier the bigger the bet) and there is no mute. The wallet is visible to everyone on `/hell leaderboard` → `Gamble Time`.

Odds scale with difficulty (38% at D3, 28% at D4) and **drop with the stake**: at the max bet you keep 70% of the listed chance, while the multiplier grows a little (+0.5 at the max stake: 1.5×→2.0× at D3, 2.5×→3.0× at D4). A win credits **bet × multiplier** on top of the untouched stake, and an extra **jackpot** (8% of the win band, +1.0 multiplier) pays even more.

> [!IMPORTANT]
> **Every bet is negative expected value.** The house is Hell and Hell always wins.

Every result shows the payout, the new clock total and the player's **session stats** (bets, W/L, net; plus fast bets left for Real Timer). The full record persists per event and shows on `/hell mystats` and in the stat card DM at the end. Before betting, `/hell odds` or `!odds` shows the exact odds and payout for the 15-minute chip and the max bet of the current difficulty, **so nobody bets blind**.

## The 160-hour finale

A dedicated system governs the final hour (`159:00:00 → 160:00:00`) without accelerating the global timer:

| Moment | What happens |
| --- | --- |
| **159:00:00** | Activates `FINAL_HOUR` mode and broadcasts: `👹 THE FINAL HOUR — 1 HOUR REMAINING — DO NOT LET HELL GO EMPTY.` |
| **159:30:00** | `⚠️ 30 MINUTES REMAIN` announcement |
| **159:50:00** | `🚨 10 MINUTES REMAIN — HELL IS ALMOST CONQUERED.` announcement |
| **159:55:00** | `🔥 5 MINUTES REMAIN` announcement |
| **159:59:00** | Progress switches to **final countdown mode**, updating every second with exact seconds (`60` down to `1`) |
| **160:00:00** | Atomic completion: fires the 160 h milestone, freezes all individual time, marks `COMPLETED`, records peak channel population, sends the `@everyone` announcement highlighting Top 3 rewards and DMs stat cards to all participants |

**Failure safety:** if the channel empties during the final hour, the standard grace countdown runs. If nobody returns before it expires, the challenge fails permanently.

## Leaderboard

Per-user accumulated channel seconds, credited only while the event is `RUNNING`, sorted high to low, with 🥇🥈🥉 for the Top 3 and the rest numbered below. Exact ties share a rank (`1, 1, 3`). Leaving and returning **keeps accumulating** instead of resetting. Frozen and saved on FAILED, COMPLETED or CANCELLED.

## Hell 2

At 160 h completed, and after the stat cards are sent, the bot posts a *"keep on Hell?"* vote with **Yes/No** buttons that stays open **10 minutes**. If most votes are **Yes**, a host can run `/hell resume` and the same event continues to **320 h**. After 160 h there are **no milestones**: only one final and **secret** reward at 320 h.
