---
description: "Running Diario locally, deploying it to GitHub Pages or Render and understanding its saving model."
updated: "2026-10-18"
---

## Using it

```bash
npm install
npm run dev      # http://localhost:5173
```

For the definitive version, with offline support through a service worker:

```bash
npm run build
npm run preview
```

You can also serve the `docs/` folder (the production build) with any static server.

## The saving model

This is the most important thing to understand before using it, because it goes against what almost all current software does.

> [!IMPORTANT]
> **A day only enters the notebook when you press «Save day».** There is no autosaving of entries.

In the meantime nothing is lost:

| What | Where it lives | What it is for |
| --- | --- | --- |
| What you write | `diario.drafts.v1` | Every keystroke goes into a local draft |
| What you tick in Routine or in the sea | `diario.pendiente-dia.v1` | The day's pending changes |
| Saved days | `diario.entries.v1` | The notebook |

Closing the tab loses nothing and, when you come back, everything is where you left it. Next to the button you can see the day's status: **«Saved at 21:34»** or **«Unsaved changes»**. Half-finished days can be completed or discarded from *Settings → Data*.

A draft is only recovered if it is **more recent** than what is already saved, so it never hands you old text or duplicates anything.

The pending-changes patch is merged with the saved entry to render the full day, and it is written to the notebook when you press «Save day». **An empty value is also a change**: deleting a text, setting a counter to zero or unticking a habit is saved just like anything else.

## Deploying to GitHub Pages

This repository is configured for **GitHub Pages by branch**, without GitHub Actions.

- The production build is generated in `docs/` (`vite.config.js` → `outDir: 'docs'`).
- `docs/` includes `.nojekyll` so GitHub Pages serves the assets as they are, and publishes an `index.html` per route so deep links work on static hosting.
- `base: './'` in Vite and the relative links let it work both at `user.github.io/daily-diary/` and on a custom domain.

**Steps to enable Pages:**

```bash
npm run build   # creates or updates docs/
git add docs
git commit -m "build: update docs for Pages"
git push origin main
```

Then, on GitHub → **Settings → Pages**:

- **Source**: `Deploy from a branch`
- **Branch**: `main` / **Folder**: `/docs`
- Save.

Every `git push` to `main` with an updated `docs/` publishes automatically. There is no Actions workflow. The resulting URL is `https://<user>.github.io/daily-diary/`.

## Deploying to Render

The repository includes a ready-to-use `render.yaml`.

**Option A — Blueprint (recommended, one click)**

1. Push the repository to GitHub.
2. On [render.com](https://render.com) → **New** → **Blueprint**, and select the repository.
3. Render reads `render.yaml`, creates the *Static Site* and deploys it by itself. Every `git push` to `main` redeploys automatically.

**Option B — Manual**

1. On Render → **New** → **Static Site**.
2. Connect the repository.
3. *Build Command*: `npm ci && npm run build`
4. *Publish Directory*: `docs`
5. Under **Redirects/Rewrites** add `/* → /index.html` (rewrite). The `render.yaml` already includes it if you use Blueprint.

Deployment notes:

- It is a **100% static** site: there is no server to maintain and no secret variables.
- The app works **offline** after the first load (service worker). The HTML is refreshed on every reload and the assets are hashed, so each deploy is visible instantly.
- The diary is still **only in each visitor's browser**: hosting it on Render does not mean entries are sent to any server. They never leave the device.
- Default domain: `https://<name>.onrender.com`. You can add a custom domain from the Render panel; the free plan includes HTTPS.

## Routes

The build generates a static page per route, so deep links work on static hosting and the browser's Back and Forward buttons work too.

```text
/pensamientos            /pensamientos/pendientes
                         /pensamientos/guardados
                         /pensamientos/archivados
/rutina                  /rutina/semana
                         /rutina/contadores
                         /rutina/rachas
/archivo                 /archivo/calendario
/progreso                /progreso/semana
                         /progreso/mes
/ajustes                 /ajustes/apariencia
                         /ajustes/contenido
                         /ajustes/datos
```

## Tests

```bash
npm test
```

The suite covers the **pure functions** (dates, statistics, tides, storage validation) and the **rendering** of the views.
