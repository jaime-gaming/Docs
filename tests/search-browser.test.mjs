/**
 * La búsqueda (Ctrl+K), ejecutada de verdad.
 *
 * Carga una página generada en jsdom con sus propios scripts y usa el índice
 * real del build: abre con Ctrl+K, escribe, se mueve con las flechas y entra.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { BASE } from "../scripts/config.mjs";
import { clickLangSwitch, loadPage, settle } from "./helpers/browser.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAGE = "wave/install/index.html";
const PAGE_URL = `${BASE}wave/install/`;

test.before(() => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], { cwd: ROOT, stdio: "pipe", timeout: 120_000 });
});

/** Abre el modal, escribe y espera al debounce. */
async function search(env, query) {
  const { window, doc } = env;
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  await settle();
  const input = doc.getElementById("searchInput");
  input.value = query;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await settle();
  return [...doc.querySelectorAll(".search-result")];
}

const urlsOf = (nodes) => nodes.map((node) => node.getAttribute("data-url"));
const projectOf = (url) => url.replace(BASE, "").split("/")[0];

test("el modal arranca cerrado y se abre con Ctrl+K", async () => {
  const env = await loadPage({ page: PAGE });
  const modal = env.doc.getElementById("searchModal");
  assert.equal(modal.hidden, true, "el modal debería empezar cerrado");

  env.doc.dispatchEvent(new env.window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  await settle();

  assert.equal(modal.hidden, false, "Ctrl+K no abrió el buscador");
  assert.equal(env.doc.activeElement.id, "searchInput", "el foco debe ir al campo");
  assert.match(modal.textContent, /Prueba con|instalar/i, "sin texto de estado vacío");
});

test("también se abre con la tecla / y con el botón de la cabecera", async () => {
  const bySlash = await loadPage({ page: PAGE });
  bySlash.doc.dispatchEvent(new bySlash.window.KeyboardEvent("keydown", { key: "/", bubbles: true }));
  assert.equal(bySlash.doc.getElementById("searchModal").hidden, false, "/ no abrió el buscador");

  const byClick = await loadPage({ page: PAGE });
  byClick.doc.getElementById("searchTrigger").dispatchEvent(new byClick.window.MouseEvent("click", { bubbles: true }));
  assert.equal(byClick.doc.getElementById("searchModal").hidden, false, "el botón no abrió el buscador");
});

test("Ctrl+K con el modal abierto lo cierra y desbloquea el scroll", async () => {
  const env = await loadPage({ page: PAGE });
  const { window, doc } = env;
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  await settle();
  assert.equal(doc.getElementById("searchModal").hidden, false);

  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  assert.equal(doc.getElementById("searchModal").hidden, true, "Ctrl+K no lo cerró");
  assert.equal(doc.body.style.overflow, "", "el scroll del body se quedó bloqueado");
});

test("el índice se pide una vez y con BASE", async () => {
  const env = await loadPage({ page: PAGE });
  env.doc.dispatchEvent(new env.window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  await settle();

  const indexCalls = env.requested.filter((url) => url.includes("search-index.json"));
  assert.equal(indexCalls.length, 1, "debería pedirse el índice una sola vez");
  assert.equal(indexCalls[0], `${BASE}assets/data/search-index.json`);
});

test("buscar devuelve resultados resaltados y navegables", async () => {
  const env = await loadPage({ page: PAGE });
  const results = await search(env, "instalación");

  assert.ok(results.length > 3, `solo ${results.length} resultados para «instalación»`);
  assert.ok(results.length <= 30, "el listado debería estar acotado a 30");

  const first = results[0];
  assert.equal(first.getAttribute("aria-selected"), "true", "el primer resultado debe salir seleccionado");
  assert.equal(first.getAttribute("role"), "option");
  assert.match(first.innerHTML, /<mark>/i, "el término no se resalta");
  assert.ok(urlsOf(results).every((url) => url.startsWith(BASE)), "hay una URL fuera de BASE");
  assert.match(env.doc.getElementById("searchResults").getAttribute("aria-label"), /^\d+ /, "sin recuento accesible");
});

test("el resaltado no depende de los acentos", async () => {
  const env = await loadPage({ page: PAGE });
  const results = await search(env, "instalacion");

  assert.ok(results.length > 0, "la consulta sin acentos no dio resultados");
  const highlighted = results.filter((node) => /<mark>/i.test(node.innerHTML));
  assert.ok(highlighted.length > 0, "ningún resultado llevó <mark>");
  // «instalacion» debe resaltar «Instalación» tal cual se escribe en la página.
  assert.match(highlighted[0].innerHTML, /<mark>Instalaci[oó]n<\/mark>/i);
});

test("la búsqueda no depende de los acentos", async () => {
  const env = await loadPage({ page: PAGE });
  const withAccent = await search(env, "instalación");

  const env2 = await loadPage({ page: PAGE });
  const withoutAccent = await search(env2, "instalacion");

  assert.ok(withAccent.length > 0 && withoutAccent.length > 0, "alguna variante no dio resultados");
  assert.deepEqual(urlsOf(withoutAccent), urlsOf(withAccent), "los acentos cambiaron el resultado");
});

test("todas las palabras de la consulta deben aparecer", async () => {
  const env = await loadPage({ page: PAGE });
  const both = await search(env, "wave privacidad");
  assert.ok(both.length > 0, "una consulta de dos términos válidos no dio nada");
  for (const url of urlsOf(both)) assert.equal(projectOf(url), "wave", `resultado fuera de Wave: ${url}`);

  const env2 = await loadPage({ page: PAGE });
  const impossible = await search(env2, "wave zzzzqqqq");
  assert.equal(impossible.length, 0, "un término imposible debería descartarlo todo");
  assert.match(env2.doc.getElementById("searchResults").textContent, /Sin resultados|zzzzqqqq/i);
});

test("los resultados son del idioma activo", async () => {
  const es = await loadPage({ page: PAGE, lang: "es" });
  const esResults = await search(es, "privacy");

  const en = await loadPage({ page: PAGE, lang: "en" });
  const enResults = await search(en, "privacy");

  assert.ok(enResults.length > 0, "en inglés «privacy» debería dar resultados");
  for (const node of enResults) {
    assert.equal(node.textContent.includes("Privacidad"), false, "aparece texto español en el modo inglés");
  }
  assert.notDeepEqual(urlsOf(enResults), urlsOf(esResults), "los dos idiomas devuelven lo mismo");
});

test("una guía ofrece limitar la búsqueda a su proyecto", async () => {
  const env = await loadPage({ page: PAGE });
  const toggle = env.doc.querySelector("#searchModalHint .scope-toggle");
  assert.ok(toggle, "falta el conmutador de alcance en una guía");
  assert.equal(toggle.getAttribute("aria-pressed"), "false");
  assert.match(toggle.textContent, /Toda la documentación/i);

  const all = await search(env, "instalación");
  const projects = new Set(urlsOf(all).map(projectOf));
  assert.ok(projects.size > 1, `sin limitar debería salir más de un proyecto: ${[...projects]}`);

  toggle.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  assert.match(toggle.textContent, /Solo este proyecto/i);

  const input = env.doc.getElementById("searchInput");
  input.dispatchEvent(new env.window.Event("input", { bubbles: true }));
  await settle();

  const scoped = [...env.doc.querySelectorAll(".search-result")];
  assert.ok(scoped.length > 0, "al limitar no quedó ningún resultado");
  for (const url of urlsOf(scoped)) assert.equal(projectOf(url), "wave", `fuera de alcance: ${url}`);
});

test("las flechas mueven la selección y Enter navega", async () => {
  const env = await loadPage({ page: PAGE });
  const { window, doc } = env;
  const results = await search(env, "wave");
  assert.ok(results.length > 2, "hacen falta varios resultados para probar las flechas");

  const input = doc.getElementById("searchInput");
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  let nodes = [...doc.querySelectorAll(".search-result")];
  assert.equal(nodes[0].getAttribute("aria-selected"), "false");
  assert.equal(nodes[1].getAttribute("aria-selected"), "true", "ArrowDown no movió la selección");

  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  nodes = [...doc.querySelectorAll(".search-result")];
  assert.equal(nodes[0].getAttribute("aria-selected"), "true", "ArrowUp no volvió al primero");

  // Se lleva la selección hasta un resultado que no sea la página actual:
  // navegar a la misma URL no cuenta como navegación ni en jsdom ni en un
  // navegador, así que no probaría nada.
  const targetIndex = urlsOf(nodes).findIndex((url) => url !== PAGE_URL);
  assert.ok(targetIndex >= 0, "hace falta un resultado que no sea la página actual");
  for (let step = 0; step < targetIndex; step += 1) {
    input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  }
  nodes = [...doc.querySelectorAll(".search-result")];
  assert.equal(nodes[targetIndex].getAttribute("aria-selected"), "true", "la selección no llegó al objetivo");

  // jsdom no navega: deja un jsdomError, que es la prueba de que goTo() se ejecutó.
  const before = env.errors.length;
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.ok(env.errors.length > before, "Enter no intentó navegar");
  assert.match(env.errors[before], /navigation/i);
});

test("la selección vuelve al principio al cambiar de consulta", async () => {
  const env = await loadPage({ page: PAGE });
  await search(env, "wave");
  const input = env.doc.getElementById("searchInput");
  input.dispatchEvent(new env.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

  input.value = "hellbot";
  input.dispatchEvent(new env.window.Event("input", { bubbles: true }));
  await settle();

  const nodes = [...env.doc.querySelectorAll(".search-result")];
  assert.ok(nodes.length > 0, "la segunda consulta no dio resultados");
  assert.equal(nodes[0].getAttribute("aria-selected"), "true", "la selección no se reinició");
});

test("hacer clic en un resultado navega a él", async () => {
  const env = await loadPage({ page: PAGE });
  const results = await search(env, "hellbot");
  assert.ok(results.length > 0, "«hellbot» debería dar resultados");

  const target = results.find((node) => node.getAttribute("data-url") !== PAGE_URL);
  assert.ok(target, "hace falta un resultado que no sea la página actual");

  const before = env.errors.length;
  target.dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
  assert.ok(env.errors.length > before, "el clic no intentó navegar");
  assert.match(env.errors[before], /navigation/i);
});

test("Escape cierra el buscador", async () => {
  const env = await loadPage({ page: PAGE });
  await search(env, "wave");
  env.doc.dispatchEvent(new env.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(env.doc.getElementById("searchModal").hidden, true);
});

test("si el índice no carga, se avisa en vez de fallar en silencio", async () => {
  const env = await loadPage({ page: PAGE, indexFails: true });
  env.doc.dispatchEvent(new env.window.KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  await settle();

  assert.match(env.doc.getElementById("searchModalHint").textContent, /No se ha podido cargar el índice/i);
  const input = env.doc.getElementById("searchInput");
  input.value = "wave";
  input.dispatchEvent(new env.window.Event("input", { bubbles: true }));
  await settle();
  assert.equal(env.doc.querySelectorAll(".search-result").length, 0, "sin índice no debería inventarse resultados");
});

test("cambiar de idioma traduce el buscador y rehace la consulta abierta", async () => {
  const env = await loadPage({ page: PAGE });
  const { window, doc } = env;
  const results = await search(env, "install");
  assert.ok(results.length > 0, "«install» debería dar resultados en español (aparece en rutas y código)");

  clickLangSwitch(env);
  await settle();

  assert.equal(window.currentLang, "en", "el conmutador no cambió de idioma con el modal abierto");
  assert.equal(doc.getElementById("searchInput").placeholder, window.i18n.dict.en["search.placeholder"]);
  const after = [...doc.querySelectorAll(".search-result")];
  assert.ok(after.length > 0, "la consulta debería seguir dando resultados en inglés");
  for (const node of after) assert.ok(node.textContent.trim().length > 0, "resultado vacío tras cambiar de idioma");
});

test("los textos del buscador salen del diccionario activo", async () => {
  const env = await loadPage({ page: PAGE, lang: "en" });
  const { doc, window } = env;
  assert.equal(doc.getElementById("searchInput").placeholder, window.i18n.dict.en["search.placeholder"]);
  assert.equal(doc.querySelector(".search-modal__close").getAttribute("aria-label"), window.i18n.dict.en["search.close"]);

  await search(env, "zzzzqqqq");
  assert.match(doc.getElementById("searchResults").textContent, /No results|zzzzqqqq/i);
});
