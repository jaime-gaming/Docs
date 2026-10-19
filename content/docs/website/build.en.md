---
description: "Generating the website, serving it locally with the same behaviour as GitHub Pages and running the checks."
updated: "2026-10-18"
---

## Build and local preview

```bash
npm install
npm run build
python3 scripts/preview_server.py
```

The local server binds `0.0.0.0:8000` and serves `404.html` as a fallback for the dynamic routes `/projects/<owner>/<repository>/`, **exactly like GitHub Pages**.

The build regenerates `index.html`, `projects/index.html`, `404.html` and the blog pages. Changes under `assets/` are served directly, without recompiling.

## The three scripts

`package.json` declares exactly three, and each one does a different thing:

| Script | Command | What for |
| --- | --- | --- |
| `npm run build` | `node scripts/build.mjs` | Generates the pages, the icon sprite, `sitemap.xml`, and copies the vendors |
| `npm test` | `node --test` | Runs the suite with Node's native runner, no framework |
| `npm run sync:contributions` | `node scripts/sync-contributions.mjs` | Refreshes the contributions snapshot committed in the repo |

The dependencies are minimal: `gray-matter`, `jsdom`, `lucide-static`, `marked` and `simple-icons` in development, and `dompurify` as the only runtime dependency.

## Full checks

```sh
npm ci
npm run build
npm test
python3 scripts/preview_server.py
```

### What the tests check

There are two files and they cover different things.

**`tests/site.test.mjs`** loads the **already generated** `index.html` into `jsdom`, injects `main.js` and `i18n.js`, and starts from the saved data in `assets/data/github.json`. It is **twenty-six named tests**, two of them parameterized inside a loop — the loader-states one runs for success, repo failure and readme failure, and the contact-copy one for success and for failure — so each pass **executes twenty-nine**. What they cover groups like this:

| Block | What it verifies |
| --- | --- |
| Real data | That the profile and the public repositories are rendered, and that they **survive the language switch** |
| Network failures | That when the API fails the saved data is used **with its date**, without claiming to be live or that Discord is offline |
| Hero | That it uses recent owned repositories, **excludes forks and archives**, and that while GitHub loads it shows prepared phrases with no repo link |
| README | GFM, safe HTML, Unicode, relative paths and anchors; that the project detail uses the official `/readme` endpoint and decodes UTF-8 |
| Calendar | That choosing a day lists safe commit and issue links, that the cache is reused, that zero-contribution days do not trigger searches, and that **an old response cannot overwrite a newer one** or reopen a closed panel |
| Official snapshot | That the calendar and the daily summary can use a dated official snapshot when external services fail |
| Build integrity | That every generated page links the current CSS and JS hashes, and that the stylesheet parses as one design system with no duplicate base selector blocks and no hidden reveal content |
| Icons | That they resolve to a local SVG sprite, that brand icons are published Simple Icons paths and interface symbols come from Lucide, and that loaders show **no fake progress percentage** |
| Internationalization | That the globe alternates the flag state with an accessible destination label and persists the choice, that README accessibility labels follow the chosen language **without changing the source document**, and that all generated page labels and metadata have both Spanish and English translations |
| Security | That a page's localized payload **cannot close its own JSON `<script>` element** |
| Home page | That badges and public activity are removed, that Pineapple is mentioned **exactly once** and that verified socials are included |
| SEO | That the metadata and the sitemap identify Jaime Gaming and the public site |
| Contact | That the page has real contact links **without JavaScript**, one h1, a canonical URL and a sitemap entry; and that the clipboard copy reports success or failure **without claiming what did not happen**, localizing mail subjects |
| Content | That the blog translates the complete article, dates, image descriptions and SEO without duplicate posts, and that the Wave launch post links the verified release while preserving platform limitations |

**`tests/preview.test.mjs`** does something else: it **starts the server for real**. It launches `scripts/preview_server.py` with `PORT=0`, discovers the assigned port by reading its output, and checks over real requests that the home page serves `cache-control: no-store`, that the versioned CSS answers as `text/css`, that project routes work and that 404s come out styled.

> [!NOTE]
> This documentation uses the same pattern and takes it one step further: it also loads the generated pages into `jsdom` with their own scripts, and it has an equivalent test over its own preview server.

The `checks.yml` workflow runs the build and the tests on working branches and on pull requests.

## What the build generates

| Output | Where it comes from |
| --- | --- |
| `index.html` | `content/home.fragment.html` with `{{CONTACT}}` replaced by `content/contact.fragment.html` |
| `projects/index.html` | `content/projects.fragment.html` |
| `contact/index.html` | `content/contact.fragment.html`, with the `h2` promoted to `h1` |
| `404.html` | `content/404.fragment.html` |
| `blog/<slug>/index.html` | `content/blog/<slug>.md` and `<slug>.en.md` |
| `assets/img/icons.svg` | Sprite generated from lucide-static and simple-icons |
| `assets/vendor/*` | marked, DOMPurify and their licenses, copied from `node_modules` |
| `sitemap.xml` | Pages and blog entries |

### Asset versioning

`layout.mjs` computes a SHA-256 hash of each resource and appends it as `?v=`:

```js
function assetUrl(path) {
  const content = readFileSync(new URL(`..${path}`, import.meta.url));
  const version = createHash("sha256").update(content).digest("hex").slice(0, 12);
  return `${path}?v=${version}`;
}
```

That way the browser caches aggressively and still invalidates as soon as the file changes. There is no need to purge caches by hand when deploying.

## Dependencies

```json
"devDependencies": {
  "gray-matter": "^4.0.3",
  "jsdom": "^30.1.3",
  "lucide-static": "^1.59.0",
  "marked": "^12.0.2",
  "simple-icons": "^16.35.0"
},
"dependencies": {
  "dompurify": "^3.4.17"
}
```

| Package | What it is for |
| --- | --- |
| `gray-matter` | Blog post front matter |
| `marked` | Markdown → HTML at build time and in the browser |
| `dompurify` | Sanitising READMEs in the browser |
| `lucide-static` | Interface icons |
| `simple-icons` | Brand icons (GitHub, Discord, YouTube, X) |
| `jsdom` | Tests without a browser |

## Publishing

The repository has GitHub Pages enabled on the `main` branch. Every push to `main` publishes. The `.github/workflows/build.yml` workflow covers deployment.

## Browser check

Besides `npm test`, the home page and the contact page were reviewed in Chromium at **1440 and 390 pixels**, with no horizontal overflow and no JavaScript errors.

> [!NOTE]
> The browser check used **controlled GitHub responses**: it does not verify the availability of external services (the GitHub API, Lanyard or the contribution calendar).

## Search engine verification

The home page includes a specific title and description, a canonical URL, Open Graph and Twitter metadata, and `Person` structured data with the confirmed GitHub, YouTube and X links. `robots.txt` allows crawling and links `sitemap.xml`, which is regenerated with the pages and blog entries.

After publishing, `https://jaime-gaming.github.io/` can be verified in Google Search Console, the sitemap submitted and indexing of the home page requested.

> [!IMPORTANT]
> Verification requires owner access. **Indexing and the position for "Jaime Gaming" depend on Google: they are neither immediate nor guaranteed.**
