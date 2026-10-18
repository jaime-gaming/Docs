/**
 * Comportamiento del renderizador Markdown.
 *
 * Estas son las convenciones de autoría documentadas: enlaces internos con
 * BASE, "~/x" hacia la web principal, avisos [!NOTE] como callouts, tablas
 * desplazables y slugs de encabezado sin acentos ni duplicados.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ALERTS, escapeHtml, renderMarkdown, stripTags } from "../scripts/markdown.mjs";
import { BASE } from "../scripts/config.mjs";
import { DICT } from "../scripts/dict.mjs";
import { PROJECTS } from "../scripts/registry.mjs";

const render = (source, options) => renderMarkdown(source, options).html;

test("los encabezados generan id y alimentan el índice", () => {
  const { html, toc } = renderMarkdown("## Instalación\n\ntexto\n\n### Con Docker\n\nmás texto\n");
  assert.match(html, /<h2 id="instalacion">Instalación<\/h2>/);
  assert.match(html, /<h3 id="con-docker">Con Docker<\/h3>/);
  assert.deepEqual(toc, [
    { level: 2, id: "instalacion", text: "Instalación" },
    { level: 3, id: "con-docker", text: "Con Docker" },
  ]);
});

test("los slugs repiten sin colisión", () => {
  const { toc } = renderMarkdown("## Uso\n\na\n\n## Uso\n\nb\n\n## Uso\n\nc\n");
  assert.deepEqual(toc.map((t) => t.id), ["uso", "uso-1", "uso-2"]);
});

test("el h1 no entra en el índice (lo pinta el layout)", () => {
  const { toc } = renderMarkdown("# Título\n\n## Apartado\n");
  assert.deepEqual(toc.map((t) => t.text), ["Apartado"]);
});

test("los enlaces internos reciben BASE", () => {
  assert.match(render("[guía](/wave/install/)"), new RegExp(`href="${BASE}wave/install/"`));
  assert.match(render("[inicio](/)"), new RegExp(`href="${BASE}"`));
});

test("los enlaces con ~/ apuntan a la web principal", () => {
  const html = render("[mi web](~/projects/)");
  assert.match(html, /href="https:\/\/jaime-gaming\.github\.io\/projects\/"/);
  assert.ok(!html.includes(`href="${BASE}~/`), "no debería quedar el prefijo ~");
});

test("los anclajes internos no se reescriben", () => {
  assert.match(render("[arriba](#instalacion)"), /href="#instalacion"/);
});

test("los enlaces externos abren en otra pestaña, los propios no", () => {
  assert.match(render("[repo](https://github.com/jaime-gaming/Wave)"), /target="_blank" rel="noopener noreferrer"/);
  const own = render("[web](https://jaime-gaming.github.io/Wave/)");
  assert.ok(!own.includes('target="_blank"'), "los dominios propios no deben abrir pestaña nueva");
});

test("mailto y tel se conservan tal cual", () => {
  assert.match(render("[mail](mailto:a@b.c)"), /href="mailto:a@b\.c"/);
  assert.ok(!render("[mail](mailto:a@b.c)").includes("target="));
});

test("los avisos se convierten en callouts traducidos", () => {
  const html = renderMarkdown("> [!WARNING]\n> Ten cuidado con esto.\n", { lang: "en", dict: DICT.en }).html;
  assert.match(html, /class="callout callout--warning"/);
  assert.match(html, /<p class="callout__title">Warning<\/p>/);
  assert.match(html, /Ten cuidado con esto\./);
  assert.ok(!html.includes("<blockquote>"), "no debe quedar la cita original");
});

test("cada etiqueta de aviso tiene su variante", () => {
  assert.equal(ALERTS.NOTE.variant, "note");
  assert.equal(ALERTS.TIP.variant, "tip");
  assert.equal(ALERTS.IMPORTANT.variant, "important");
  assert.equal(ALERTS.WARNING.variant, "warning");
  assert.equal(ALERTS.CAUTION.variant, "danger");
});

test("cada variante de aviso tiene su regla en el CSS", () => {
  // La variante «note» existió un tiempo sin CSS propio.
  const css = readFileSync(new URL("../assets/css/style.css", import.meta.url), "utf8");
  for (const variant of new Set(Object.values(ALERTS).map((alert) => alert.variant))) {
    assert.match(css, new RegExp(`\\.callout--${variant}\\b`), `sin estilo: callout--${variant}`);
  }
});

test("[!CAUTION] ya no sale titulado como [!IMPORTANT]", () => {
  const es = render("> [!CAUTION]\n> cuidado\n", { lang: "es", dict: DICT.es });
  const en = render("> [!CAUTION]\n> cuidado\n", { lang: "en", dict: DICT.en });
  assert.match(es, /callout__title">Precaución</);
  assert.match(en, /callout__title">Caution</);
});

test("el título del aviso se traduce con el diccionario", () => {
  const es = render("> [!NOTE]\n> hola\n", { lang: "es", dict: DICT.es });
  const en = render("> [!NOTE]\n> hola\n", { lang: "en", dict: DICT.en });
  assert.match(es, /callout__title">Nota</);
  assert.match(en, /callout__title">Note</);
});

test("una cita normal sigue siendo una cita", () => {
  const html = render("> Michael Burns desapareció el año pasado.\n");
  assert.match(html, /<blockquote>/);
  assert.ok(!html.includes("callout"));
});

test("un aviso con etiqueta desconocida no rompe nada", () => {
  const html = render("> [!PELIGRO]\n> texto\n");
  assert.match(html, /<blockquote>/);
});

test("las tablas se envuelven para poder desplazarse", () => {
  const html = render("| a | b |\n| --- | --- |\n| 1 | 2 |\n");
  assert.match(html, /<div class="doc-table"><table>/);
  assert.match(html, /<thead>.*<th>a<\/th>/s);
});

test("los bloques de código llevan el idioma y escapan el HTML", () => {
  const html = render("```bash\nnpm run build < /dev/null\n```\n");
  assert.match(html, /<pre data-lang="bash"><code class="language-bash">/);
  assert.match(html, /npm run build &lt; \/dev\/null/);
});

test("un bloque sin idioma no inventa etiqueta", () => {
  const html = render("```\nplain\n```\n");
  assert.match(html, /<pre data-lang=""><code>/);
});

test("las listas de tareas usan checkboxes deshabilitadas", () => {
  const html = render("- [x] hecho\n- [ ] pendiente\n");
  assert.match(html, /<input class="readme-checkbox" type="checkbox" checked disabled \/>/);
  assert.match(html, /<input class="readme-checkbox" type="checkbox" disabled \/>/);
});

test("las imágenes llevan lazy loading y texto alternativo", () => {
  const html = render("![captura](/assets/img/x.png)\n");
  assert.match(html, /loading="lazy"/);
  assert.match(html, /alt="captura"/);
});

test("el tiempo de lectura se calcula por palabras", () => {
  const short = renderMarkdown("## A\n\n" + "palabra ".repeat(100));
  assert.equal(short.readTime, 1);
  const long = renderMarkdown("## A\n\n" + "palabra ".repeat(2100));
  assert.ok(long.readTime >= 9 && long.readTime <= 12, `readTime=${long.readTime}`);
});

test("escapeHtml y stripTags hacen lo que prometen", () => {
  assert.equal(escapeHtml('<a href="x">&</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  assert.equal(stripTags("<p>hola <b>mundo</b></p>").replace(/\s+/g, " ").trim(), "hola mundo");
});

test("el Markdown del contenido no inyecta HTML crudo", () => {
  // marked no sanea: lo que haya en el Markdown pasa al HTML. Por eso la
  // garantía real es que el contenido no lleve etiquetas peligrosas.
  const docsDir = path.resolve(import.meta.dirname, "..", "content", "docs");
  const risky = /<\s*(script|iframe|object|embed|form|input|link|meta|style)\b/i;

  const offenders = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const suffix of [".md", ".en.md"]) {
        const file = path.join(docsDir, project.slug, `${page.slug}${suffix}`);
        const source = readFileSync(file, "utf8");
        // El interior de las vallas y del código en línea es legítimo: se ignora.
        const prose = source.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]+`/g, "");
        const line = prose.split("\n").find((l) => risky.test(l));
        if (line) offenders.push(`${project.slug}/${page.slug}${suffix}: ${line.trim().slice(0, 60)}`);
      }
    }
  }
  assert.deepEqual(offenders, [], "HTML crudo fuera de los bloques de código");
});

test("el HTML generado escapa los caracteres del cuerpo", () => {
  const { html } = renderMarkdown("## Título\n\nComparación `a < b` y 5 > 3.\n");
  assert.match(html, /<h2 id="titulo">Título<\/h2>/);
  assert.match(html, /<code>a &lt; b<\/code>/);
  assert.match(html, /5 &gt; 3/);
});
