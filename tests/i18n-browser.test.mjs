/**
 * El conmutador de idioma, ejecutado de verdad.
 *
 * Las demás pruebas comprueban que los datos de traducción están completos.
 * Esta ejecuta assets/js/i18n.js dentro de una página generada con jsdom y
 * pulsa el botón: es la que detecta que el inglés no se aplique al cuerpo, al
 * título, a las fechas o al aria-label.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { JSDOM } from "jsdom";

import { BASE } from "../scripts/config.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const I18N_SOURCE = readFileSync(path.join(ROOT, "assets", "js", "i18n.js"), "utf8");
const PAGE = `${BASE}wave/install/`;
const PAGE_FILE = "wave/install/index.html";

test.before(() => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], { cwd: ROOT, stdio: "pipe", timeout: 120_000 });
});

/**
 * Carga una página generada y arranca i18n.js como lo haría el navegador.
 * jsdom ya disparó DOMContentLoaded al parsear, así que se vuelve a disparar
 * para que el script ejecute su inicialización.
 */
function loadPage({ savedLang = null, browserLang = "es-ES", url = `https://jaime-gaming.github.io${PAGE}` } = {}) {
  const html = readFileSync(path.join(ROOT, PAGE_FILE), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url });
  const { window } = dom;

  if (savedLang) window.localStorage.setItem("lang", savedLang);
  Object.defineProperty(window.navigator, "language", { value: browserLang, configurable: true });

  window.eval(I18N_SOURCE);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  return window;
}

const translations = (window) => JSON.parse(window.document.getElementById("pageTranslations").textContent);

/**
 * Al asignar innerHTML el navegador re-serializa y normaliza entidades
 * (&#39; -> '), así que las comparaciones se hacen contra el HTML ya
 * normalizado y no contra la cadena cruda del JSON.
 */
function normalized(window, html) {
  const probe = window.document.createElement("div");
  probe.innerHTML = html;
  return probe.innerHTML;
}

test("arranca en el idioma guardado y pinta su cuerpo", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;

  assert.equal(doc.documentElement.lang, "es");
  assert.equal(doc.getElementById("langSwitch").getAttribute("data-active"), "es");
  assert.equal(doc.getElementById("languageName").textContent, "Español");
  assert.equal(window.currentLang, "es");
  assert.equal(doc.querySelector(".doc-body").getAttribute("lang"), "es");
  assert.equal(doc.querySelector(".doc-body").innerHTML, normalized(window, translations(window).es.fields.body));
});

test("pulsar el conmutador cambia a inglés todo lo visible", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;

  doc.getElementById("langSwitch").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  const en = translations(window).en;
  assert.equal(doc.documentElement.lang, "en");
  assert.equal(window.currentLang, "en");
  assert.equal(doc.getElementById("langSwitch").getAttribute("data-active"), "en");
  assert.equal(doc.getElementById("languageName").textContent, "English");

  // El cuerpo de la guía se sustituye entero, no solo los textos sueltos.
  const body = doc.querySelector(".doc-body");
  assert.equal(body.innerHTML, normalized(window, en.fields.body));
  assert.equal(body.getAttribute("lang"), "en");

  // Y con él la descripción, el tiempo de lectura y el enlace de editar.
  assert.equal(doc.querySelector('[data-content-key="desc"]').textContent, en.fields.desc);
  assert.equal(doc.querySelector('[data-content-key="readtime"]').textContent, en.fields.readtime);
  assert.equal(doc.querySelector('[data-content-key="editHref"]').getAttribute("href"), en.fields.editHref);
  assert.match(en.fields.editHref, /\.en\.md$/, "el enlace de editar debe apuntar al Markdown en inglés");

  // Título, metadatos y accesibilidad.
  assert.equal(doc.title, en.title);
  assert.equal(doc.querySelector('meta[property="og:locale"]').content, "en_US");
  assert.equal(doc.querySelector('meta[property="og:title"]').content, en.title);
  assert.equal(doc.querySelector('meta[name="description"]').content, en.description);
  // El enlace de salto lleva data-i18n (no data-i18n-aria): su nombre accesible
  // es su propio texto, así que lo que hay que comprobar es el contenido.
  assert.equal(doc.querySelector(".skip-link").textContent, window.i18n.dict.en["aria.skipToContent"]);
  assert.equal(doc.querySelector(".skip-link").textContent, "Skip to content");

  // La preferencia queda guardada para la próxima visita.
  assert.equal(window.localStorage.getItem("lang"), "en");
});

