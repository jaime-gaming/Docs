---
description: "Accessibility notices, the real project status and how to contribute to VOID."
updated: "2026-10-18"
---

## Accessibility and health

The VOID Corp story includes fictional warnings — reflective surfaces, "phantom vision", voices claiming to be Michael Burns — which are part of the work. But there are **two real things** worth taking seriously.

> [!WARNING]
> **High-contrast CRT simulation.** The game uses high contrast and tube aesthetics. If you have photosensitive epilepsy or sensitivity to flashes, or if high-contrast screens cause you eye strain or dizziness, this game may not be for you. Keep sessions short, with ambient light, and stop as soon as you feel discomfort.

> [!IMPORTANT]
> **Audio with headphones.** The story asks for high-fidelity headphones because the system "communicates through subharmonics". In practice, a horror game with headphones in a dark room is an intense experience. Raise the volume gradually and do not play with headphones if that makes you anxious.

The two instructions from the story that **do** have a reasonable practical reading:

| From the story | Practical reading |
| --- | --- |
| "Switch it off immediately if you see something that does not match" | If something makes you uncomfortable, stop. It is a game. |
| "Do not try to skip the decryption headers" | There is no hidden content to unlock by forcing the code: what is missing, is missing |

## Project status

### Is it finished?

**No.** It is a beta and both language versions are unfinished:

| Issue | What it is |
| --- | --- |
| [#1 *Finish English Version*](https://github.com/jaime-gaming/VOID/issues/1) | Finish the English version |
| [#2 *Finish Spanish Version*](https://github.com/jaime-gaming/VOID/issues/2) | Finish the Spanish version |
| [#3 *There was a problem…*](https://github.com/jaime-gaming/VOID/issues/3) | A detected problem |

### Is there locked content I can unlock?

**No.** The complete Archive and project integration appear as "encrypted" and "restricted" in the story, but in practice they are parts that are **not implemented**. It is not a puzzle: it is pending work.

### How many languages can I play in?

The interface is designed for Spanish and English, but **neither version is complete**. Expect unwritten stretches in both languages.

### Do I need to install anything?

**No.** It is a self-contained HTML file of ~1.04 MB plus an assets folder with a video of ~23.5 MB. There is no build, no dependencies and no server. The steps are in [Install & play](/void/install/).

### Can I move the file to another folder?

You can move the HTML **if you also move the `assets [DO NOT TOUCH]/` folder next to it, with the same relative structure**. The video is referenced by relative path and the spaces and brackets in the name are part of the path.

### Why is the video not showing?

Two common causes: the assets folder is missing from its place, or the browser blocks playback when the file is opened with `file://`. Serving the folder over HTTP (`python3 -m http.server 8000`) usually solves it.

## Contributing

### Where do I start?

With the two big issues, which are already described: finishing the Spanish version and finishing the English one. They are content work, not just code.

### Tips for touching the code

1. **Do not reformat the file wholesale.** It is ~1.04 MB with everything integrated: an indentation change produces an impossible-to-review diff.
2. **Edit it section by section**, searching for the specific text or identifier.
3. **Do not touch `assets [DO NOT TOUCH]/`** unless you know exactly which broken reference you are fixing.
4. The repository includes `.github/agents/my-agent.agent.md`, a custom agent for coding agents. Mind what it is: it is named **Michael Burns**, its description is *VOID always watches…*, and its system instruction plays him as an ex-employee of VOID who tried to shut ECO down. It is stage dressing from the story built on a real piece of the platform, **not a neutral technical assistant**. If you want practical help with the code, do not count on that agent stepping out of character.

### What is the repository's custom agent?

A file at `.github/agents/my-agent.agent.md` in GitHub's custom agent format. It declares the name **Michael Burns** and the description *VOID always watches…*, and its system instruction, written in Spanish, casts him as an ex-employee of VOID who tried to shut ECO down once and whose whereabouts are unknown. It ends by asking him to **always speak in English**.

It is committed to the default branch, which is the requirement for a custom agent to be available. It is part of the work: the detail is in [The VOID Corp world](/void/world/).

### What information should I give when opening an issue?

- At what point in the game it happens.
- Browser and operating system.
- Whether you opened the file with `file://` or served it over HTTP.
- What you expected to happen and what happened.
- Which language you were playing in.

## About the project's tone

VOID's README is written entirely inside the fiction: it is a VOID Corp corporate document addressed to somebody freshly "selected". It is a deliberate design decision and part of the experience.

This documentation does the opposite on purpose: **it separates the story from the real status**, so that whoever arrives knows what is the work and what is pending work. If you are going to contribute, that distinction is the first thing you need to be clear about.
