# Docs — Centro de documentación de Jaime Gaming

Toda la documentación de mis proyectos personales en un solo sitio, con la misma
estética de [jaime-gaming.github.io](https://jaime-gaming.github.io/): paleta
verde sobre fondo oscuro, Space Grotesk / DM Sans / IBM Plex Mono, revelado al
hacer scroll y conmutador de idioma ES ↔ EN.

**Publicado en:** <https://jaime-gaming.github.io/Docs/>

| | |
| --- | --- |
| Guías | 44 (88 páginas: cada una en español e inglés) |
| Proyectos | Wave · jAIgent · hellbot · RNGdle Infinite · Diario · VOID · jaime-gaming.github.io |
| Stack | Node + generador estático propio. Sin framework de documentación. |
| Salida | HTML estático, CSS propio y un índice de búsqueda en JSON |

## Empezar

```bash
npm install
npm run dev        # genera el sitio y lo sirve en http://localhost:8000/Docs/
```

Otros comandos:

```bash
npm run build      # genera las páginas, el sprite de iconos, el sitemap, robots.txt y el índice de búsqueda
npm test           # la suite completa con node --test (registro, contenido, Markdown, i18n, navegador, staging y build)
npm run stage      # build + copia lo que se sirve a _site/ (el payload de GitHub Pages)
npm run preview    # sirve lo ya generado, sin recompilar
```

El servidor de preview (`scripts/preview_server.py`) enlaza `0.0.0.0:8000`, sirve
bajo el prefijo `/Docs` igual que Pages y usa `404.html` como respaldo de las
rutas dinámicas.

## Cómo está hecho

Generador estático propio, en la línea de la web principal: Node lee el Markdown,
`marked` lo convierte en HTML y `gray-matter` el front matter. No hay VitePress
ni Docusaurus, y no hay dependencias en tiempo de ejecución en el navegador.

```text
scripts/
  config.mjs        BASE, URLs, idiomas y datos de contacto
  registry.mjs      los 7 proyectos, sus páginas y sus grupos (la única fuente de verdad)
  markdown.mjs      Markdown -> HTML: avisos, tablas, slugs, reescritura de enlaces
  icons.mjs         sprite SVG generado desde lucide-static y simple-icons
  dict.mjs          diccionario ES/EN completo (textos fijos + derivados del registro)
  layout.mjs        plantilla HTML compartida
  build.mjs         orquesta todo y escribe las páginas
  stage_site.mjs    prepara _site/ para GitHub Pages
  preview_server.py servidor local con el mismo comportamiento que Pages
content/
  ui.mjs            textos de interfaz en los dos idiomas
  docs/<proyecto>/<pagina>.md       versión en español
  docs/<proyecto>/<pagina>.en.md    versión en inglés
assets/
  css/style.css     base heredada de la web principal + capa de documentación
  js/               i18n.js (conmutador), main.js (interfaz), search.js (Ctrl+K)
tests/              node --test
```

Las páginas generadas (`index.html`, los siete directorios de proyecto,
`projects/`, `sitemap.xml`, el sprite y el índice de búsqueda) **no se versionan**:
están en `.gitignore` y las produce cada build.

## Añadir una página

1. Añade la entrada en `scripts/registry.mjs` (slug, icono y título en los dos idiomas).
2. Crea `content/docs/<proyecto>/<pagina>.md` y su gemelo `.en.md`.
3. `npm run build` — el sitio la enlaza en el sidebar, la añade al índice de
   búsqueda y al sitemap.

El build **falla** si falta una de las dos versiones o si sus fechas `updated`
no coinciden: es deliberado, para que ningún idioma se quede atrás.

## Convenciones de autoría

| Convención | Qué hace |
| --- | --- |
| `[enlace](/wave/install/)` | Ruta interna: el build le añade `BASE` |
| `[mi web](~/projects/)` | Enlace a la web principal, fuera de `/Docs/` |
| `> [!NOTE]` `[!TIP]` `[!WARNING]` `[!IMPORTANT]` `[!DANGER]` | Bloque destacable con título traducido |
| `##` y `###` | Alimentan el índice lateral y el índice de búsqueda |
| Front matter `description` + `updated` | Obligatorios en las dos versiones |

Los enlaces externos abren en pestaña nueva salvo los de
`jaime-gaming.github.io`. El contenido no lleva imágenes: los visuales son SVG y
CSS en línea, así el sitio no depende de recursos de otros repositorios.

## Despliegue

GitHub Pages desde este repositorio, sirviendo la rama `gh-pages`, con el
workflow `.github/workflows/build.yml`:

- En cada pull request y push: `npm ci` → `npm run build` → `npm test` → comprobación del payload.
- En `main`: además genera `_site/` y lo publica en la rama `gh-pages` con git, sin acciones de terceros.

Hay que activar una vez **Settings → Pages → Build and deployment → Source:
Deploy from a branch** y elegir la rama `gh-pages` con la carpeta `/ (root)`.

El payload lleva un `.nojekyll` vacío a propósito. Pages procesa con Jekyll lo
que sirve desde una rama, y Jekyll lee `{{…}}` como Liquid:
`website/build/index.html` documenta la sustitución `{{CONTACT}}` de la web
principal dentro de un `<code>`, y sin ese fichero aparecería vacía sin dar
ningún error.

`BASE` sale de `DOCS_BASE` (por defecto `/Docs/`), así que el mismo código sirve
en un dominio propio cambiando esa variable de entorno.

## Licencia

ISC, igual que la web principal. Los nombres y marcas de los proyectos
documentados pertenecen a sus respectivos autores; la documentación está escrita
a mano a partir de los README y docs de cada repositorio.
