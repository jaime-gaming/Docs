/**
 * Prueba de extremo a extremo: ejecuta el build real y valida lo que genera.
 *
 * Es la prueba más lenta y la más valiosa: si esto pasa, el sitio publicado
 * tiene páginas, traducciones, índice de búsqueda, sitemap y sprite de iconos.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { JSDOM } from "jsdom";

import { BASE, CANONICAL_ORIGIN } from "../scripts/config.mjs";
import { GROUPS, PROJECTS, groupOf, pagePath } from "../scripts/registry.mjs";
import { LANGUAGES } from "../scripts/registry.mjs";
import { knownIcons } from "../scripts/icons.mjs";
import { DICT } from "../scripts/dict.mjs";
import { UI } from "../content/ui.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const dom = (rel) => new JSDOM(read(rel)).window.document;

test.before(() => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], {
    cwd: ROOT,
    stdio: "pipe",
    timeout: 120_000,
  });
});

test("el build genera las páginas fijas del sitio", () => {
  for (const file of ["index.html", "projects/index.html", "404.html", "sitemap.xml"]) {
    assert.ok(existsSync(path.join(ROOT, file)), `falta ${file}`);
  }
});

test("el build genera una página por guía", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const file = `${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`;
      assert.ok(existsSync(path.join(ROOT, file)), `falta ${file}`);
    }
  }
});

test("cada página lleva el conmutador de idioma y sus traducciones", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const file = `${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`;
      const doc = dom(file);

      const langSwitch = doc.querySelector("#langSwitch");
      assert.ok(langSwitch, `${file}: sin #langSwitch`);
      // Los dos idiomas comparten URL: el HTML se sirve en español y el inglés
      // viaja en #pageTranslations, igual que en la web principal.
      assert.equal(langSwitch.getAttribute("data-active"), "es", `${file}: idioma inicial`);
      assert.equal(doc.documentElement.getAttribute("lang"), "es", `${file}: <html lang>`);

      const raw = doc.querySelector("#pageTranslations")?.textContent;
      assert.ok(raw, `${file}: sin #pageTranslations`);
      const translations = JSON.parse(raw);
      for (const lang of LANGUAGES) {
        assert.ok(translations[lang]?.fields, `${file}: sin traducciones ${lang}`);
        const keys = Object.keys(translations[lang].fields);
        // body, desc, readtime, editHref y toc: las cinco piezas que el
        // conmutador necesita para traducir la página entera.
        assert.deepEqual(
          keys.sort(),
          ["body", "desc", "editHref", "readtime", "toc"],
          `${file}: campos ${lang} inesperados`,
        );
      }
      assert.deepEqual(
        Object.keys(translations.es.fields).sort(),
        Object.keys(translations.en.fields).sort(),
        `${file}: las claves es/en no coinciden`,
      );
    }
  }
});

test("cada página tiene sidebar, índice lateral y cuerpo", () => {
  for (const project of PROJECTS) {
    const file = `${pagePath(project.slug, project.pages[0].slug).replace(/^\//, "")}index.html`;
    const doc = dom(file);
    assert.ok(doc.querySelector(".side-nav"), `${file}: sin sidebar`);
    assert.ok(doc.querySelector("#docsSidebar"), `${file}: sin #docsSidebar`);
    assert.ok(doc.querySelector("#docsToc.docs__toc"), `${file}: sin índice lateral`);
    assert.ok(doc.querySelector(".toc__list a"), `${file}: índice lateral sin entradas`);
    assert.ok(doc.querySelector(".doc-body"), `${file}: sin cuerpo`);
    assert.ok(doc.querySelector("main#content") || doc.querySelector("main"), `${file}: sin <main>`);
    assert.ok(doc.querySelector(".skip-link"), `${file}: sin enlace de salto`);
  }
});

test("el sidebar enlaza todas las guías del proyecto", () => {
  for (const project of PROJECTS) {
    const file = `${pagePath(project.slug, "index").replace(/^\//, "")}index.html`;
    const doc = dom(file);
    const hrefs = [...doc.querySelectorAll(".side-nav a")].map((a) => a.getAttribute("href"));
    for (const page of project.pages) {
      const expected = BASE + pagePath(project.slug, page.slug).replace(/^\//, "");
      assert.ok(hrefs.includes(expected), `${file}: falta el enlace a ${expected}`);
    }
  }
});

test("los iconos usados están en el sprite", () => {
  const sprite = read("assets/img/icons.svg");
  const symbols = new Set([...sprite.matchAll(/<symbol id="icon-([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...knownIcons].sort(), [...symbols].sort(), "sprite y knownIcons difieren");

  for (const project of PROJECTS) {
    assert.ok(symbols.has(project.icon), `icono de proyecto desconocido: ${project.icon}`);
    for (const page of project.pages) {
      assert.ok(symbols.has(page.icon), `icono de página desconocido: ${project.slug}/${page.slug} → ${page.icon}`);
    }
  }
  for (const group of GROUPS) {
    assert.ok(symbols.has(group.icon), `icono de grupo desconocido: ${group.icon}`);
  }
});

test("ninguna página se queda con un <span data-icon> sin expandir", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const file = `${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`;
      const html = read(file);
      // El <body> lleva data-icons (plural) con la ruta del sprite: eso sí es
      // correcto. Lo que no puede quedar es un <span data-icon="…"> sin pintar,
      // ni siquiera dentro del JSON de traducciones.
      assert.ok(!html.includes("data-icon="), `${file}: icono sin expandir`);
    }
  }
  assert.ok(!read("index.html").includes("data-icon="), "index.html: icono sin expandir");
});

test("el índice de búsqueda cubre las dos lenguas y cada apartado", () => {
  const index = JSON.parse(read("assets/data/search-index.json"));
  assert.ok(index.count > 0 && index.count === index.entries.length, "count no cuadra con entries");

  const perLang = { es: 0, en: 0 };
  for (const entry of index.entries) {
    perLang[entry.lang] = (perLang[entry.lang] || 0) + 1;
    for (const field of ["lang", "project", "projectName", "url", "title", "excerpt"]) {
      assert.ok(entry[field] !== undefined && entry[field] !== "", `entrada sin ${field}: ${JSON.stringify(entry).slice(0, 90)}`);
    }
    assert.ok(entry.url.startsWith(BASE), `url fuera de BASE: ${entry.url}`);
    assert.ok(knownIcons.has(entry.icon), `icono desconocido en el índice: ${entry.icon}`);
  }
  assert.ok(perLang.es > 100 && perLang.en > 100, `índice desequilibrado: ${JSON.stringify(perLang)}`);
  assert.equal(perLang.es, perLang.en, "el índice debe ser simétrico entre idiomas");
});

test("el índice de búsqueda apunta a páginas que existen", () => {
  const index = JSON.parse(read("assets/data/search-index.json"));
  for (const entry of index.entries) {
    const url = entry.url.split("#")[0].replace(BASE, "");
    const file = url === "" ? "index.html" : `${url}index.html`;
    assert.ok(existsSync(path.join(ROOT, file)), `el índice apunta a ${entry.url} (falta ${file})`);
  }
});

test("el sitemap lista todas las guías con URL canónica", () => {
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.every((url) => url.startsWith(CANONICAL_ORIGIN)), "hay una URL fuera del origen canónico");
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const expected = `${CANONICAL_ORIGIN}${pagePath(project.slug, page.slug)}`;
      assert.ok(urls.includes(expected), `falta ${expected} en el sitemap`);
    }
  }
});

test("las páginas declaran canonical, og y twitter", () => {
  const doc = dom("wave/index.html");
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href");
  assert.equal(canonical, `${CANONICAL_ORIGIN}/wave/`);
  for (const property of ["og:title", "og:description", "og:url", "og:locale", "og:type", "twitter:card"]) {
    assert.ok(doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`), `falta ${property}`);
  }
  assert.ok(doc.querySelector('meta[name="theme-color"]'), "falta theme-color");
});

test("los recursos llevan versionado por hash", () => {
  const html = read("index.html");
  assert.match(html, /assets\/css\/style\.css\?v=[0-9a-f]{12}/);
  assert.match(html, /assets\/js\/main\.js\?v=[0-9a-f]{12}/);
  assert.match(html, /assets\/img\/icons\.svg\?v=[0-9a-f]{12}/);
});

test("todos los assets referenciados existen en disco", () => {
  const checked = new Set();
  for (const project of PROJECTS) {
    const file = `${pagePath(project.slug, "index").replace(/^\//, "")}index.html`;
    const doc = dom(file);
    const refs = [
      ...[...doc.querySelectorAll("link[href]")].map((n) => n.getAttribute("href")),
      ...[...doc.querySelectorAll("script[src]")].map((n) => n.getAttribute("src")),
    ];
    for (const ref of refs) {
      if (!ref || !ref.startsWith(BASE) || ref.startsWith("http")) continue;
      const rel = ref.replace(BASE, "").split("?")[0];
      if (checked.has(rel)) continue;
      checked.add(rel);
      assert.ok(existsSync(path.join(ROOT, rel)), `recurso ausente: ${rel}`);
    }
  }
  assert.ok(checked.size >= 4, `solo se comprobaron ${checked.size} recursos`);
});

test("404.html existe como respaldo de GitHub Pages", () => {
  const doc = dom("404.html");
  assert.ok(doc.body.textContent.length > 200, "la página de error está vacía");
  assert.ok(doc.querySelector("#pageTranslations"), "404.html sin traducciones");
});

test("la portada lista los siete proyectos y sus grupos", () => {
  const doc = dom("index.html");
  const text = doc.body.textContent;
  for (const project of PROJECTS) {
    assert.ok(text.includes(project.name), `la portada no menciona ${project.name}`);
  }
});

test("el índice de proyectos ofrece un filtro por grupo", () => {
  const doc = dom("projects/index.html");
  assert.ok(doc.querySelector('[data-filter="all"][aria-pressed="true"]'), "falta el chip «Todos» activo");
  for (const group of GROUPS) {
    const chip = doc.querySelector(`[data-filter="${group.slug}"]`);
    assert.ok(chip, `falta el filtro del grupo ${group.slug}`);
    assert.equal(chip.getAttribute("aria-pressed"), "false");
    assert.match(chip.textContent, new RegExp(String(group.projects.length)), `${group.slug}: contador`);
  }
  assert.ok(doc.querySelector("#projectCards .doc-card"), "sin tarjetas que filtrar");
  assert.ok(doc.querySelector("#projectEmpty"), "sin mensaje de categoría vacía");
  for (const project of PROJECTS) {
    const card = doc.querySelector(`#projectCards [data-name="${project.name.toLowerCase()}"]`);
    assert.ok(card, `falta la tarjeta de ${project.name}`);
    assert.equal(card.getAttribute("data-group"), groupOf(project.slug).slug, `${project.name}: grupo`);
  }
});

test("el índice de proyectos enlaza cada guía", () => {
  const doc = dom("projects/index.html");
  const hrefs = [...doc.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
  for (const project of PROJECTS) {
    const expected = BASE + pagePath(project.slug, "index").replace(/^\//, "");
    assert.ok(hrefs.includes(expected), `projects/ no enlaza ${expected}`);
  }
});

test("toda clave data-i18n del HTML generado existe en los dos idiomas", () => {
  // Es la garantía que sostiene el conmutador: si una clave falta en inglés,
  // al cambiar de idioma ese texto se queda en blanco sin que nada falle.
  const missing = new Set();
  const files = ["index.html", "projects/index.html", "404.html"];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      files.push(`${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`);
    }
  }
  let checked = 0;
  for (const file of files) {
    const doc = dom(file);
    for (const attr of ["data-i18n", "data-i18n-aria", "data-i18n-placeholder"]) {
      for (const node of doc.querySelectorAll(`[${attr}]`)) {
        const key = node.getAttribute(attr);
        checked += 1;
        for (const lang of LANGUAGES) {
          if (!DICT[lang][key]) missing.add(`${lang}: ${key} (en ${file})`);
        }
      }
    }
  }
  assert.ok(checked > 100, `solo se comprobaron ${checked} nodos traducibles`);
  assert.deepEqual([...missing], [], "claves data-i18n sin traducción");
});

test("ningún enlace interno del HTML generado está muerto", () => {
  // Cubre todo lo que el usuario puede pulsar: sidebar, migas, paginador,
  // chips de «otros proyectos», tarjetas de la portada y los enlaces del
  // propio contenido Markdown.
  const files = ["index.html", "projects/index.html", "404.html"];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      files.push(`${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`);
    }
  }

  const dead = [];
  let checked = 0;
  for (const file of files) {
    const doc = dom(file);
    for (const link of doc.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href");
      if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) continue;
      checked += 1;
      if (!href.startsWith(BASE)) {
        dead.push(`${file} → ${href} (fuera de BASE)`);
        continue;
      }
      const rel = href.replace(BASE, "").split("#")[0];
      const target = rel === "" ? "index.html" : `${rel}index.html`;
      if (!existsSync(path.join(ROOT, target))) dead.push(`${file} → ${href}`);
    }
  }
  assert.ok(checked > 400, `solo se comprobaron ${checked} enlaces internos`);
  assert.deepEqual(dead, [], "enlaces internos muertos");
});

test("ninguna página generada arrastra marcadores sin sustituir", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const file = `${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`;
      // Los tres <script type="application/json"> (uiStrings, pageTranslations
      // y searchConfig) llevan HTML escapado y llaves legítimas, así que se
      // retiran antes de buscar marcadores sin sustituir.
      const html = read(file).replace(/<script type="application\/json"[^>]*>[\s\S]*?<\/script>/g, "");
      // El build usa template literals, no placeholders "{{…}}", así que lo
      // que delata una página rota es la salida de una interpolación fallida.
      for (const marker of [">undefined<", "[object Object]", "NaN min", "Texto provisional", "data-icon=", "?v=&quot;"]) {
        assert.ok(!html.includes(marker), `${file}: contiene "${marker}"`);
      }
    }
  }
});

/* ---------- El índice "en esta página" no desaparece en pantallas estrechas ---------- */

