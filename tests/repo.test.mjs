/**
 * Higiene del repositorio.
 *
 * Cubre dos fallos que ya ocurrieron y que no se ven en el navegador: un
 * .gitignore que se come el contenido fuente y un README sin escribir.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { LANGUAGES, PROJECTS } from "../scripts/registry.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS_DIR = path.join(ROOT, "content", "docs");

/** Líneas activas de un .gitignore (sin comentarios ni vacíos). */
function ignoreRules() {
  return readFileSync(path.join(ROOT, ".gitignore"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

test("los .gitignore de salida generada están anclados a la raíz", () => {
  // Un patrón sin "/" inicial coincide en cualquier nivel: "wave/" ignoraría
  // también content/docs/wave/, dejando el sitio sin contenido en el repo.
  const allowed = new Set(["node_modules/", "*.log", ".DS_Store"]);
  const unanchored = ignoreRules().filter((rule) => !rule.startsWith("/") && !allowed.has(rule));
  assert.deepEqual(unanchored, [], "reglas de .gitignore sin anclar");
});

test("git no ignora ningún Markdown de contenido", () => {
  const files = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      files.push(`content/docs/${project.slug}/${page.slug}.md`);
      files.push(`content/docs/${project.slug}/${page.slug}.en.md`);
    }
  }
  // Derivado del registro, no escrito a mano: añadir una guía no debe romper
  // esta prueba, y si el registro y los idiomas no cuadran, sí debe.
  const esperados = PROJECTS.reduce(
    (total, project) => total + project.pages.length * LANGUAGES.length,
    0
  );
  assert.equal(files.length, esperados, "debe haber un archivo por guía e idioma");

  let ignored = "";
  try {
    // check-ignore sale con 1 si nada coincide: no es un error aquí.
    ignored = execFileSync("git", ["check-ignore", "--stdin"], {
      cwd: ROOT,
      input: files.join("\n"),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    ignored = error.stdout ?? "";
    if (error.status !== 1 && error.status !== 0) throw error;
  }
  assert.equal(ignored.trim(), "", "git ignora contenido fuente");
});

test("git sí ignora la salida generada", () => {
  const generated = ["index.html", "404.html", "sitemap.xml", "_site/index.html", "projects/index.html", "wave/index.html", "assets/data/search-index.json", "assets/img/icons.svg"];
  let ignored = "";
  try {
    ignored = execFileSync("git", ["check-ignore", "--stdin"], {
      cwd: ROOT,
      input: generated.join("\n"),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    ignored = error.stdout ?? "";
    if (error.status !== 1 && error.status !== 0) throw error;
  }
  const found = new Set(ignored.trim().split("\n").filter(Boolean));
  for (const file of generated) {
    assert.ok(found.has(file), `${file} debería estar ignorado`);
  }
});

test("los assets fuente no se confunden con los generados", () => {
  for (const file of ["assets/css/style.css", "assets/js/main.js", "assets/js/i18n.js", "assets/js/search.js", "assets/img/favicon.svg"]) {
    let ignored = "";
    try {
      ignored = execFileSync("git", ["check-ignore", file], { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      ignored = error.stdout ?? "";
    }
    assert.equal(ignored.trim(), "", `${file} no debería estar ignorado`);
  }
});

test("el README describe el proyecto de verdad", () => {
  const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
  assert.ok(readme.length > 1500, `README de ${readme.length} caracteres: sigue siendo el esbozo`);
  assert.ok(!/^#\s*Docs\s*$/m.test(readme), "el README sigue siendo solo el título");
  for (const needle of ["npm run build", "npm test", "github.io/Docs", "registry.mjs", "content/docs"]) {
    assert.ok(readme.includes(needle), `al README le falta mencionar ${needle}`);
  }
  for (const project of PROJECTS) {
    assert.ok(readme.includes(project.name), `al README le falta el proyecto ${project.name}`);
  }

  // Las cifras declaradas se pudren en cuanto se añade una guía: llegaron a
  // decir 37 cuando el registro ya llevaba 40. Se derivan del registro.
  const guias = PROJECTS.reduce((total, project) => total + project.pages.length, 0);
  const declarado = readme.match(/\|\s*Guías\s*\|\s*(\d+)\s*\((\d+)\s*páginas/);
  assert.ok(declarado, 'el README debe declarar «| Guías | N (M páginas…»');
  assert.equal(Number(declarado[1]), guias, `el README dice ${declarado[1]} guías y el registro lleva ${guias}`);
  assert.equal(Number(declarado[2]), guias * LANGUAGES.length,
    `el README dice ${declarado[2]} páginas y son ${guias * LANGUAGES.length}`);

  // El número de pruebas no se declara: cambia cada dos commits y nadie lo actualiza.
  assert.ok(!/npm test\s*#\s*\d+\s*pruebas/.test(readme),
    "el README vuelve a hardcodear cuántas pruebas hay");
});

test("cada proyecto documentado existe en disco con sus dos idiomas", () => {
  const missing = [];
  for (const project of PROJECTS) {
    const dir = path.join(DOCS_DIR, project.slug);
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      missing.push(`content/docs/${project.slug}/ (carpeta ausente)`);
      continue;
    }
    const md = entries.filter((name) => name.endsWith(".md"));
    const en = md.filter((name) => name.endsWith(".en.md"));
    if (md.length !== project.pages.length * 2) {
      missing.push(`${project.slug}: ${md.length} Markdown para ${project.pages.length} páginas`);
    }
    if (en.length !== project.pages.length) {
      missing.push(`${project.slug}: ${en.length} versiones en inglés de ${project.pages.length}`);
    }
  }
  assert.deepEqual(missing, [], "contenido incompleto");
});
