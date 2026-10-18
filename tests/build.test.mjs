/**
 * Prueba de extremo a extremo: ejecuta el build real y valida lo que genera.
 *
 * Es la prueba más lenta y la más valiosa: si esto pasa, el sitio publicado
 * tiene páginas, traducciones, índice de búsqueda, sitemap y sprite de iconos.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { JSDOM } from "jsdom";

import { BASE, CANONICAL_ORIGIN } from "../scripts/config.mjs";
import { GROUPS, PROJECTS, groupOf, pagePath } from "../scripts/registry.mjs";
import { LANGUAGES } from "../scripts/registry.mjs";
import { knownIcons } from "../scripts/icons.mjs";
import { DICT } from "../scripts/dict.mjs";

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

test("el CSS no usa comentarios de barra doble, que no son válidos", () => {
  const css = read("assets/css/style.css");
  const offenders = css.split("\n")
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => /(^|[^:"'\\/])\/\//.test(line));
  assert.deepEqual(offenders, [], `comentarios // en CSS: ${offenders.map(([n]) => n).join(", ")}`);
});