/** Extrae el bloque @media cuya condición coincida, respetando llaves anidadas. */
function mediaBlock(css, condition) {
  const start = css.indexOf(`@media ${condition}`);
  assert.ok(start >= 0, `no existe @media ${condition}`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error("bloque @media sin cerrar");
}

test("en pantallas estrechas el TOC se recoloca en vez de ocultarse", () => {
  const css = read("assets/css/style.css");
  const block = mediaBlock(css, "(max-width: 1180px)");

  const tocRules = block.match(/\.docs__toc\s*\{[^}]*\}/g) || [];
  assert.ok(tocRules.length, "el bloque estrecho no dice nada del TOC");
  assert.ok(!tocRules.some((rule) => /display:\s*none/.test(rule)),
    "el TOC vuelve a ocultarse en pantallas estrechas");
  assert.match(block, /grid-template-areas:[^;]*toc/, "el TOC debe tener su área en la rejilla");
  assert.match(block, /\.docs__toc \.toc__list a\s*\{[^}]*border-radius:\s*999px/,
    "los apartados deben verse como chips");
});

test("al pasar a drawer el sidebar libera su área de la rejilla", () => {
  const css = read("assets/css/style.css");
  const block = mediaBlock(css, "(max-width: 860px)");
  assert.match(block, /grid-template-areas:\s*"toc"\s*"main"/, "la rejilla de una columna debe nombrar toc y main");
  assert.match(block, /\.docs__sidebar\s*\{[^}]*grid-area:\s*auto/,
    "un sidebar position:fixed no debe reclamar área");
});

