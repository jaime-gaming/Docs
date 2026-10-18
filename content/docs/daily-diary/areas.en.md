---
description: "Diario's five areas: Today, Routine, Archive, Progress and Thoughts, plus Settings."
updated: "2026-10-18"
---

## Today

Mood, sleep, dedication, notes, tags, energy, stress and gratitude.

> [!NOTE]
> **Notes are optional.** If you only log a mood or a figure, that is what gets saved and nothing more: the notebook never writes text on its own.

Trends and summaries use **local rules**. The day summary is generated with `if/else` templates and fixed phrases, with no model at all.

Subroutes: none — it is the main page.

## Routine

Habits, streaks, **35-day** consistency, counters and tasks for tomorrow.

What you tick stays as a **pending change for the day**: nothing is lost when you switch pages, and it enters the notebook when you save that day.

| Subroute | What it shows |
| --- | --- |
| `/rutina` | The day's habit board |
| `/rutina/semana` | The week at a glance |
| `/rutina/contadores` | Your own figures, with unit, goal and icon |
| `/rutina/rachas` | Streaks and the consistency grid |

### Custom counters

They are created in *Settings → Content* with **unit, goal and icon**. Maximums: **12 counters** and **8 writing parts**.

The water counter uses your profile's `waterGoal`; the others carry their own goal. A counter becomes undefined if you remove its title, and entries are **never broken** by a strange number in a custom counter: the figure is ignored.

There are eight starting labels (`COUNTERS` in `src/data/constants.js`) and eight writing presets (`PART_PRESETS`). Adding a new one is, literally, a button in *Settings → Content*.

## Thoughts

An **independent** space, not the notebook's theme.

> [!IMPORTANT]
> Bottles **do not show or allow opening their text while adrift**: they can only be read when they come back. The return date is **never shown on screen**.

That is the area's core mechanic: letting go of a thought and being unable to reread it until it returns. The weather report of the day you cast it is a **deterministic function of the date**, so it travels inside the bottle and needs no network.

| Subroute | What it shows |
| --- | --- |
| `/pensamientos` | The sea |
| `/pensamientos/pendientes` | Bottles adrift |
| `/pensamientos/guardados` | The ones that came back and you anchored |
| `/pensamientos/archivados` | The rest |

A bottle's `status` moves from `drifting` to `returned` (the spring tide brought it back) or to `lost` (it sank) **when the notebook is opened**.

## Archive

History and calendar.

- **History** — cards with search and status filter; view, edit and delete with confirmation.
- **Calendar** — logged days are marked with **the colour of their mood**.

| Subroute | What it shows |
| --- | --- |
| `/archivo` | History with search and filters |
| `/archivo/calendario` | The mood-colour calendar |

## Progress

Statistics and summaries.

- **Adaptive SVG chart** with explicit scales for mood and sleep, gaps for missing days and a sleep goal.
- **Real coverage**: without counting future days. Mean and median. It ignores optional metrics that were not logged and avoids duplicating days.
- **Trends** comparing **medians**, which require more data before suggesting associations. **Never causality.**
- **Your week / Month summary** — averages, totals, best and worst days, streaks and an automatic template-based text.

| Subroute | What it shows |
| --- | --- |
| `/progreso` | General statistics |
| `/progreso/semana` | Your week |
| `/progreso/mes` | The month summary |

> [!NOTE]
> Trends compare medians instead of means so that one extreme day cannot invent a pattern, and they demand more data before suggesting anything. It is a deliberate decision: a notebook telling you that you sleep worse because you study more is inventing a causality it cannot possibly know.

## Settings

Profile, appearance, content and data. It lets you pick themes, add fields and create counters with unit, goal and icon.

| Subroute | What it controls |
| --- | --- |
| `/ajustes` | Profile and general settings |
| `/ajustes/apariencia` | Themes and motion |
| `/ajustes/contenido` | Writing parts and custom counters |
| `/ajustes/datos` | Export, import, download a copy, delete everything and half-finished days |

### Motion

Page transitions and card animations. It respects both **`prefers-reduced-motion`** and the reduce-animations option in Settings.

### Mobile

Compact header, access to Settings and bottom navigation with room for the **device's safe areas**.
