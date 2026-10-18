/**
 * Paridad de los diccionarios de interfaz.
 *
 * El conmutador de idioma sustituye cada nodo con data-i18n por su valor del
 * diccionario. Si una clave existe solo en un idioma, al cambiar de lengua ese
 * texto se queda en blanco: es un fallo silencioso y muy visible a la vez.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { DICT } from "../scripts/dict.mjs";
import { UI } from "../content/ui.mjs";
import { GROUPS, PROJECTS } from "../scripts/registry.mjs";
import { LANGUAGES } from "../scripts/config.mjs";
import { ALERTS } from "../scripts/markdown.mjs";

test("los dos idiomas tienen exactamente las mismas claves de interfaz", () => {
  const es = Object.keys(UI.es).sort();
  const en = Object.keys(UI.en).sort();
  assert.deepEqual(en, es, "content/ui.mjs: claves es/en distintas");
  assert.ok(es.length > 80, `solo ${es.length} claves: el diccionario parece incompleto`);
});

test("ninguna clave tiene un valor vacío", () => {
  for (const lang of LANGUAGES) {
    for (const [key, value] of Object.entries(UI[lang])) {
      assert.equal(typeof value, "string", `${lang}.${key} no es texto`);
      assert.ok(value.trim(), `${lang}.${key} está vacío`);
    }
  }
});

test("el diccionario derivado cubre proyectos, páginas y grupos", () => {
  for (const lang of LANGUAGES) {
    for (const project of PROJECTS) {
      for (const key of [`proj.${project.slug}.name`, `proj.${project.slug}.tagline`, `proj.${project.slug}.summary`, `proj.${project.slug}.status`]) {
        assert.ok(DICT[lang][key]?.trim(), `falta ${lang}: ${key}`);
      }
      for (const page of project.pages) {
        assert.ok(DICT[lang][`page.${project.slug}.${page.slug}`]?.trim(), `falta ${lang}: page.${project.slug}.${page.slug}`);
      }
    }
    for (const group of GROUPS) {
      assert.ok(DICT[lang][`group.${group.slug}.title`]?.trim(), `falta ${lang}: group.${group.slug}.title`);
      assert.ok(DICT[lang][`group.${group.slug}.sub`]?.trim(), `falta ${lang}: group.${group.slug}.sub`);
    }
  }
});

test("el diccionario derivado conserva la paridad entre idiomas", () => {
  assert.deepEqual(Object.keys(DICT.en).sort(), Object.keys(DICT.es).sort(), "DICT: claves es/en distintas");
});

test("los nombres de proyecto no se traducen (son nombres propios)", () => {
  for (const project of PROJECTS) {
    assert.equal(DICT.en[`proj.${project.slug}.name`], project.name);
    assert.equal(DICT.es[`proj.${project.slug}.name`], project.name);
  }
});

test("las claves de aviso están en los dos idiomas", () => {
  // Derivado de ALERTS: si se añade un aviso nuevo, esta prueba lo exige sola.
  for (const lang of LANGUAGES) {
    for (const key of Object.values(ALERTS).map((alert) => alert.key)) {
      assert.ok(DICT[lang][key]?.trim(), `falta ${lang}: ${key}`);
    }
  }
});

test("ninguna etiqueta de aviso comparte título con otra", () => {
  // [!IMPORTANT] y [!CAUTION] llegaron a renderizar ambos «Importante».
  for (const lang of LANGUAGES) {
    const titulos = Object.values(ALERTS).map((alert) => DICT[lang][alert.key]);
    assert.equal(new Set(titulos).size, titulos.length, `títulos repetidos en ${lang}: ${titulos.join(", ")}`);
  }
});

test("ninguna clave se repite con valores distintos entre UI y derivados", () => {
  // Las claves derivadas (proj.*, page.*, group.*) no deben pisar las de UI.
  const collisions = Object.keys(UI.es).filter((key) => /^(proj|page|group)\./.test(key));
  assert.deepEqual(collisions, [], "content/ui.mjs declara claves reservadas al registro");
});