test("toda var() del CSS está definida, tiene respaldo o la pone JavaScript", () => {
  // --accent-hover llegó a usarse sin existir: la declaración se cae en silencio
  // y el icono hereda un color que nadie eligió.
  const css = read("assets/css/style.css");
  const definidas = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  // Propiedades que asignan build.mjs y main.js en tiempo de ejecución.
  const desdeJs = new Set(["--lang-color", "--pointer-x", "--pointer-y", "--progress"]);

  const huerfanas = [];
  for (let i = css.indexOf("var("); i !== -1; i = css.indexOf("var(", i + 1)) {
    const inicio = i + 4;
    let depth = 1;
    let coma = -1;
    let fin = -1;
    for (let j = inicio; j < css.length; j += 1) {
      if (css[j] === "(") depth += 1;
      else if (css[j] === ")") {
        depth -= 1;
        if (depth === 0) { fin = j; break; }
      } else if (css[j] === "," && depth === 1 && coma === -1) coma = j;
    }
    if (fin === -1) break;
    // La coma de respaldo puede ir anidada (rgb(0 0 0 / .5)), de ahí el depth.
    const nombre = css.slice(inicio, coma === -1 ? fin : coma).trim();
    const respaldo = coma === -1 ? "" : css.slice(coma + 1, fin).trim();
    if (definidas.has(nombre) || desdeJs.has(nombre) || respaldo) continue;
    huerfanas.push(nombre);
  }
  assert.deepEqual([...new Set(huerfanas)].sort(), [], "var() sin definición ni respaldo");
});

