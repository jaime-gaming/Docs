---
description: "What VOID is, its premise, how it is built and what state it is in."
updated: "2026-10-18"
---

**VOID** is a psychological game set in a mysterious corporation where everybody and everything disappears.

> *Michael Burns disappeared last year. Do you want to go in?*

> [!WARNING]
> **Status: beta and under development.** Both language versions are unfinished: issue [#2 *Finish Spanish Version*](https://github.com/jaime-gaming/VOID/issues/2) and [#1 *Finish English Version*](https://github.com/jaime-gaming/VOID/issues/1) are still open. There is also issue [#3](https://github.com/jaime-gaming/VOID/issues/3) about a detected problem. What exists today is playable, but not complete.

## This documentation separates two things

The repository's README is written **inside the fiction**: it is a VOID Corp installation guide addressed to somebody who has been "selected". It is part of the work, not technical documentation.

That is why this guide always distinguishes:

| Layer | What it is |
| --- | --- |
| **The story** | VOID Corp, the ECO system, Level −3, Michael Burns, mirror-rotation authentication |
| **The reality** | An HTML file of ~1.04 MB with everything integrated, an assets folder with a video of ~23.5 MB, and three open issues |

The story is documented in [The VOID Corp world](/void/world/). The technical side, in [Install & play](/void/install/).

## The premise

You have been "selected" — by merit, by chance or by algorithmic inevitability — and now you hold the keys to the **ECO system**. The installer is a container for the whole VOID suite: every experiment, every log and every fragment of consciousness that has been archived.

Because of stability problems with **Level −3 (Absolute Latency)**, the executive board has restricted access: the complete ecosystem is present in the package, but **only the BETA interface is unlocked**.

According to the story itself, the "Beta" label does not measure how much the software is missing, but **how much you are missing**.

## How it is built

```text
VOID/
├── .github/agents/my-agent.agent.md     # custom agent: Michael Burns
├── README.md                            # the install guide, written inside the fiction
└── VOID mxks version/
    ├── VOID mxks version (code).html    # 1,091,298 bytes (~1.04 MB), everything integrated
    └── assets [DO NOT TOUCH]/
        └── VOIDMXKSnight_shift.mp4      # 24,686,173 bytes (~23.5 MB)
```

The game is those two files. Everything else in the repository is documentation plus one piece of stage dressing that counts as content: a **custom agent** for coding agents that plays Michael Burns, the disappeared ex-employee.

Two technical decisions define the project:

1. **A single HTML file.** Markup, styles and script are integrated. No build, no dependencies, no server: you open it and it works.
2. **Assets apart, untouched.** The folder is literally named `assets [DO NOT TOUCH]`, because the HTML references that video by its relative path. Moving or renaming it breaks the scene.

The high-contrast CRT simulation is the game's visual identity, and the README warns that it can cause "phantom vision" after prolonged sessions.

## What the package includes

According to the installer's own listing:

| Content | Status |
| --- | --- |
| VOID Interface (ES/EN) | ✓ Functional. Your main workspace. |
| ECO camera feed | Partially functional. Some floors are… dark. |
| The Archive (complete) | 🔒 Encrypted. Awaiting Level 2 authorization. |
| Project integration | 🔒 Restricted. |

## Basic commands

Once the terminal boots, there are three interactions available in the beta:

| Command | What it does |
| --- | --- |
| `scan` | Check whether they are inside the logic gates |
| `trace` | Follow the leaks. The truth is usually in the junk data |
| `connect` | Reach the external hosts |

> *Remember: if you ping the VOID, the VOID pings you back.*

## Further reading in the repository

This guide summarizes and orders things. This is what the repository holds, with its real sizes, in case you want to go to the source.

| Document | Size | What it is |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/VOID/blob/main/README.md) | 3 KB | The introduction and the three open issues |
| [`.github/agents/my-agent.agent.md`](https://github.com/jaime-gaming/VOID/blob/main/.github/agents/my-agent.agent.md) | 510 B | The custom agent **Michael Burns**, written as narrative props |
| [`VOID mxks version (code).html`](https://github.com/jaime-gaming/VOID/blob/main/VOID%20mxks%20version/VOID%20mxks%20version%20%28code%29.html) | 1.04 MB | The whole game in a single file, everything integrated |

> [!NOTE]
> The repository is four files and a 23.5 MB video in `VOID mxks version/assets [DO NOT TOUCH]/`. There is no build and no dependencies to document: the game **is** the HTML file.

## Guide tour

- [Install & play](/void/install/) — opening it, requirements and known problems.
- [The VOID Corp world](/void/world/) — the story: system architecture, pre-install protocol and warnings.
- [Warnings & FAQ](/void/faq/) — accessibility, project status and how to contribute.