test("el índice lateral también se traduce al pulsar", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;
  const esToc = doc.querySelector("#docsToc").innerHTML;

  doc.getElementById("langSwitch").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  const toc = doc.querySelector("#docsToc");
  const enToc = toc.innerHTML;
  assert.notEqual(enToc, esToc, "el índice lateral no cambió de idioma");
  assert.equal(enToc, normalized(window, translations(window).en.fields.toc));
  assert.equal(toc.getAttribute("lang"), "en");

  const links = [...doc.querySelectorAll("#docsToc .toc__list a")];
  assert.ok(links.length > 2, "el índice se quedó sin entradas");
  // Regresión: los anclajes del índice deben existir en el cuerpo traducido.
  // Antes el TOC seguía en español y apuntaba a ids que ya no estaban.
  for (const link of links) {
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    assert.ok(doc.getElementById(id), `ancla muerta en el índice inglés: #${id}`);
  }
  assert.ok(links.every((link) => /[a-z]/i.test(link.textContent)), "entradas del índice vacías");
  assert.ok(!doc.querySelector('#docsToc .toc__list a[href="#en-el-navegador"]'), "queda un anclaje en español");
});

test("las fechas se localizan con Intl", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;
  const time = doc.querySelector("time[data-i18n-date]");
  const esText = time.textContent;

  doc.getElementById("langSwitch").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  assert.match(esText, /de\s+\w+\s+de\s+\d{4}/, `fecha en español inesperada: ${esText}`);
  assert.match(time.textContent, /^\w+ \d{1,2}, \d{4}$/, `fecha en inglés inesperada: ${time.textContent}`);
  assert.notEqual(time.textContent, esText);
});

test("volver a pulsar devuelve el español", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;
  const original = doc.querySelector(".doc-body").innerHTML;

  for (let i = 0; i < 2; i += 1) {
    doc.getElementById("langSwitch").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  }

  assert.equal(window.currentLang, "es");
  assert.equal(doc.querySelector(".doc-body").innerHTML, original);
  assert.equal(window.localStorage.getItem("lang"), "es");
});

test("un navegador en inglés y sin preferencia arranca en inglés", () => {
  const window = loadPage({ browserLang: "en-US" });
  assert.equal(window.currentLang, "en");
  assert.equal(window.document.documentElement.lang, "en");
  assert.equal(window.document.querySelector(".doc-body").innerHTML, normalized(window, translations(window).en.fields.body));
});

test("un idioma de navegador no soportado cae en inglés", () => {
  const window = loadPage({ browserLang: "de-DE" });
  assert.equal(window.currentLang, "en", "el orden es: guardado → navegador → inglés");
});

test("la preferencia guardada gana sobre el idioma del navegador", () => {
  const window = loadPage({ savedLang: "es", browserLang: "en-US" });
  assert.equal(window.currentLang, "es");
});

test("otra pestaña abierta cambia el idioma a la vez", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;

  window.dispatchEvent(
    Object.assign(new window.Event("storage"), { key: "lang", newValue: "en" }),
  );

  assert.equal(window.currentLang, "en");
  assert.equal(doc.querySelector(".doc-body").innerHTML, normalized(window, translations(window).en.fields.body));
  // El evento viene de fuera: no debe reescribir el almacenamiento.
  assert.equal(window.localStorage.getItem("lang"), "es");
});

test("un idioma desconocido en el evento storage se ignora", () => {
  const window = loadPage({ savedLang: "es" });
  window.dispatchEvent(Object.assign(new window.Event("storage"), { key: "lang", newValue: "fr" }));
  assert.equal(window.currentLang, "es");
});

test("los avisos del cuerpo en inglés llevan su icono", () => {
  // Regresión: el HTML inglés viaja dentro del JSON #pageTranslations, donde el
  // expandIcons() del layout no lo veía y los callouts perdían el icono.
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;
  doc.getElementById("langSwitch").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  const callouts = doc.querySelectorAll(".doc-body .callout");
  assert.ok(callouts.length > 0, "la página de prueba debería tener algún aviso");
  for (const callout of callouts) {
    assert.ok(callout.querySelector("svg use"), `aviso sin icono: ${callout.className}`);
    assert.ok(!callout.querySelector("[data-icon]"), "quedó un span data-icon sin expandir");
    assert.match(callout.querySelector("use").getAttribute("href"), new RegExp(`^${BASE}assets/img/icons\\.svg\\?v=[0-9a-f]{12}#icon-`));
  }
});

test("el cuerpo en inglés no arrastra texto en español", () => {
  const window = loadPage({ savedLang: "es" });
  const doc = window.document;
  doc.getElementById("langSwitch").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  const text = doc.querySelector(".doc-body").textContent;
  for (const spanish of ["Instalación", "Qué hace", "Para qué", "Cómo está hecho", "Recorrido de la guía"]) {
    assert.ok(!text.includes(spanish), `el cuerpo en inglés contiene «${spanish}»`);
  }
  assert.match(doc.querySelector(".doc-head__title").textContent, /Install/i);
});
