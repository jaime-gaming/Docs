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

## Full checks

```sh
npm ci
npm run build
npm test
python3 scripts/preview_server.py
```

The tests check the profile, the repositories, the language switch and the recovery with saved data when the API does not respond. They use `jsdom`, so no browser is needed.

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