test("el CSS no usa comentarios de barra doble, que no son válidos", () => {
  const css = read("assets/css/style.css");
  const offenders = css.split("\n")
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => /(^|[^:"'\\/])\/\//.test(line));
  assert.deepEqual(offenders, [], `comentarios // en CSS: ${offenders.map(([n]) => n).join(", ")}`);
});

/* ---------- Impresión y alto contraste forzado ---------- */

test("hay una hoja de impresión y pasa al tema claro", () => {
  const css = read("assets/css/style.css");
  const print = mediaBlock(css, "print");
  assert.match(print, /--bg:\s*#fff/i, "el fondo debe volverse blanco al imprimir");
  assert.match(print, /color-scheme:\s*light/, "falta color-scheme claro");
  assert.match(print, /break-inside:\s*avoid/, "los bloques no deben partirse a mitad");
});

test("la impresión oculta la interfaz y no el contenido", () => {
  const css = read("assets/css/style.css");
  const print = mediaBlock(css, "print");
  for (const clase of ["nav", "docs__sidebar", "docs__toc", "progress-bar", "to-top",
    "search-modal", "sidebar-toggle", "pager", "footer", "code-copy", "anchor"]) {
    assert.ok(print.includes(`.${clase}`), `la impresión no oculta .${clase}`);
  }
  assert.match(print, /display:\s*none/, "hace falta un display:none para la interfaz");
  // El contenido no puede desaparecer: ni el cuerpo ni su cabecera.
  assert.ok(!/\.doc-body[^{]*\{[^}]*display:\s*none/.test(print), "la impresión oculta el cuerpo");
  assert.ok(!/\.doc-head[^{]*\{[^}]*display:\s*none/.test(print), "la impresión oculta la cabecera");
});

test("las clases de la hoja de impresión existen de verdad", () => {
  const css = read("assets/css/style.css");
  const print = mediaBlock(css, "print");
  const clases = [...new Set([...print.matchAll(/\.([a-z][a-z0-9_-]*)/gi)].map((m) => m[1]))]
    // Pseudoelementos y utilidades del propio bloque, no clases del documento.
    .filter((c) => !["doc-body", "before", "after"].includes(c) || c === "doc-body");

  // Clases que crea JavaScript en tiempo de ejecución y no están en el HTML.
  const creadasPorJs = new Set(["code-copy", "anchor", "sidebar-scrim", "in-view", "doc-table"]);
  const html = ["index.html", "projects/index.html", "wave/install/index.html", "404.html"]
    .map(read).join("\n");
  const js = ["main.js", "search.js", "i18n.js"].map((f) => read(`assets/js/${f}`)).join("\n");

  const fantasmas = clases.filter((clase) =>
    !creadasPorJs.has(clase)
    && !html.includes(`class="${clase}`) && !html.includes(` ${clase}"`) && !html.includes(` ${clase} `)
    && !css.includes(`.${clase}`) && !js.includes(clase));
  assert.deepEqual(fantasmas, [], `selectores de impresión que no apuntan a nada: ${fantasmas}`);
});

test("el alto contraste forzado apoya los estados activos en Highlight", () => {
  const css = read("assets/css/style.css");
  const forced = mediaBlock(css, "(forced-colors: active)");
  assert.match(forced, /\.progress-bar[^}]*Highlight/, "la barra de progreso desaparecería en alto contraste");
  assert.match(forced, /\.toc__list a\.active[^}]*Highlight/, "el apartado activo del TOC desaparecería");
  assert.match(forced, /CanvasText/, "los bordes deben caer en CanvasText");
});

test("los detalles tipográficos están presentes", () => {
  const css = read("assets/css/style.css");
  assert.match(css, /scrollbar-gutter:\s*stable/, "falta reservar el hueco de la barra de desplazamiento");
  assert.match(css, /text-wrap:\s*balance/, "los títulos no se equilibran");
  assert.match(css, /text-wrap:\s*pretty/, "el texto no evita viudas");
  assert.match(css, /caret-color:\s*var\(--accent\)/, "el cursor de texto no usa el acento");
});

/* ---------- Salud del HTML generado en todas las páginas ---------- */

function todasLasPaginas() {
  const fijas = ["index.html", "projects/index.html", "404.html"];
  const guias = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      guias.push(`${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`);
    }
  }
  return [...fijas, ...guias];
}

test("ningún botón queda sin nombre accesible en el HTML servido", () => {
  const sinNombre = [];
  for (const rel of todasLasPaginas()) {
    const doc = dom(rel);
    doc.querySelectorAll("button").forEach((button) => {
      if (button.getAttribute("aria-label")?.trim()) return;
      if (button.getAttribute("aria-labelledby")) return;
      if (button.textContent.trim()) return;
      sinNombre.push(`${rel} → ${button.className || button.id || "button"}`);
    });
  }
  assert.deepEqual(sinNombre, [], "botones sin nombre antes de que corra el JS");
});

test("no hay identificadores duplicados en ninguna página", () => {
  const duplicados = [];
  for (const rel of todasLasPaginas()) {
    const vistos = new Map();
    dom(rel).querySelectorAll("[id]").forEach((node) => {
      vistos.set(node.id, (vistos.get(node.id) || 0) + 1);
    });
    const repetidos = [...vistos].filter(([, veces]) => veces > 1).map(([id]) => id);
    if (repetidos.length) duplicados.push(`${rel} → ${repetidos.join(", ")}`);
  }
  assert.deepEqual(duplicados, [], "ids duplicados rompen aria-controls y las anclas");
});

test("toda página declara idioma, título y un solo h1 de cabecera", () => {
  const fallos = [];
  for (const rel of todasLasPaginas()) {
    const doc = dom(rel);
    const lang = doc.documentElement.getAttribute("lang");
    if (lang !== "es") fallos.push(`${rel} → lang="${lang}"`);
    if (!doc.querySelector("title")?.textContent.trim()) fallos.push(`${rel} → sin <title>`);
    const h1 = doc.querySelectorAll("h1");
    if (h1.length === 0) fallos.push(`${rel} → sin h1`);
    if (h1.length > 2) fallos.push(`${rel} → ${h1.length} h1`);
  }
  assert.deepEqual(fallos, [], "cabeceras mal formadas");
});

test("no hay enlaces muertos por href vacío", () => {
  const malos = [];
  for (const rel of todasLasPaginas()) {
    dom(rel).querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === "" || href === "#") malos.push(`${rel} → "${href}"`);
    });
  }
  assert.deepEqual(malos, [], "enlaces que no llevan a ningún sitio");
});

