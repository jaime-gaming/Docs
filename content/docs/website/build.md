---
description: "Generar la web, servirla en local con el mismo comportamiento que GitHub Pages y ejecutar las comprobaciones."
updated: "2026-10-18"
---

## Build y preview local

```bash
npm install
npm run build
python3 scripts/preview_server.py
```

El servidor local enlaza `0.0.0.0:8000` y sirve `404.html` como respaldo para las rutas dinámicas `/projects/<propietario>/<repositorio>/`, **igual que GitHub Pages**.

El build regenera `index.html`, `projects/index.html`, `404.html` y las páginas del blog. Los cambios en `assets/` se sirven directamente, sin recompilar.

## Los tres scripts

`package.json` declara exactamente tres, y cada uno hace una cosa distinta:

| Script | Comando | Para qué |
| --- | --- | --- |
| `npm run build` | `node scripts/build.mjs` | Genera las páginas, el sprite de iconos, el `sitemap.xml` y copia los vendor |
| `npm test` | `node --test` | Ejecuta la suite con el runner nativo de Node, sin framework |
| `npm run sync:contributions` | `node scripts/sync-contributions.mjs` | Refresca la instantánea de contribuciones commiteada en el repo |

Las dependencias son mínimas: `gray-matter`, `jsdom`, `lucide-static`, `marked` y `simple-icons` en desarrollo, y `dompurify` como única dependencia de runtime.

## Comprobaciones completas

```sh
npm ci
npm run build
npm test
python3 scripts/preview_server.py
```

### Qué comprueban las pruebas

Son dos archivos y cubren cosas distintas.

**`tests/site.test.mjs`** carga el `index.html` **ya generado** en `jsdom`, le inyecta `main.js` e `i18n.js` y parte de los datos guardados en `assets/data/github.json`. Son veinticuatro pruebas con nombre, y lo que cubren se agrupa así:

| Bloque | Qué verifica |
| --- | --- |
| Datos reales | Que se pintan el perfil y los repositorios públicos, y que **sobreviven al cambio de idioma** |
| Fallos de red | Que si la API falla se usan los datos guardados **con su fecha**, sin fingir que están en vivo ni que Discord está desconectado |
| Hero | Que usa repositorios propios recientes, **excluye forks y archivados**, y que mientras GitHub carga enseña frases preparadas sin enlace |
| README | GFM, HTML seguro, Unicode, rutas relativas y anclas; que el detalle de proyecto usa el endpoint oficial `/readme` y decodifica UTF-8 |
| Calendario | Que al elegir un día se listan commits e issues con enlaces seguros, que se reutiliza la caché, que los días sin contribuciones no disparan búsquedas, y que **una respuesta vieja no puede sobrescribir una más nueva** ni reabrir un panel cerrado |
| Instantánea oficial | Que el calendario y el resumen diario pueden usar una instantánea oficial con fecha cuando fallan los servicios externos |
| Integridad del build | Que cada página generada enlaza los hashes de CSS y JS actuales, y que la hoja de estilos se parsea como un único sistema de diseño sin bloques base duplicados ni contenido de revelado oculto |
| Iconos | Que resuelven a un sprite SVG local, que los de marca son rutas publicadas de Simple Icons y los de interfaz vienen de Lucide, y que los cargadores **no enseñan porcentajes de progreso falsos** |
| Internacionalización | Que el globo alterna el estado de la bandera con una etiqueta de destino accesible y persiste la elección, que las etiquetas de accesibilidad del README siguen el idioma **sin modificar el documento original**, y que todas las etiquetas y metadatos generados tienen traducción en los dos idiomas |
| Seguridad | Que el payload localizado de una página **no puede cerrar su propio elemento `<script>` de JSON** |
| Contenido | Que el blog traduce el artículo completo, las fechas, las descripciones de imagen y el SEO sin duplicar posts, y que el post de lanzamiento de Wave enlaza la release verificada conservando las limitaciones de plataforma |

**`tests/preview.test.mjs`** hace otra cosa: **arranca el servidor de verdad**. Lanza `scripts/preview_server.py` con `PORT=0`, descubre el puerto asignado leyendo su salida y comprueba sobre peticiones reales que la portada sirve `cache-control: no-store`, que el CSS versionado responde como `text/css`, que las rutas de proyecto funcionan y que los 404 salen con estilo.

> [!NOTE]
> Esta documentación usa el mismo patrón y lo lleva un paso más allá: también carga las páginas generadas en `jsdom` con sus propios scripts, y tiene una prueba equivalente sobre su propio servidor de preview.

El workflow `checks.yml` ejecuta build y pruebas en las ramas de trabajo y en las pull requests.

## Qué genera el build

| Salida | De dónde viene |
| --- | --- |
| `index.html` | `content/home.fragment.html` con `{{CONTACT}}` sustituido por `content/contact.fragment.html` |
| `projects/index.html` | `content/projects.fragment.html` |
| `contact/index.html` | `content/contact.fragment.html`, con el `h2` promocionado a `h1` |
| `404.html` | `content/404.fragment.html` |
| `blog/<slug>/index.html` | `content/blog/<slug>.md` y `<slug>.en.md` |
| `assets/img/icons.svg` | Sprite generado desde lucide-static y simple-icons |
| `assets/vendor/*` | marked, DOMPurify y sus licencias, copiados desde `node_modules` |
| `sitemap.xml` | Páginas y entradas del blog |

### Versionado de assets

`layout.mjs` calcula un hash SHA-256 de cada recurso y lo añade como `?v=`:

```js
function assetUrl(path) {
  const content = readFileSync(new URL(`..${path}`, import.meta.url));
  const version = createHash("sha256").update(content).digest("hex").slice(0, 12);
  return `${path}?v=${version}`;
}
```

Así el navegador cachea de forma agresiva y aun así invalida en cuanto el archivo cambia. No hace falta purgar cachés a mano al desplegar.

## Dependencias

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

| Paquete | Para qué |
| --- | --- |
| `gray-matter` | Front matter de los posts del blog |
| `marked` | Markdown → HTML en el build y en el navegador |
| `dompurify` | Saneado de los README en el navegador |
| `lucide-static` | Iconos de interfaz |
| `simple-icons` | Iconos de marca (GitHub, Discord, YouTube, X) |
| `jsdom` | Pruebas sin navegador |

## Publicación

El repositorio tiene GitHub Pages activado sobre la rama `main`. Cada push a `main` publica. El workflow `.github/workflows/build.yml` cubre el despliegue.

## Comprobación en navegador

Además de `npm test`, la portada y el contacto se revisaron en Chromium a **1440 y 390 píxeles**, sin desbordamientos horizontales ni errores de JavaScript.

> [!NOTE]
> La comprobación de navegador utilizó **respuestas controladas de GitHub**: no verifica la disponibilidad de los servicios externos (la API de GitHub, Lanyard ni el calendario de contribuciones).

## Verificación en buscadores

La portada incluye título y descripción específicos, URL canónica, metadatos Open Graph y Twitter, y datos estructurados `Person` con los enlaces confirmados de GitHub, YouTube y X. `robots.txt` permite el rastreo y enlaza `sitemap.xml`, que se regenera con las páginas y las entradas del blog.

Después de publicar se puede verificar `https://jaime-gaming.github.io/` en Google Search Console, enviar el sitemap y solicitar la indexación de la portada.

> [!IMPORTANT]
> La verificación requiere acceso del propietario. **La indexación y la posición para «Jaime Gaming» dependen de Google: no son inmediatas ni se pueden garantizar.**
