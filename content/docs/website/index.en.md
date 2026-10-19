---
description: "What jaime-gaming.github.io is, what it includes and how it relates to this documentation hub."
updated: "2026-10-18"
---

**jaime-gaming.github.io** is Jaime Gaming's personal site, published at [jaime-gaming.github.io](https://jaime-gaming.github.io/). It is also the site **this documentation inherits its entire aesthetic from**: palette, fonts, animations and component structure.

## What it includes

- **Dark, mobile-friendly design**, with a live profile, visual cards and animations; it respects the reduced-motion preference.
- **Spanish and English interface.**
- **List of public repositories** from the `jaime-gaming` account, forks included. Organization repositories are not shown. The data is refreshed every ten minutes.
- **Detail page per repository**, with links to the project and a reading of its README when available.
- **Daily contribution calendar**, keyboard-navigable and tap-selectable.
- **Discord status and activity** through Lanyard.
- **Blog generated from Markdown.** The build also removes post pages whose source no longer exists.

## Structure

```text
content/                    # Editable sources
  home.fragment.html        # Home sections
  projects.fragment.html    # Project listing
  contact.fragment.html     # Contact shared between the home page and /contact/
  404.fragment.html         # Error page and project detail
  blog/*.md                 # Markdown posts
scripts/
  layout.mjs                # Shared HTML template
  build.mjs                 # Generates static pages and cleans up obsolete posts
assets/css/style.css        # Styles
assets/js/i18n.js           # ES/EN texts
assets/js/main.js           # Sync, calendar and presence
index.html, projects/, blog/, contact/   # Generated pages; do not edit by hand
```

The important rule: **`content/` and `scripts/` are edited; everything else is generated.** The `index.html`, `projects/`, `blog/` and `contact/` pages are overwritten on every build.

## The palette this documentation inherits

The whole design system lives in `assets/css/style.css`, in the `:root` variables:

```css
:root {
  color-scheme: dark;
  --bg: #0d100d;
  --surface: #151915;
  --surface-raised: #1d231c;
  --text: #edf0e8;
  --text-dim: #adb5a7;
  --text-faint: #8b9584;
  --accent: #c8eb85;
  --border: #30382c;
  --font: "DM Sans", system-ui, sans-serif;
  --font-display: "Space Grotesk", var(--font);
  --font-mono: "IBM Plex Mono", monospace;
  --maxw: 1040px;
  --nav-height: 72px;
}
```

The three fonts each have a fixed role:

| Font | What it is for |
| --- | --- |
| **Space Grotesk** | Headlines and highlighted figures (`--font-display`) |
| **DM Sans** | Body text (`--font`) |
| **IBM Plex Mono** | Micro-labels, code and data (`--font-mono`) |

## The motion system

All animations are inside `@media (prefers-reduced-motion: no-preference)`, and there is a `reduce` block that disables them all:

```css
@media (prefers-reduced-motion: no-preference) {
  a, button { transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease; }
  .reveal.in-view { animation: reveal-in 400ms ease both; }
  .hero__typed::after { animation: caret 1s steps(2, start) infinite; }
  @keyframes reveal-in { from { transform: translateY(6px); } to { transform: none; } }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

The scroll reveal is done by an `IntersectionObserver` with a 0.08 threshold, which adds `.in-view` once and then stops observing the element.

## How it relates to this documentation

This documentation site is **not a fork** of the main website: it is a separate project that deliberately copies its design system.

| Aspect | Main website | This documentation |
| --- | --- | --- |
| Purpose | Portfolio and presence | Technical documentation |
| Content | HTML fragments + posts | Markdown per project and language |
| Data | Live from the GitHub API and Lanyard | Static, hand-written |
| Layout | Stacked sections at 1040 px | Three columns: sidebar, content, TOC |
| Palette and animations | Defines them | **Inherits them identically** |
| i18n | `data-i18n` + `#pageTranslations` | The same mechanism |
| Publishing | Root of `jaime-gaming.github.io` | Subfolder `/Docs/` |

Sharing the language switch has a useful effect: both sites store the preference under the **same `lang` key in `localStorage`**, and since they share an origin, switching language on one applies to the other.

## Further reading in the repository

This guide summarizes and orders things. This is what the repository holds, with its real sizes, in case you want to go to the source.

| Document | Size | What it is |
| --- | --- | --- |
| [`assets/js/main.js`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/js/main.js) | 69 KB | The home page logic: cards, contributions calendar, scroll reveal and routing |
| [`assets/data/github.json`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/data/github.json) | 54 KB | The committed snapshot of the repositories |
| [`assets/data/contributions.json`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/data/contributions.json) | 53 KB | The committed snapshot of the contributions calendar |
| [`tests/site.test.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/tests/site.test.mjs) | 37 KB | The site's 24 tests |
| [`assets/js/i18n.js`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/js/i18n.js) | 30 KB | The ES ↔ EN switcher and the translations |
| [`assets/css/style.css`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/css/style.css) | 28 KB | **The stylesheet this documentation's look is cloned from** |
| [`index.html`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/index.html) | 24 KB | The home page |
| [`README.md`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/README.md) | 12 KB | The introduction and the generator's decisions |
| [`content/home.fragment.html`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/content/home.fragment.html) | 12 KB | The home fragment the build injects |
| [`scripts/build.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/scripts/build.mjs) | 10 KB | The static generator |
| [`scripts/layout.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/scripts/layout.mjs) | 7 KB | The shared template |
| [`content/blog/lanzamiento-wave.md`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/content/blog/lanzamiento-wave.md) | 6 KB | The blog post about Wave |
| [`lanzamiento-wave.en.md`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/content/blog/lanzamiento-wave.en.md) | 5 KB | The same post in English |
| [`404.html`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/404.html) | 6 KB | The client-side routing fallback: it serves the per-repository pages |
| [`tests/preview.test.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/tests/preview.test.mjs) | 2 KB | The preview server's tests |
| [`package.json`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/package.json) | 700 B | The three scripts, including `sync:contributions` |

> [!NOTE]
> The two snapshots in `assets/data/` are committed on purpose: the home page renders from what is in the repository and does not depend on GitHub answering at that moment. `npm run sync:contributions` refreshes them.

## Guide tour

- [Build & preview](/website/build/) — generating the site, serving it locally and the checks.
- [Editing content](/website/content/) — adding a post, changing texts and how i18n works.
- [Site architecture](/website/architecture/) — GitHub data, the calendar, Lanyard, READMEs and SEO.
