---
title: "Install & play"
icon: "download"
order: 20
blurb: "opening it, requirements and known problems."
description: "Opening VOID, what is needed, why the assets folder cannot be moved and what problems are open."
updated: "2026-10-18"
---

## What you need

Nothing. VOID is a self-contained HTML file: **there is no installation, build, dependency or server**.

| Requirement | Value |
| --- | --- |
| System | Anything with a modern browser |
| Node.js, Python, etc. | Not needed |
| Connection | No, once the repository is downloaded |
| Space | About 25 MB (almost all of it is the video) |

## Opening it

**Option A — Clone the repository**

```bash
git clone https://github.com/jaime-gaming/VOID.git
cd VOID/"VOID mxks version"
```

Then open `VOID mxks version (code).html` by double-clicking, or serve it:

```bash
python3 -m http.server 8000
# http://localhost:8000/VOID%20mxks%20version/VOID%20mxks%20version%20(code).html
```

**Option B — Download the file on its own**

If you only download the HTML, **you also need the `assets [DO NOT TOUCH]/` folder next to it**, with the same relative structure. Without the video, the scene that uses it fails.

## Why nothing can be moved

The folder is called `assets [DO NOT TOUCH]` for a concrete reason: the HTML references the asset by **relative path**.

```text
VOID mxks version/
├── VOID mxks version (code).html      ← references ./assets [DO NOT TOUCH]/…
└── assets [DO NOT TOUCH]/
    └── VOIDMXKSnight_shift.mp4
```

> [!IMPORTANT]
> Keep the exact structure. Renaming the folder, moving the video or changing the HTML's name **breaks the asset load**. The spaces and the brackets in the name are part of the path.

If the browser blocks the video because of its autoplay policy, it is usually solved by serving the folder over HTTP instead of opening the file with `file://`.

## Language

The interface is designed for **Spanish and English**, but neither version is finished:

| Version | Status | Issue |
| --- | --- | --- |
| Spanish | Unfinished | [#2 *Finish Spanish Version*](https://github.com/jaime-gaming/VOID/issues/2) |
| English | Unfinished | [#1 *Finish English Version*](https://github.com/jaime-gaming/VOID/issues/1) |

## Known problems

There are three open issues in the repository:

- **[#1](https://github.com/jaime-gaming/VOID/issues/1)** — finish the English version.
- **[#2](https://github.com/jaime-gaming/VOID/issues/2)** — finish the Spanish version.
- **[#3](https://github.com/jaime-gaming/VOID/issues/3)** — *There was a problem…*

> [!WARNING]
> Before investing time in a long playthrough, check the open issues: the story's locked content (the complete Archive and project integration) is **not hidden content you can unlock by playing**, but parts that are not implemented yet.

## Working on the code

The HTML file is large (~1.04 MB) because everything is integrated. Two practical pieces of advice:

1. **Do not reformat it wholesale.** An indentation change in a file like this produces an unreadable, hard-to-review diff.
2. **Edit it section by section**, searching for the specific text or identifier, instead of rewriting the file.

The repository includes `.github/agents/my-agent.agent.md`, a configuration for coding agents working on the project.

## Contributing

The two big tasks are already described as issues: finishing the Spanish version and finishing the English one. If you find a bug that is not covered, open an issue with:

- At what point in the game it happens.
- Browser and system.
- Whether you opened the file with `file://` or served it over HTTP.
- What you expected and what happened.
