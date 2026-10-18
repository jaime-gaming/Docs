---
description: "How the website gets its data: the GitHub API, the contribution calendar, Lanyard, READMEs and SEO."
updated: "2026-10-18"
---

## Projects

The list queries only the **public GitHub API** for the `jaime-gaming` user. Every repository links to `/projects/<owner>/<repository>/`.

GitHub Pages serves `404.html` for that route and `main.js` loads the data and the README in the browser, **so the pages do not need to be generated one by one**. It is the trick that holds the whole site up: a single error page acts as a client-side dynamic router.

```text
/projects/jaime-gaming/wave/
        │
        └──► GitHub Pages does not find the file
                     │
                     └──► serves 404.html  ──► main.js reads the path
                                                      │
                                                      └──► queries GitHub and renders the detail
```

### Rate limits and cache

GitHub queries are **anonymous** and share the public per-IP request limit. The site keeps a recent local copy to show if the API does not respond.

| Constant | Value | What it is for |
| --- | --- | --- |
| `GH_CACHE_FRESH_MS` | 5 minutes | When the cache is considered fresh |
| `GH_REFRESH_INTERVAL` | 10 minutes | How often it queries again |
| `GH_MAX_STALE_MS` | 7 days | When the cache stops being usable |

### Excluded repositories

```js
const EXCLUDED_REPOS = new Set([
  "jaime-gaming/jaime-gaming",
  "jaime-gaming/jaime-gaming.github.io",
  "pineappleva/.github",
]);
```

The profile README and the site itself do not appear as projects. Organization repositories are not shown.

### Fallback data

If the API fails and there is no browser cache, `assets/data/github.json` is used: **a real snapshot with its query date**. The interface identifies it as saved data, **not as live data**. This file contains no credentials.

> [!IMPORTANT]
> The calendar depends on an external service and Discord depends on Lanyard. **A connection error is never presented as the user being offline**: they are different things and the interface distinguishes them.

## Contribution calendar

It uses Jogruber's public `github-contributions-api`. Its responses are stored in the browser cache.

| Constant | Value |
| --- | --- |
| `CONTRIBUTION_CACHE_TTL` | 1 hour |
| `CONTRIBUTION_MAX_STALE` | 7 days |

The calendar is keyboard-navigable and tap-selectable. Choosing a day queries the public commits, issues and pull requests for that date.

### The committed snapshot

Besides the live source there is a **dated official snapshot** at `assets/data/contributions.json`, refreshed with `npm run sync:contributions`.

The script (`scripts/sync-contributions.mjs`) runs `execFile` against the GitHub GraphQL API and asks for the user's `contributionsCollection`:

| Field in the query | What it brings |
| --- | --- |
| `contributionCalendar` | `totalContributions` and the weeks, with `date`, `contributionCount` and `contributionLevel` per day |
| `commitContributionsByRepository(maxRepositories: 100)` | Per repository: `nameWithOwner`, `url`, `isPrivate` and owner, with `occurredAt` and `commitCount` for each contribution |
| `issueContributions(first: 100)` | Title, URL, number and repository of each issue |
| `pullRequestContributions(first: 100)` | The same for pull requests |

All four parts return `pageInfo.hasNextPage`, so the script knows when it came up short.

> [!IMPORTANT]
> That JSON exists so that **the calendar and the daily summary keep working when external services fail**. It is a dated copy committed in the repository, not a browser cache: both exist and they play different roles.

The five intensity levels use a green ramp consistent with the palette:

```css
.calendar__day { background: #263024; }                    /* level 0 */
.calendar__day[data-level="1"] { background: #415d31; }
.calendar__day[data-level="2"] { background: #638440; }
.calendar__day[data-level="3"] { background: #91b854; }
.calendar__day[data-level="4"] { background: var(--accent); }  /* #c8eb85 */
```

## Discord presence

Status and activity come from **Lanyard**, using the user identifier. The profile card reflects the standard statuses:

