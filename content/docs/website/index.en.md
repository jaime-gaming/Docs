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

## Guide tour

- [Build & preview](/website/build/) — generating the site, serving it locally and the checks.
- [Editing content](/website/content/) — adding a post, changing texts and how i18n works.
- [Site architecture](/website/architecture/) — GitHub data, the calendar, Lanyard, READMEs and SEO.
