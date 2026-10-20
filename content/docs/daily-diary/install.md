---
title: "Instalación y uso"
icon: "download"
order: 20
blurb: "ejecutarlo en local, desplegarlo y el modelo de guardado."
description: "Ejecutar Diario en local, desplegarlo en GitHub Pages o en Render y entender su modelo de guardado."
updated: "2026-10-18"
---

## Cómo usarlo

```bash
npm install
npm run dev      # http://localhost:5173
```

Para la versión definitiva, con soporte offline mediante service worker:

```bash
npm run build
npm run preview
```

También puedes servir la carpeta `docs/` (el build de producción) con cualquier servidor estático.

## El modelo de guardado

Es la parte más importante de entender antes de usarlo, porque va en contra de lo que hace casi todo el software actual.

> [!IMPORTANT]
> **Un día solo entra en el cuaderno cuando pulsas «Guardar día».** No hay autoguardado de entradas.

Mientras tanto, nada se pierde:

| Qué | Dónde vive | Para qué |
| --- | --- | --- |
| Lo que escribes | `diario.drafts.v1` | Cada tecla queda en un borrador local |
| Lo que marcas en Rutina o en el mar | `diario.pendiente-dia.v1` | Los cambios pendientes del día |
| Los días guardados | `diario.entries.v1` | El cuaderno |

Al cerrar la pestaña no se pierde nada y, al volver, todo sigue donde lo dejaste. Junto al botón se ve el estado del día: **«Guardado a las 21:34»** o **«Cambios sin guardar»**. Los días a medias pueden terminarse o descartarse desde *Ajustes → Datos*.

Un borrador solo se recupera si es **más reciente** que lo ya guardado, así que nunca te devuelve texto viejo ni duplica nada.

El parche de cambios pendientes se funde con la entrada guardada para pintar el día completo, y se escribe en el cuaderno al pulsar «Guardar día». **Un valor vacío también es un cambio**: borrar un texto, poner un contador a cero o desmarcar un hábito se guardan igual que cualquier otra cosa.

## Desplegar en GitHub Pages

Este repositorio está configurado para **GitHub Pages por rama**, sin usar GitHub Actions.

- El build de producción se genera en `docs/` (`vite.config.js` → `outDir: 'docs'`).
- `docs/` incluye `.nojekyll` para que GitHub Pages sirva los assets tal cual, y publica un `index.html` por cada ruta para admitir enlaces directos en hosting estático.
- `base: './'` en Vite y los enlaces relativos permiten que funcione tanto en `usuario.github.io/daily-diary/` como en dominio propio.

**Pasos para activar Pages:**

```bash
npm run build   # crea o actualiza docs/
git add docs
git commit -m "build: actualizar docs para Pages"
git push origin main
```

Después, en GitHub → **Settings → Pages**:

- **Source**: `Deploy from a branch`
- **Branch**: `main` / **Folder**: `/docs`
- Guarda.

Cada `git push` a `main` con `docs/` actualizado publica automáticamente. No hay workflow de Actions. La URL resultante es `https://<usuario>.github.io/daily-diary/`.

## Desplegar en Render

El repositorio incluye un `render.yaml` listo para usar.

**Opción A — Blueprint (recomendada, un clic)**

1. Sube el repositorio a GitHub.
2. En [render.com](https://render.com) → **New** → **Blueprint**, y selecciona el repositorio.
3. Render lee `render.yaml`, crea el *Static Site* y despliega solo. Cada `git push` a `main` redespliega automáticamente.

**Opción B — Manual**

1. En Render → **New** → **Static Site**.
2. Conecta el repositorio.
3. *Build Command*: `npm ci && npm run build`
4. *Publish Directory*: `docs`
5. En **Redirects/Rewrites** añade `/* → /index.html` (rewrite). El `render.yaml` ya lo incluye si usas Blueprint.

Notas del despliegue:

- Es un sitio **100 % estático**: no hay servidor que mantener ni variables de secreto.
- La app funciona **sin conexión** tras la primera carga (service worker). El HTML se actualiza en cada recarga y los assets llevan hash, así que cada despliegue se ve al instante.
- El diario sigue estando **solo en el navegador de cada visitante**: alojarlo en Render no implica que las entradas se envíen a ningún servidor. Nunca salen del dispositivo.
- Dominio por defecto: `https://<nombre>.onrender.com`. Se puede añadir un dominio propio desde el panel de Render; el plan gratuito incluye HTTPS.

## Rutas

El build genera una página estática por cada ruta, así que los enlaces directos funcionan en hosting estático y los botones Atrás y Adelante del navegador también.

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

## Pruebas

```bash
npm test
```

La suite cubre las **funciones puras** (fechas, estadísticas, mareas, validación de almacenamiento) y el **pintado** de las vistas.
