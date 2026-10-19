/**
 * El payload de GitHub Pages.
 *
 * `_site/` es lo único que se publica. Si le falta una página, el sitio sale
 * roto; si le sobran fuentes o node_modules, el despliegue engorda sin motivo.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

import { BASE } from "../scripts/config.mjs";
import { PROJECTS } from "../scripts/registry.mjs";
import { pagePath } from "../scripts/registry.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITE = path.join(ROOT, "_site");

test.before(() => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], { cwd: ROOT, stdio: "pipe", timeout: 120_000 });
  rmSync(SITE, { recursive: true, force: true });
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "stage_site.mjs")], { cwd: ROOT, stdio: "pipe", timeout: 60_000 });
});

test("el staging copia las páginas fijas", () => {
  for (const file of ["index.html", "404.html", "sitemap.xml", "robots.txt"]) {
    assert.ok(existsSync(path.join(SITE, file)), `_site/${file} ausente`);
  }
});

test("el staging copia todas las guías", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const rel = pagePath(project.slug, page.slug).replace(/^\//, "");
      assert.ok(existsSync(path.join(SITE, rel, "index.html")), `_site/${rel}index.html ausente`);
    }
  }
  assert.ok(existsSync(path.join(SITE, "projects", "index.html")), "_site/projects/ ausente");
});

test("el staging copia los recursos que se sirven", () => {
  for (const rel of [
    "assets/css/style.css",
    "assets/js/main.js",
    "assets/js/i18n.js",
    "assets/js/search.js",
    "assets/img/icons.svg",
    "assets/data/search-index.json",
  ]) {
    assert.ok(existsSync(path.join(SITE, rel)), `_site/${rel} ausente`);
  }
});

test("el payload no arrastra código fuente ni dependencias", () => {
  for (const forbidden of ["node_modules", "content", "scripts", "tests", "package.json", "package-lock.json", ".github", ".gitignore", ".git"]) {
    assert.ok(!existsSync(path.join(SITE, forbidden)), `_site/ no debería contener ${forbidden}`);
  }
});

test("el Sitemap declarado en robots.txt es el que de verdad se publica", () => {
  // CANONICAL_ORIGIN ya incluye BASE: añadirlo otra vez produjo
  // https://jaime-gaming.github.io/Docs/Docs/sitemap.xml, que es un 404.
  const robots = readFileSync(path.join(SITE, "robots.txt"), "utf8");
  const declarado = (robots.match(/^Sitemap:\s*(\S+)$/m) || [])[1];
  assert.ok(declarado, "robots.txt sin línea Sitemap");

  const sitemap = readFileSync(path.join(SITE, "sitemap.xml"), "utf8");
  const raiz = (sitemap.match(/<loc>([^<]+\/)<\/loc>/) || [])[1];
  assert.ok(raiz, "sitemap.xml sin URL raíz");

  assert.equal(declarado, `${raiz}sitemap.xml`);
  assert.ok(!declarado.includes(`${BASE}${BASE.replace(/\/$/, "")}`), "BASE duplicado en la URL");
});

test("el payload no tiene archivos sueltos fuera de lo esperado", () => {
  const allowed = new Set([
    "index.html",
    "404.html",
    "sitemap.xml",
    "robots.txt",
    "assets",
    "projects",
    "status",
    ...PROJECTS.map((project) => project.slug),
  ]);
  const unexpected = readdirSync(SITE).filter((name) => !allowed.has(name));
  assert.deepEqual(unexpected, [], "entradas inesperadas en _site/");
});

test("las rutas del payload son relativas a la raíz de Pages", () => {
  // Dentro de _site/ los href deben llevar BASE: si apuntaran a "/" a secas,
  // en https://jaime-gaming.github.io/Docs/ no resolverían.
  const html = readFileSync(path.join(SITE, "wave", "index.html"), "utf8");
  assert.match(html, /href="\/Docs\/assets\/css\/style\.css\?v=[0-9a-f]{12}"/);
  assert.match(html, /href="\/Docs\/assets\/img\/icons\.svg\?v=[0-9a-f]{12}#icon-/);
  assert.ok(!html.includes('href="/assets/'), "hay una referencia a assets sin BASE");
});

test("el índice de búsqueda del payload es JSON válido", () => {
  const index = JSON.parse(readFileSync(path.join(SITE, "assets", "data", "search-index.json"), "utf8"));
  assert.ok(index.count === index.entries.length && index.count > 500, `índice inesperado: ${index.count}`);
});
