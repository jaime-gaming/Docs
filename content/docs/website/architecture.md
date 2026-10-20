---
title: "Arquitectura del sitio"
icon: "boxes"
order: 50
blurb: "datos de GitHub, calendario, Lanyard, READMEs y SEO."
description: "Cómo obtiene la web sus datos: la API de GitHub, el calendario de contribuciones, Lanyard, los README y el SEO."
updated: "2026-10-18"
---

## Proyectos

La lista consulta únicamente la **API pública de GitHub** para el usuario `jaime-gaming`. Cada repositorio enlaza a `/projects/<propietario>/<repositorio>/`.

GitHub Pages sirve `404.html` para esa ruta y `main.js` carga los datos y el README en el navegador, **por lo que las páginas no necesitan generarse una a una**. Es el truco que sostiene todo el sitio: una sola página de error actúa como enrutador dinámico del lado del cliente.

```text
/projects/jaime-gaming/wave/
        │
        └──► GitHub Pages no encuentra el archivo
                     │
                     └──► sirve 404.html  ──► main.js lee la ruta
                                                      │
                                                      └──► consulta GitHub y pinta el detalle
```

### Límites de tasa y caché

Las consultas a GitHub son **anónimas** y comparten el límite público de solicitudes por IP. El sitio conserva una copia local reciente para mostrarla si la API no responde.

| Constante | Valor | Para qué |
| --- | --- | --- |
| `GH_CACHE_FRESH_MS` | 5 minutos | Cuándo se considera fresca la caché |
| `GH_REFRESH_INTERVAL` | 10 minutos | Cada cuánto se vuelve a consultar |
| `GH_MAX_STALE_MS` | 7 días | Cuándo la caché deja de ser utilizable |

### Repositorios excluidos

```js
const EXCLUDED_REPOS = new Set([
  "jaime-gaming/jaime-gaming",
  "jaime-gaming/jaime-gaming.github.io",
  "pineappleva/.github",
]);
```

El README del perfil y el propio sitio no aparecen como proyectos. Los repositorios de organizaciones no se muestran.

### Datos de respaldo

Si la API falla y no hay caché del navegador, se usa `assets/data/github.json`: **una captura real con su fecha de consulta**. La interfaz la identifica como datos guardados, **no como datos en vivo**. Este archivo no contiene credenciales.

> [!IMPORTANT]
> El calendario depende de un servicio externo y Discord depende de Lanyard. **Un error de conexión no se presenta como estado desconectado del usuario**: son cosas distintas y la interfaz las distingue.

## Calendario de contribuciones

Usa la API pública `github-contributions-api` de Jogruber. Sus respuestas se guardan en la caché del navegador.

| Constante | Valor |
| --- | --- |
| `CONTRIBUTION_CACHE_TTL` | 1 hora |
| `CONTRIBUTION_MAX_STALE` | 7 días |

El calendario es navegable con teclado y seleccionable con toque. Al elegir un día se consultan los commits, issues y pull requests públicos de esa fecha.

### La instantánea commiteada

Además de la fuente en vivo hay una **instantánea oficial con fecha** en `assets/data/contributions.json`, que se refresca con `npm run sync:contributions`.

El script (`scripts/sync-contributions.mjs`) lanza `execFile` contra la API GraphQL de GitHub y pide el `contributionsCollection` del usuario:

| Campo de la consulta | Qué trae |
| --- | --- |
| `contributionCalendar` | `totalContributions` y las semanas, con `date`, `contributionCount` y `contributionLevel` por día |
| `commitContributionsByRepository(maxRepositories: 100)` | Por repositorio: `nameWithOwner`, `url`, `isPrivate` y propietario, con `occurredAt` y `commitCount` de cada contribución |
| `issueContributions(first: 100)` | Título, URL, número y repositorio de cada issue |
| `pullRequestContributions(first: 100)` | Lo mismo para las pull requests |

Las cuatro partes devuelven `pageInfo.hasNextPage`, así que el script sabe si se ha quedado corto.

> [!IMPORTANT]
> Ese JSON existe para que **el calendario y el resumen diario sigan funcionando cuando fallan los servicios externos**. Es una copia con fecha commiteada en el repositorio, no una caché del navegador: las dos cosas conviven y tienen papeles distintos.

Los cinco niveles de intensidad usan una rampa de verdes coherente con la paleta:

```css
.calendar__day { background: #263024; }                    /* nivel 0 */
.calendar__day[data-level="1"] { background: #415d31; }
.calendar__day[data-level="2"] { background: #638440; }
.calendar__day[data-level="3"] { background: #91b854; }
.calendar__day[data-level="4"] { background: var(--accent); }  /* #c8eb85 */
```

## Presencia de Discord

El estado y la actividad se obtienen mediante **Lanyard** a partir del identificador de usuario. La tarjeta de perfil refleja los estados estándar:

