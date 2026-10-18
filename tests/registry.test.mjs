/**
 * Invariantes del registro de proyectos.
 *
 * El registro es la única fuente de verdad del sitio: si una entrada está mal,
 * el build falla o —peor— genera una página rota. Estas pruebas lo verifican
 * sin llegar a construir nada.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { GROUPS, PROJECTS, groupOf, pagePath, projectBySlug } from "../scripts/registry.mjs";
import { LANGUAGES } from "../scripts/registry.mjs";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

test("hay siete proyectos y sus slugs son únicos", () => {
  assert.equal(PROJECTS.length, 7);
  const slugs = PROJECTS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("todos los slugs tienen forma de URL", () => {
  for (const project of PROJECTS) {
    assert.match(project.slug, SLUG_RE, `slug de proyecto: ${project.slug}`);
    for (const page of project.pages) {
      assert.match(page.slug, SLUG_RE, `${project.slug}/${page.slug}`);
    }
  }
});

test("cada proyecto declara los campos que el layout necesita", () => {
  for (const project of PROJECTS) {
    for (const field of ["slug", "repo", "name", "icon", "language", "status", "tagline", "summary", "pages"]) {
      assert.ok(project[field], `${project.slug}: falta "${field}"`);
    }
    assert.ok(Array.isArray(project.pages) && project.pages.length > 0, `${project.slug}: sin páginas`);
    assert.equal(project.pages[0].slug, "index", `${project.slug}: la primera página debe ser index`);
  }
});

test("todos los textos bilingües están en ambos idiomas", () => {
  for (const lang of LANGUAGES) {
    for (const project of PROJECTS) {
      for (const field of ["status", "tagline", "summary"]) {
        const value = project[field]?.[lang];
        assert.ok(typeof value === "string" && value.trim(), `${project.slug}.${field}.${lang}`);
      }
      for (const page of project.pages) {
        assert.ok(page.title?.[lang]?.trim(), `${project.slug}/${page.slug} title.${lang}`);
      }
    }
    for (const group of GROUPS) {
      assert.ok(group.title?.[lang]?.trim(), `group ${group.slug} title.${lang}`);
      assert.ok(group.sub?.[lang]?.trim(), `group ${group.slug} sub.${lang}`);
    }
  }
});

test("los slugs de página no se repiten dentro de un proyecto", () => {
  for (const project of PROJECTS) {
    const slugs = project.pages.map((p) => p.slug);
    assert.equal(new Set(slugs).size, slugs.length, project.slug);
  }
});

test("projectBySlug y groupOf resuelven lo declarado", () => {
  for (const project of PROJECTS) {
    assert.equal(projectBySlug(project.slug), project);
    const group = groupOf(project.slug);
    assert.ok(group, `${project.slug} no pertenece a ningún grupo`);
    assert.ok(group.projects.includes(project.slug));
  }
  assert.equal(projectBySlug("no-existe"), undefined);
  assert.equal(groupOf("no-existe"), undefined);
});

test("los grupos cubren todos los proyectos sin duplicarlos", () => {
  const assigned = GROUPS.flatMap((g) => g.projects);
  assert.equal(new Set(assigned).size, assigned.length, "hay un proyecto en dos grupos");
  assert.deepEqual(
    [...assigned].sort(),
    PROJECTS.map((p) => p.slug).sort(),
    "los grupos y el registro no coinciden",
  );
});

test("pagePath construye rutas con barra final", () => {
  assert.equal(pagePath("wave", "index"), "/wave/");
  assert.equal(pagePath("wave", "install"), "/wave/install/");
  assert.equal(pagePath("rngdle-infinite", "faq"), "/rngdle-infinite/faq/");
});

test("los demos y licencias declarados son plausibles", () => {
  for (const project of PROJECTS) {
    if (project.demo) {
      assert.match(project.demo, /^https:\/\//, `${project.slug}: demo sin https`);
    }
    if (project.license) {
      assert.ok(typeof project.license === "string", `${project.slug}: licencia no textual`);
    }
  }
});