| Status | Colour |
| --- | --- |
| Online | `#90d79e` |
| Idle | `#e0c778` |
| Do not disturb | `#df8d8d` |
| Unknown | `var(--text-faint)` |

## Dynamic header

The header cycles prepared phrases while GitHub is queried. When the data arrives, it uses the **three most recent personal repositories**, excluding forks and archived or disabled repositories. Each phrase's link points to the corresponding project.

> [!NOTE]
> "Recent repos" describes the source; **it does not mean Jaime is coding at that moment**. The text stops being typed character by character with reduced motion and **pauses the effect when the tab is hidden**.

## Project READMEs

READMEs are fetched from GitHub's official `/readme` endpoint — **no name, casing or extension is assumed** — processed with Marked and sanitised with DOMPurify.

The libraries are copied to the `assets/vendor/` directory during the build and **their licenses are kept there**. The renderer supports tables, code, safe HTML, lists and images with relative paths.

When a README image fails to load, a `.readme-image-fallback` placeholder is shown instead of a broken icon.

### How it rewrites paths

The renderer lives in `assets/js/readme.js` and exposes a single global function, `window.renderProjectMarkdown(markdown, repo)`. From the repository it builds two bases and rewrites the README's relative paths against them:

```text
rawBase  = https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{dir}
linkBase = https://github.com/{owner}/{repo}/blob/{branch}/{dir}
```

`{dir}` is the README's directory inside the repository, and **each segment is encoded separately** with `encodeURIComponent` and then joined with `/`, so paths containing spaces or odd characters do not break. Images resolve against `rawBase` and links against `linkBase`.

### Task list checkboxes

Marked is configured with a custom renderer for `checkbox`. GFM task lists do not become an `<input>` — which the sanitizer would forbid — but an accessible span:

```html
<span class="readme-checkbox" role="img" aria-label="Completed">☑</span>
```

The `aria-label` comes from the active language's dictionary and the span carries `data-i18n-aria`, so **the label follows the chosen language without modifying the README's original document**.

### The sanitizing policy

DOMPurify runs with an HTML profile and two explicit forbid lists:

| Option | Value |
| --- | --- |
| `USE_PROFILES` | `{ html: true }` |
| `FORBID_TAGS` | `form`, `input`, `button`, `style`, `iframe`, `video`, `audio` |
| `FORBID_ATTR` | `style` |

The practical consequence: a third-party README cannot slip forms, interactive controls, inline styles or embedded content into the site.

## Profile data

The presentation follows the public README of `jaime-gaming/jaime-gaming`: HTML, learning JavaScript, TypeScript and Python, games shared with teammates and founder of Pineapple.

> [!IMPORTANT]
> **No proficiency percentages are assigned.** The progress bars on some sites of this kind invent a precision that does not exist; here it describes what is used and in what context, with no figures.

The bio, location, public repositories and followers are queried on GitHub's REST API together with the projects. **Public activity events are neither queried nor displayed.**

## Search engines

The home page includes:

- A specific title and description.
- A canonical URL.
- Open Graph and Twitter metadata.
- `Person` structured data with the confirmed GitHub, YouTube and X links.

`robots.txt` allows crawling and links `sitemap.xml`, which is regenerated with the pages and blog entries.

The structured data is also updated when the language changes: `inLanguage` and the description are rewritten in the `#personStructuredData` node.

## Icons

The sprite is generated at build time from two sources:

```js
const uiIcons = {
  code: "code-xml", music: "music", mail: "mail", star: "star",
  fork: "git-fork", commit: "git-commit-horizontal", globe: "globe", /* … */
};
const brands = { github: siGithub, discord: siDiscord, youtube: siYoutube, x: siX };
```

Interface icons come from **lucide-static** and only the `<svg>` content is extracted, wrapped in a `<symbol>`. Brand icons come from **simple-icons** and are injected as `<path fill="currentColor" stroke="none">`.

Each icon is used with `<use href="/assets/img/icons.svg?v=<hash>#icon-name">`, so one single file serves the whole site and the browser caches it once. `renderIcon()` throws at build time if an unknown icon is requested, instead of rendering a gap.