/**
 * Las cuatro roturas silenciosas que no dan error de build ni se ven en el
 * terminal: un icono renombrado se pinta en blanco, una clave de traducción
 * que falta deja texto en el idioma equivocado, un enlace interno lleva al
 * 404 de Pages y una ancla del TOC no desplaza a ningún sitio.
 *
 * Un solo recorrido por página: parsear 41 documentos con jsdom es lo caro.
 */
test("ninguna página referencia algo que no existe", () => {
  const sprite = read("assets/img/icons.svg");
  const simbolos = new Set([...sprite.matchAll(/<symbol[^>]*id="([^"]+)"/g)].map((m) => m[1]));
  const claves = new Set([...Object.keys(DICT.es), ...Object.keys(DICT.en)]);

  const iconos = [];
  const traducciones = [];
  const anclas = [];
  const enlaces = [];
  let referencias = 0;

  for (const rel of todasLasPaginas()) {
    const doc = dom(rel);

    // <use href="…#icon-x"> del layout y data-icon, que expande main.js.
    doc.querySelectorAll("use[href], [data-icon]").forEach((node) => {
      const valor = node.tagName.toLowerCase() === "use"
        ? (node.getAttribute("href") || "").split("#")[1]
        : node.getAttribute("data-icon");
      if (!valor) return;
      referencias += 1;
      if (!simbolos.has(valor)) iconos.push(`${rel} → ${valor}`);
    });

    doc.querySelectorAll("[data-i18n],[data-i18n-aria],[data-i18n-placeholder],[data-i18n-title],[data-i18n-label],[data-i18n-alt]").forEach((node) => {
      for (const attr of node.attributes) {
        if (!attr.name.startsWith("data-i18n")) continue;
        for (const key of attr.value.split(/\s+/)) {
          if (!claves.has(key)) traducciones.push(`${rel} → ${key}`);
        }
      }
    });

    doc.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (href.startsWith("#")) {
        const destino = decodeURIComponent(href.slice(1));
        if (destino && !destino.startsWith("icon-") && !doc.getElementById(destino)) anclas.push(`${rel} → ${href}`);
        return;
      }
      if (!href.startsWith(BASE) || href.includes("/assets/")) return;
      let relativo = href.slice(BASE.length).split("#")[0].split("?")[0];
      if (relativo === "" || relativo.endsWith("/")) relativo += "index.html";
      if (!existsSync(path.join(ROOT, relativo))) enlaces.push(`${rel} → ${href}`);
    });
  }

  // Sin estas dos comprobaciones la prueba pasaría en blanco si el sprite o el
  // marcado dejaran de generarse.
  assert.ok(simbolos.size >= 50, `sprite con solo ${simbolos.size} símbolos`);
  assert.ok(referencias >= 100, `solo ${referencias} referencias a iconos en ${todasLasPaginas().length} páginas`);

  assert.deepEqual([...new Set(iconos)], [], "iconos que se pintarían en blanco");
  assert.deepEqual([...new Set(traducciones)], [], "claves data-i18n ausentes del diccionario");
  assert.deepEqual([...new Set(anclas)], [], "anclas internas sin id de destino");
  assert.deepEqual([...new Set(enlaces)], [], "enlaces internos a páginas inexistentes");
});

/**
 * Un enlace de Markdown mal formado no falla el build: marked lo renderiza a
 * medias y sale HTML mutilado. Ocurrió al envolver dos veces una fila de tabla
 * (`[`[`README.md`](url)`](url)`) y produjo un <a> cuyo href contenía corchetes.
 */
