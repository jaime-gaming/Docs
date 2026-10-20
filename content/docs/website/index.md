---
title: "Visión general"
icon: "compass"
order: 10
description: "Qué es jaime-gaming.github.io, qué incluye y cómo se relaciona con este centro de documentación."
updated: "2026-10-19"
---

**jaime-gaming.github.io** es el sitio personal de Jaime Gaming, publicado en [jaime-gaming.github.io](https://jaime-gaming.github.io/). Es también el sitio del que **esta documentación hereda toda la estética**: paleta, tipografías, animaciones y estructura de componentes.

## Qué incluye

- **Diseño oscuro adaptable a móvil**, con perfil en directo, tarjetas visuales y animaciones; respeta la preferencia de movimiento reducido.
- **Interfaz en español e inglés.**
- **Lista de repositorios públicos** de la cuenta `jaime-gaming`, incluidos los forks. No se muestran repositorios de organizaciones. Los datos se actualizan cada diez minutos.
- **Página de detalle por repositorio**, con enlaces al proyecto y lectura de su README cuando está disponible.
- **Calendario de contribuciones diario**, navegable con teclado y seleccionable con toque.
- **Estado y actividad de Discord** mediante Lanyard.
- **Blog generado desde Markdown.** El build también elimina las páginas de posts que ya no tienen fuente.

## Estructura

```text
content/                    # Fuentes editables
  home.fragment.html        # Secciones de inicio
  projects.fragment.html    # Listado de proyectos
  contact.fragment.html     # Contacto compartido entre inicio y /contact/
  404.fragment.html         # Página de error y detalle de proyectos
  blog/*.md                 # Posts en Markdown
scripts/
  layout.mjs                # Plantilla HTML compartida
  build.mjs                 # Genera páginas estáticas y limpia posts obsoletos
assets/css/style.css        # Estilos
assets/js/i18n.js           # Textos ES/EN
assets/js/main.js           # Sincronización, calendario y presencia
index.html, projects/, blog/, contact/   # Páginas generadas; no editar a mano
```

La regla importante: **`content/` y `scripts/` se editan; el resto se genera.** Las páginas `index.html`, `projects/`, `blog/` y `contact/` se sobrescriben en cada build.

## La paleta que hereda esta documentación

Todo el sistema de diseño vive en `assets/css/style.css`, en las variables de `:root`:

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

Las tres tipografías tienen un papel fijo:

| Tipografía | Para qué |
| --- | --- |
| **Space Grotesk** | Titulares y cifras destacadas (`--font-display`) |
| **DM Sans** | Cuerpo de texto (`--font`) |
| **IBM Plex Mono** | Microetiquetas, código y datos (`--font-mono`) |

## El sistema de movimiento

Todas las animaciones están dentro de `@media (prefers-reduced-motion: no-preference)` y hay un bloque `reduce` que las desactiva todas:

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

El revelado por scroll lo hace un `IntersectionObserver` con umbral 0.08, que añade `.in-view` una sola vez y deja de observar el elemento.

## Cómo se relaciona con esta documentación

Este sitio de documentación **no es un fork** de la web principal: es un proyecto aparte que copia deliberadamente su sistema de diseño.

| Aspecto | Web principal | Esta documentación |
| --- | --- | --- |
| Propósito | Portfolio y presencia | Documentación técnica |
| Contenido | Fragmentos HTML + posts | Markdown por proyecto e idioma |
| Datos | En vivo desde la API de GitHub y Lanyard | Estático, escrito a mano |
| Layout | Secciones apiladas a 1040 px | Tres columnas: sidebar, contenido, TOC |
| Paleta y animaciones | Las define | **Las hereda idénticas** |
| i18n | `data-i18n` + `#pageTranslations` | El mismo mecanismo |
| Publicación | Raíz de `jaime-gaming.github.io` | Subcarpeta `/Docs/` |

Compartir el conmutador de idioma tiene un efecto útil: ambos sitios guardan la preferencia en la **misma clave `lang` de `localStorage`**, y como comparten origen, cambiar de idioma en uno se aplica al otro.

## Licencia

El código del sitio se publica bajo licencia **ISC**, declarada en su `package.json`. El repositorio no incluye un fichero `LICENSE` propio: los únicos textos de licencia que trae son los de las librerías de terceros que se agrupan en `assets/vendor/` (Marked, DOMPurify, Lucide y Simple Icons), y esas conservan las suyas.

## Seguir leyendo en el repositorio

Esta guía resume y ordena. Esto es lo que hay en el repositorio, con sus tamaños reales, por si quieres ir a la fuente.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`assets/js/main.js`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/js/main.js) | 69 KB | La lógica de la portada: tarjetas, calendario de contribuciones, revelado al hacer scroll y el enrutado |
| [`assets/data/github.json`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/data/github.json) | 54 KB | La instantánea commiteada de los repositorios |
| [`assets/data/contributions.json`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/data/contributions.json) | 53 KB | La instantánea commiteada del calendario de contribuciones |
| [`tests/site.test.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/tests/site.test.mjs) | 37 KB | Las 29 pruebas del sitio (26 declaradas, dos de ellas parametrizadas en bucle) |
| [`assets/js/i18n.js`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/js/i18n.js) | 30 KB | El conmutador ES ↔ EN y las traducciones |
| [`assets/css/style.css`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/assets/css/style.css) | 28 KB | **La hoja de la que está clonada la estética de esta documentación** |
| [`index.html`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/index.html) | 24 KB | La portada |
| [`README.md`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/README.md) | 12 KB | La presentación y las decisiones del generador |
| [`content/home.fragment.html`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/content/home.fragment.html) | 12 KB | El fragmento de portada que el build inyecta |
| [`scripts/build.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/scripts/build.mjs) | 10 KB | El generador estático |
| [`scripts/layout.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/scripts/layout.mjs) | 7 KB | La plantilla común |
| [`content/blog/lanzamiento-wave.md`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/content/blog/lanzamiento-wave.md) | 6 KB | La entrada del blog sobre Wave |
| [`lanzamiento-wave.en.md`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/content/blog/lanzamiento-wave.en.md) | 5 KB | La misma entrada en inglés |
| [`404.html`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/404.html) | 6 KB | El respaldo del enrutado por cliente: sirve las páginas por repositorio |
| [`tests/preview.test.mjs`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/tests/preview.test.mjs) | 2 KB | Las pruebas del servidor de previsualización |
| [`package.json`](https://github.com/jaime-gaming/jaime-gaming.github.io/blob/main/package.json) | 700 B | Los tres scripts, incluido `sync:contributions` |

> [!NOTE]
> Las dos instantáneas de `assets/data/` están commiteadas a propósito: la portada se renderiza con lo que hay en el repositorio y no depende de que GitHub responda en ese momento. `npm run sync:contributions` las refresca.
