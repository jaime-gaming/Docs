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

## Comprobaciones completas

```sh
npm ci
npm run build
npm test
python3 scripts/preview_server.py
```

Las pruebas comprueban el perfil, los repositorios, el cambio de idioma y la recuperación con datos guardados cuando la API no responde. Usan `jsdom`, así que no hace falta navegador.

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