| Estado | Color |
| --- | --- |
| En línea | `#90d79e` |
| Ausente | `#e0c778` |
| No molestar | `#df8d8d` |
| Desconocido | `var(--text-faint)` |

## Cabecera dinámica

La cabecera alterna frases preparadas mientras se consulta GitHub. Cuando llegan los datos, usa los **tres repositorios personales más recientes**, excluyendo forks, repos archivados o deshabilitados. El enlace de cada frase apunta al proyecto correspondiente.

> [!NOTE]
> «Repos recientes» describe la fuente; **no significa que Jaime esté programando en ese momento**. El texto deja de escribirse carácter a carácter con movimiento reducido y **pausa el efecto cuando la pestaña está oculta**.

## README de los proyectos

Los README se obtienen del endpoint oficial `/readme` de GitHub —**no se presupone nombre, mayúsculas ni extensión**—, se procesan con Marked y se sanean con DOMPurify.

Las bibliotecas se copian al directorio `assets/vendor/` durante el build y **sus licencias se conservan allí**. El renderizador soporta tablas, código, HTML seguro, listas e imágenes con rutas relativas.

Cuando una imagen del README no carga, se muestra un marcador `.readme-image-fallback` en vez de un icono roto.

### Cómo reescribe las rutas

El renderizador vive en `assets/js/readme.js` y expone una única función global, `window.renderProjectMarkdown(markdown, repo)`. A partir del repositorio construye dos bases y reescribe las rutas relativas del README contra ellas:

```text
rawBase  = https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{dir}
linkBase = https://github.com/{owner}/{repo}/blob/{branch}/{dir}
```

`{dir}` es el directorio del README dentro del repositorio, y **cada segmento se codifica por separado** con `encodeURIComponent` uniendo después con `/`, para no romper las rutas que contienen espacios o caracteres raros. Las imágenes se resuelven contra `rawBase` y los enlaces contra `linkBase`.

### Las casillas de las listas de tareas

Marked se configura con un renderizador propio para `checkbox`. Las listas de tareas GFM no se convierten en `<input>` —que el saneador prohibiría— sino en un span accesible:

```html
<span class="readme-checkbox" role="img" aria-label="Completado">☑</span>
```

El `aria-label` sale del diccionario del idioma activo y el span lleva `data-i18n-aria`, así que **la etiqueta sigue el idioma elegido sin modificar el documento original del README**.

### La política de saneado

DOMPurify se ejecuta con un perfil HTML y dos listas de prohibiciones explícitas:

| Opción | Valor |
| --- | --- |
| `USE_PROFILES` | `{ html: true }` |
| `FORBID_TAGS` | `form`, `input`, `button`, `style`, `iframe`, `video`, `audio` |
| `FORBID_ATTR` | `style` |

La consecuencia práctica: un README de terceros no puede colar formularios, controles interactivos, estilos en línea ni contenido empotrado en la web.

## Datos del perfil

La presentación sigue el README público de `jaime-gaming/jaime-gaming`: HTML, aprendizaje de JavaScript, TypeScript y Python, juegos compartidos con compañeros y fundador de Pineapple.

> [!IMPORTANT]
> **No se asignan porcentajes de dominio.** Las barras de progreso de algunas webs de este tipo inventan una precisión que no existe; aquí se describe qué se usa y en qué contexto, sin cifras.

La biografía, ubicación, repositorios públicos y seguidores se consultan en la API REST de GitHub junto con los proyectos. **No se consultan ni se muestran eventos de actividad pública.**

## Buscadores

La portada incluye:

- Título y descripción específicos.
- URL canónica.
- Metadatos Open Graph y Twitter.
- Datos estructurados `Person` con los enlaces confirmados de GitHub, YouTube y X.

`robots.txt` permite el rastreo y enlaza `sitemap.xml`, que se regenera con las páginas y las entradas del blog.

Los datos estructurados se actualizan también al cambiar de idioma: `inLanguage` y la descripción se reescriben en el nodo `#personStructuredData`.

## Iconos

El sprite se genera en el build desde dos fuentes:

```js
const uiIcons = {
  code: "code-xml", music: "music", mail: "mail", star: "star",
  fork: "git-fork", commit: "git-commit-horizontal", globe: "globe", /* … */
};
const brands = { github: siGithub, discord: siDiscord, youtube: siYoutube, x: siX };
```

Los iconos de interfaz vienen de **lucide-static** y se extrae solo el contenido del `<svg>`, envolviéndolo en un `<symbol>`. Los de marca vienen de **simple-icons** y se inyectan como `<path fill="currentColor" stroke="none">`.

Cada icono se usa con `<use href="/assets/img/icons.svg?v=<hash>#icon-nombre">`, así que un solo archivo sirve para todo el sitio y el navegador lo cachea una vez. `renderIcon()` lanza un error en el build si se pide un icono desconocido, en vez de pintar un hueco.