test("ningún href arrastra sintaxis de Markdown sin procesar", () => {
  const malos = [];
  for (const rel of todasLasPaginas()) {
    const doc = dom(rel);

    doc.querySelectorAll("[href]").forEach((node) => {
      const href = node.getAttribute("href");
      if (/[\[\]`\s]/.test(href)) malos.push(`${rel} → href="${href.slice(0, 80)}"`);
    });

    // Un <code> con solo un corchete es el resto de un enlace roto.
    doc.querySelectorAll("code").forEach((code) => {
      if (/^[\[\]]$/.test(code.textContent.trim())) malos.push(`${rel} → <code>${code.textContent}</code>`);
    });

    // Y una celda de tabla no debe conservar "](" fuera de un <code>, que es
    // donde sí puede aparecer como ejemplo documentado.
    doc.querySelectorAll("td, th").forEach((celda) => {
      const clon = celda.cloneNode(true);
      clon.querySelectorAll("code, pre").forEach((n) => n.remove());
      if (clon.textContent.includes("](")) malos.push(`${rel} → ${celda.textContent.trim().slice(0, 80)}`);
    });
  }
  assert.deepEqual([...new Set(malos)], [], "Markdown crudo en el HTML servido");
});

test("ninguna cadena de la interfaz está definida sin usarse en ningún sitio", () => {
  // Llegó a acumular dieciséis claves muertas sin que nada fallara: nueve
  // etiquetas de una ficha de proyecto que se implementó de otra forma, cuatro
  // de dos secciones de la portada que nunca se construyeron, un enlace de
  // vuelta que las migas de pan ya cubren, una entrada de navegación duplicada
  // y un pie de tabla genérico. Todas se servían en los dos idiomas dentro de
  // cada página y no aparecían en ninguna. No valen nada y pesan en las 45.
  //
  // El diccionario va incrustado en cada HTML, así que buscar la clave tal cual
  // siempre da positivo: hay que mirar solo los atributos que la consumen.
  const paginas = todasLasPaginas().map(read).join("\n");
  const codigo = [
    ...readdirSync(path.join(ROOT, "scripts")).filter((n) => n.endsWith(".mjs")).map((n) => `scripts/${n}`),
    ...readdirSync(path.join(ROOT, "assets", "js")).filter((n) => n.endsWith(".js")).map((n) => `assets/js/${n}`),
  ].map(read).join("\n");

  const muertas = [];
  for (const clave of Object.keys(DICT.es)) {
    // proj.*, page.* y group.* las deriva dict.mjs del registro y las consume el
    // marcado generado, pero se comprueban igual: si una deja de usarse, sobra.
    const atributo = new RegExp(`data-(?:i18n(?:-aria|-placeholder)?|content-key)="${clave}"`);
    if (atributo.test(paginas)) continue;
    if (codigo.includes(`"${clave}"`) || codigo.includes(`'${clave}'`) || codigo.includes("`" + clave + "`")) continue;
    muertas.push(clave);
  }
  assert.deepEqual(muertas, [], "cadenas de interfaz definidas pero que no consume nada");
});

test("las tipografías están autohospedadas y existen en disco", () => {
  // La web sirve once woff2 propios con font-display: swap. Cargarlas de Google
  // Fonts era la diferencia más visible entre los dos sitios: cambian el fichero,
  // el subconjunto de glifos y el momento en que aparece el texto.
  //
  // Una url() rota no falla en ninguna otra prueba y se ve simplemente como una
  // fuente del sistema, así que se comprueba que cada fichero existe, que no
  // queda ningún CDN y que las licencias SIL viajan con las fuentes, que es lo
  // que exige redistribuirlas.
  const css = read("assets/css/style.css");
  const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.ok(urls.length >= 11, `solo ${urls.length} url() en el CSS; se esperaban las once fuentes`);
  for (const url of urls) {
    assert.ok(
      existsSync(path.join(ROOT, "assets", "css", url)),
      `el CSS pide ${url} y ese fichero no existe`
    );
  }
  for (const familia of ["DM Sans", "Space Grotesk", "IBM Plex Mono"]) {
    assert.match(css, new RegExp(`@font-face[^}]*"${familia}"`), `falta el @font-face de ${familia}`);
    const licencia = `${familia.toLowerCase().replace(/ /g, "-")}.LICENSE.txt`;
    assert.ok(
      existsSync(path.join(ROOT, "assets", "vendor", licencia)),
      `falta assets/vendor/${licencia}, que la licencia SIL exige distribuir con la fuente`
    );
  }
  for (const rel of todasLasPaginas()) {
    assert.ok(
      !/fonts\.(googleapis|gstatic)\.com/.test(read(rel)),
      `${rel} aún enlaza tipografías de un CDN`
    );
  }
});


test("la portada hereda el hero de la web en vez de reimplementarlo", () => {
  // Las reglas .hero* están copiadas byte a byte de la web. La portada llevaba
  // encima .docs-hero__inner/__title/__subtitle con cifras parecidas pero no
  // iguales —84px 64px contra 90px 80px, gap 64 contra 72,
  // clamp(2.6rem, 6.2vw, 4.4rem) contra clamp(3rem, 6.8vw, 5rem)—: se veía casi
  // igual y divergía en silencio con cada retoque, que es justo lo que pasó.
  // Ahora el marcado usa las clases de la web y el CSS solo añade lo que la web
  // no tiene.
  const css = read("assets/css/style.css");
  const usadas = new Set(
    [...read("index.html").matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
  );

  for (const clase of ["hero", "hero__inner", "hero__content", "hero__title", "hero__subtitle", "hero__cta", "hero__visual"]) {
    assert.ok(usadas.has(clase), `a la portada le falta la clase ${clase} de la web`);
  }
  for (const parte of ["inner", "title", "subtitle", "copy"]) {
    assert.ok(!usadas.has(`docs-hero__${parte}`), `docs-hero__${parte} sigue tapando a hero__${parte}`);
    assert.ok(!css.includes(`.docs-hero__${parte}`), `.docs-hero__${parte} duplica una regla de la web`);
  }
  assert.ok(!/^\.docs-hero \{/m.test(css), ".docs-hero vuelve a reescribir el relleno del hero");

  // Lo que sí es propio de la documentación y debe seguir existiendo.
  for (const parte of ["kicker", "meta", "cta"]) {
    assert.ok(css.includes(`.docs-hero__${parte}`), `falta .docs-hero__${parte}`);
  }
});

test("las tarjetas de proyecto llevan las cifras de la web", () => {
  // .doc-card es la hermana de .project-card: mismo relleno, mismo radio, mismo
  // alto mínimo, misma flecha en la esquina. Lo que cambia es el contenido —una
  // caja de icono y una fila de enlaces en vez de forks y estrellas—, no el ritmo.
  const css = read("assets/css/style.css");
  const raiz = /^\.doc-card \{([^}]*)\}$/m.exec(css)?.[1];
  assert.ok(raiz, "no encuentro la regla raíz de .doc-card");
  for (const declaracion of ["gap: 14px", "min-height: 220px", "padding: 24px", "border-radius: 8px"]) {
    assert.ok(raiz.includes(declaracion), `.doc-card debería llevar ${declaracion}, como .project-card`);
  }
  assert.match(css, /^\.doc-card__name \{ font: 500 1\.3rem var\(--font-display\)/m, "el nombre de la tarjeta no usa el tamaño de la web");
  assert.match(css, /^\.doc-card__arrow \{ position: absolute; top: 20px; right: 20px/m, "la flecha no está donde la pone la web");
});

test("el theme-color es el de la web", () => {
  // #10120f es el color que la web le pide a la barra del navegador. Aquí estaba
  // --bg (#0d100d), que es otro tono: invisible dentro de la página y muy
  // visible fuera, porque el marco cambia de color al entrar en la documentación.
  assert.match(read("index.html"), /<meta name="theme-color" content="#10120f" \/>/);
});

test("ninguna página lleva estilos en línea", () => {
  // Un style="" es la puerta de atrás del CSS: no lo compara ninguna prueba de
  // paridad con la web, no se reutiliza, no responde a los puntos de ruptura y se
  // queda obsoleto en silencio cuando cambia la regla a la que acompañaba. Había
  // cuatro —el 404 centrado y dos huecos verticales en la portada— y ahora son
  // modificadores BEM y selectores de hermano.
  //
  // La única excepción es --lang-color: no declara un estilo, pasa el color del
  // lenguaje de cada proyecto a una regla que sí vive en el CSS.
  const permitidas = /^--[\w-]+:$/;
  let vistas = 0;
  for (const rel of todasLasPaginas()) {
    for (const bloque of read(rel).matchAll(/style="([^"]*)"/g)) {
      for (const declaracion of bloque[1].split(";").map((d) => d.trim()).filter(Boolean)) {
        vistas += 1;
        const propiedad = declaracion.split(":")[0].trim();
        assert.ok(permitidas.test(propiedad + ":"), `${rel}: estilo en línea «${declaracion}»`);
      }
    }
  }
  assert.ok(vistas >= 7, `solo ${vistas} style="" en todo el sitio; se esperaban los colores de lenguaje`);
});


test("la prosa de la documentación mide lo mismo que la prosa de la web", () => {
  // El CSS lleva copiadas las reglas .project-detail__readme de la web. Aquí no se
  // aplican a nada —no hay fichas de proyecto ni blog— pero son la referencia de
  // cómo se ve el Markdown renderizado en su sitio, y viven en este mismo fichero,
  // así que la comparación se mantiene sola si él las cambia.
  //
  // .doc-body es la implementación propia y había derivado en siete cifras: h3 a
  // 1.15rem contra 1.2rem, listas a 22px contra 24px, hr a 40px contra 32px, pre
  // con 18px 20px y radio 8px contra 20px y 6px, tablas a .84rem contra .85rem,
  // celdas a 11px contra 10px y código en línea a .82em contra .85em.
  const css = read("assets/css/style.css").split("\n");
  const cuerpo = (selector) => {
    // La primera aparición: las que vienen después están dentro de un @media.
    const linea = css.find((l) => l.startsWith(selector + " {"));
    assert.ok(linea, `no encuentro la regla ${selector}`);
    const mapa = {};
    for (const declaracion of linea.slice(linea.indexOf("{") + 1, linea.lastIndexOf("}")).split(";")) {
      const corte = declaracion.indexOf(":");
      if (corte > 0) mapa[declaracion.slice(0, corte).trim()] = declaracion.slice(corte + 1).trim();
    }
    return mapa;
  };

  const comparadas = [
    [".project-detail__readme h3, .post-detail__body h3", ".doc-body h3", ["font-size"]],
    [".project-detail__readme :is(ul,ol), .post-detail__body :is(ul,ol)", ".doc-body :is(ul, ol)", ["padding-left"]],
    [".project-detail__readme li + li", ".doc-body li + li", ["margin-top"]],
    [".project-detail__readme hr, .post-detail__body hr", ".doc-body hr", ["margin-block"]],
    [".project-detail__readme pre, .post-detail__body pre", ".doc-body pre", ["padding", "border-radius", "font-size"]],
    [".project-detail__readme code, .post-detail__body code", ".doc-body code", ["padding", "border-radius", "font-size"]],
    [".project-detail__readme blockquote, .post-detail__body blockquote", ".doc-body blockquote", ["margin", "padding", "border-left"]],
    [".project-detail__readme table", ".doc-body table", ["width", "border-collapse", "font-size"]],
    [".project-detail__readme :is(th,td)", ".doc-body :is(th, td)", ["padding"]],
  ];
  for (const [web, docs, propiedades] of comparadas) {
    const origen = cuerpo(web);
    const copia = cuerpo(docs);
    for (const propiedad of propiedades) {
      assert.equal(copia[propiedad], origen[propiedad],
        `${docs} debería llevar ${propiedad}: ${origen[propiedad]}, como ${web}`);
    }
  }

  // Lo que sí es distinto a propósito, para que quede por escrito y no se
  // "arregle" por accidente: el h1 se esconde porque la cabecera de la página ya
  // lleva el título; el h2 respira más porque estas guías son largas; las listas
  // sin numerar usan un guión en vez de viñeta; y las tablas llevan filetes solo
  // abajo y a la derecha con cabecera en versalitas monoespaciadas, que se leen
  // mejor en tablas de referencia anchas.
  assert.match(css.join("\n"), /^\.doc-body h1 \{ display: none; \}$/m);
  assert.ok(cuerpo(".doc-body h2")["margin"].startsWith("48px"), "el h2 de la documentación debe seguir respirando más que el de un README");
  assert.ok(cuerpo(".doc-body ul")["list-style"] === "none", "las listas sin numerar llevan guión propio");
});


test("las cifras del diccionario que declara la documentación son las reales", () => {
  // La página website/i18n dice cuántas claves lleva el bloque #uiStrings. Es el
  // mismo riesgo que las cifras del README, que llegaron a decir 37 guías cuando
  // el registro llevaba 40: un número escrito en prosa no falla en ninguna parte
  // cuando deja de ser verdad. Aquí se deriva de los dos módulos.
  //
  // Y la cifra no es evidente, porque el bloque no lleva solo los textos escritos
  // a mano: dict.mjs añade las claves derivadas del registro —cuatro por
  // proyecto, una por guía y dos por grupo—, así que añadir una guía mueve el
  // total sin tocar content/ui.mjs.
  const manuales = Object.keys(UI.es).length;
  const totales = Object.keys(DICT.es).length;
  assert.ok(totales > manuales, "el diccionario debería llevar claves derivadas del registro");
  assert.equal(Object.keys(UI.en).length, manuales, "ui.mjs tiene distintas claves en cada idioma");
  assert.equal(Object.keys(DICT.en).length, totales, "dict.mjs tiene distintas claves en cada idioma");

  for (const [file, palabra] of [
    ["content/docs/website/i18n.md", "claves"],
    ["content/docs/website/i18n.en.md", "keys"],
  ]) {
    const texto = read(file);
    const dichas = new Set([...texto.matchAll(new RegExp(`(\\d+) ${palabra}`, "g"))].map((m) => Number(m[1])));
    for (const cifra of [manuales, totales]) {
      assert.ok(dichas.has(cifra), `${file} no declara ${cifra} ${palabra}, que es lo que lleva el diccionario`);
    }
  }
});

test("el recorrido de cada portada lo genera el build con todas sus páginas", () => {
  // Sustituye a la comprobación sobre el Markdown: el apartado ya no se escribe,
  // se compone con las páginas hermanas. Esto falla si el generador se olvida de
  // alguna, si las desordena o si enlaza con un texto que no es su título.
  for (const project of PROJECTS) {
    const doc = new JSDOM(read(`${project.slug}/index.html`)).window.document;
    const traducciones = JSON.parse(doc.getElementById("pageTranslations").textContent);
    const hermanas = project.pages.filter((page) => page.slug !== "index");

    for (const lang of LANGUAGES) {
      const etiqueta = `${project.slug}/${lang}`;
      const titulo = lang === "es" ? "Recorrido de la guía" : "Guide tour";
      const cuerpo = lang === "es" ? doc.querySelector(".doc-body").innerHTML : traducciones.en.fields.body;
      const donde = cuerpo.indexOf(titulo);
      assert.ok(donde !== -1, `${etiqueta}: falta el apartado «${titulo}»`);
      const seccion = cuerpo.slice(donde);

      // Los enlaces del recorrido, en el orden en que salen.
      // La frase puede llevar marcado dentro (`auto` sale como <code>auto</code>),
      // así que se captura hasta el cierre del <li> y se le quitan las etiquetas.
      const enlaces = [...seccion.matchAll(/<a href="[^"]*\/([a-z0-9-]+)\/">([^<]*)<\/a>([\s\S]*?)<\/li>/g)];
      assert.deepEqual(
        enlaces.map((m) => m[1]),
        hermanas.map((page) => page.slug),
        `${etiqueta}: el recorrido no lista sus páginas en orden`,
      );
      // El cuerpo es HTML: «Features & usage» llega como «Features &amp; usage».
      const desescapar = (s) =>
        s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      enlaces.forEach((m, i) => {
        assert.equal(desescapar(m[2]), hermanas[i].title[lang], `${etiqueta}: ${m[1]} no se llama como en el registro`);
        // La frase va detrás de la raya y no puede quedarse vacía.
        const frase = desescapar(m[3].replace(/<[^>]+>/g, "")).replace(/^\s*—\s*/, "").trim();
        assert.ok(frase.length > 8, `${etiqueta}: ${m[1]} se quedó sin frase`);
      });
    }
  }
});
