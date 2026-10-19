/**
 * El conmutador de idioma, ejecutado de verdad.
 *
 * Las demás pruebas comprueban que los datos de traducción están completos.
 * Esta carga una página generada en jsdom con sus propios scripts y pulsa el
 * botón: es la que detecta que el inglés no se aplique al cuerpo, al índice
 * lateral, al título, a las fechas o a los aria-label.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { BASE } from "../scripts/config.mjs";
import { clickLangSwitch, loadPage, settle } from "./helpers/browser.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAGE = "wave/install/index.html";

test.before(() => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], { cwd: ROOT, stdio: "pipe", timeout: 120_000 });
});

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

/**
 * main.js añade anclas a los encabezados y botones de copiar a los bloques de
 * código. Para comparar el cuerpo con el HTML del JSON hay que retirar antes
 * esas decoraciones, que son cosa del script y no de la traducción.
 */
function undecorated(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll(".anchor, .code-copy").forEach((extra) => extra.remove());
  return clone.innerHTML;
}

/** El observer del scrollspy se reconoce por su rootMargin. */
const spyObservers = (env) => env.observers.filter((observer) => String(observer.options?.rootMargin).includes("-88px"));

test("arranca en el idioma guardado y pinta su cuerpo", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc, window } = env;

  assert.equal(doc.documentElement.lang, "es");
  assert.equal(doc.getElementById("langSwitch").getAttribute("data-active"), "es");
  assert.equal(doc.getElementById("languageName").textContent, "Español");
  assert.equal(window.currentLang, "es");
  assert.equal(doc.querySelector(".doc-body").getAttribute("lang"), "es");
  assert.equal(undecorated(doc.querySelector(".doc-body")), normalized(window, translations(window).es.fields.body));
});

test("pulsar el conmutador cambia a inglés todo lo visible", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc, window } = env;

  clickLangSwitch(env);

  const en = translations(window).en;
  assert.equal(doc.documentElement.lang, "en");
  assert.equal(window.currentLang, "en");
  assert.equal(doc.getElementById("langSwitch").getAttribute("data-active"), "en");
  assert.equal(doc.getElementById("languageName").textContent, "English");

  // El cuerpo de la guía se sustituye entero, no solo los textos sueltos.
  const body = doc.querySelector(".doc-body");
  assert.equal(undecorated(body), normalized(window, en.fields.body));
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
  // es su propio texto.
  assert.equal(doc.querySelector(".skip-link").textContent, "Skip to content");

  // La preferencia queda guardada para la próxima visita.
  assert.equal(window.localStorage.getItem("lang"), "en");
});

test("el índice lateral también se traduce al pulsar", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc, window } = env;
  const esToc = doc.querySelector("#docsToc").innerHTML;

  clickLangSwitch(env);

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
  assert.ok(!doc.querySelector('#docsToc .toc__list a[href="#en-el-navegador"]'), "queda un anclaje en español");
});

test("el scrollspy se reinicializa sobre los encabezados traducidos", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc } = env;

  const before = spyObservers(env);
  assert.equal(before.length, 1, "debería haber un observer del índice al cargar");
  assert.ok(before[0].targets.length > 2, "el observer arrancó sin encabezados que vigilar");
  const esTargets = [...before[0].targets];

  clickLangSwitch(env);
  await settle();

  const after = spyObservers(env);
  assert.equal(after.length, 2, "el scrollspy no se reinicializó al cambiar de idioma");
  assert.equal(before[0].disconnected, true, "el observer anterior quedó conectado a nodos muertos");
  assert.deepEqual(before[0].targets, [], "el observer anterior no se vació");

  const current = after[1];
  assert.ok(current.targets.length > 2, "el nuevo observer se quedó sin encabezados");
  // Los encabezados vigilados son los del cuerpo en inglés, no los de antes.
  assert.deepEqual(current.targets, [...doc.querySelectorAll(".doc-body h2[id], .doc-body h3[id]")].slice(0, current.targets.length));
  assert.ok(!current.targets.some((node) => esTargets.includes(node)), "sigue observando encabezados del español");
});

test("los encabezados traducidos recuperan su ancla", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc } = env;
  assert.ok(doc.querySelectorAll(".doc-body h2[id] .anchor").length > 0, "los encabezados en español no tienen ancla");

  clickLangSwitch(env);
  await settle();

  const headings = [...doc.querySelectorAll(".doc-body h2[id], .doc-body h3[id]")];
  assert.ok(headings.length > 2, "el cuerpo en inglés se quedó sin encabezados");
  for (const heading of headings) {
    assert.ok(heading.querySelector(".anchor"), `encabezado inglés sin ancla: #${heading.id}`);
    assert.equal(heading.querySelector(".anchor").getAttribute("href"), `#${heading.id}`);
  }
});

test("las tablas y los bloques de código siguen decorados en inglés", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc } = env;

  clickLangSwitch(env);
  await settle();

  const tables = [...doc.querySelectorAll(".doc-body table")];
  if (tables.length) {
    for (const table of tables) {
      assert.ok(table.parentElement.classList.contains("doc-table"), "tabla sin envoltorio desplazable");
    }
  }
  for (const block of doc.querySelectorAll(".doc-body pre")) {
    assert.ok(block.querySelector(".code-copy"), "bloque de código sin botón de copiar");
    assert.match(block.querySelector(".code-copy").getAttribute("aria-label"), /Copy/i, "aria-label sin traducir");
  }
});

test("las fechas se localizan con Intl", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc } = env;
  const time = doc.querySelector("time[data-i18n-date]");
  const esText = time.textContent;

  clickLangSwitch(env);

  assert.match(esText, /de\s+\w+\s+de\s+\d{4}/, `fecha en español inesperada: ${esText}`);
  assert.match(time.textContent, /^\w+ \d{1,2}, \d{4}$/, `fecha en inglés inesperada: ${time.textContent}`);
  assert.notEqual(time.textContent, esText);
});

test("volver a pulsar devuelve el español", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc, window } = env;
  const original = doc.querySelector(".doc-body").innerHTML;

  clickLangSwitch(env);
  await settle();
  clickLangSwitch(env);
  await settle();

  assert.equal(window.currentLang, "es");
  assert.equal(doc.querySelector(".doc-body").innerHTML, original);
  assert.equal(window.localStorage.getItem("lang"), "es");
  assert.equal(doc.querySelector("#docsToc").getAttribute("lang"), "es");
});

test("un navegador en inglés y sin preferencia arranca en inglés", async () => {
  const env = await loadPage({ page: PAGE, lang: null, browserLang: "en-US" });
  const { doc, window } = env;
  assert.equal(window.currentLang, "en");
  assert.equal(doc.documentElement.lang, "en");
  assert.equal(undecorated(doc.querySelector(".doc-body")), normalized(window, translations(window).en.fields.body));
});

test("un idioma de navegador no soportado cae en inglés", async () => {
  const env = await loadPage({ page: PAGE, lang: null, browserLang: "de-DE" });
  assert.equal(env.window.currentLang, "en", "el orden es: guardado → navegador → inglés");
});

test("la preferencia guardada gana sobre el idioma del navegador", async () => {
  const env = await loadPage({ page: PAGE, lang: "es", browserLang: "en-US" });
  assert.equal(env.window.currentLang, "es");
});

test("otra pestaña abierta cambia el idioma a la vez", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc, window } = env;

  window.dispatchEvent(Object.assign(new window.Event("storage"), { key: "lang", newValue: "en" }));
  await settle();

  assert.equal(window.currentLang, "en");
  assert.equal(undecorated(doc.querySelector(".doc-body")), normalized(window, translations(window).en.fields.body));
  // El evento viene de fuera: no debe reescribir el almacenamiento.
  assert.equal(window.localStorage.getItem("lang"), "es");
});

test("un idioma desconocido en el evento storage se ignora", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  env.window.dispatchEvent(Object.assign(new env.window.Event("storage"), { key: "lang", newValue: "fr" }));
  await settle();
  assert.equal(env.window.currentLang, "es");
});

test("los avisos del cuerpo en inglés llevan su icono", async () => {
  // Regresión: el HTML inglés viaja dentro del JSON #pageTranslations, donde el
  // expandIcons() del layout no lo veía y los callouts perdían el icono.
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc } = env;
  clickLangSwitch(env);
  await settle();

  const callouts = doc.querySelectorAll(".doc-body .callout");
  assert.ok(callouts.length > 0, "la página de prueba debería tener algún aviso");
  for (const callout of callouts) {
    assert.ok(callout.querySelector("svg use"), `aviso sin icono: ${callout.className}`);
    assert.ok(!callout.querySelector("[data-icon]"), "quedó un span data-icon sin expandir");
    assert.match(callout.querySelector("use").getAttribute("href"), new RegExp(`^${BASE}assets/img/icons\\.svg\\?v=[0-9a-f]{12}#icon-`));
  }
});

test("los iconos del sitio apuntan al sprite con BASE", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const uses = [...env.doc.querySelectorAll("use[href]")];
  assert.ok(uses.length > 10, "la página debería tener varios iconos");
  for (const use of uses) {
    assert.match(use.getAttribute("href"), new RegExp(`^${BASE}assets/img/icons\\.svg\\?v=[0-9a-f]{12}#icon-`), `href fuera de BASE: ${use.getAttribute("href")}`);
  }
});

test("el cuerpo en inglés no arrastra texto en español", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc } = env;
  clickLangSwitch(env);
  await settle();

  const text = doc.querySelector(".doc-body").textContent;
  for (const spanish of ["Instalación", "Qué hace", "Para qué", "Cómo está hecho", "Recorrido de la guía"]) {
    assert.ok(!text.includes(spanish), `el cuerpo en inglés contiene «${spanish}»`);
  }
  assert.match(doc.querySelector(".doc-head__title").textContent, /Install/i);
});

test("el sidebar traduce los títulos de las guías", async () => {
  const env = await loadPage({ page: PAGE, lang: "es" });
  const { doc, window } = env;
  const esLabels = [...doc.querySelectorAll(".side-nav__link")].map((link) => link.textContent.trim());

  clickLangSwitch(env);
  await settle();

  const enLabels = [...doc.querySelectorAll(".side-nav__link")].map((link) => link.textContent.trim());
  assert.notDeepEqual(enLabels, esLabels, "el sidebar no cambió de idioma");
  assert.deepEqual(enLabels, doc.querySelectorAll(".side-nav__link").length === enLabels.length ? enLabels : []);
  for (const label of enLabels) {
    assert.ok(label.length > 2, `etiqueta vacía en el sidebar: ${JSON.stringify(label)}`);
  }
  assert.ok(enLabels.some((label) => /Install/i.test(label)), "falta «Installation» en el sidebar");
  assert.equal(window.currentLang, "en");
});

/* ---------- Capas que se cierran con Escape y foco que vuelve ---------- */

test("Escape cierra el drawer del índice y devuelve el foco al botón", async () => {
  const env = await loadPage({ page: PAGE, mobile: true });
  const { window, doc } = env;
  const toggle = doc.getElementById("sidebarToggle");
  const sidebar = doc.getElementById("docsSidebar");

  // En un navegador pulsar el botón también lo enfoca; jsdom no lo hace solo.
  toggle.focus();
  toggle.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(sidebar.classList.contains("open"), true, "el drawer no se abrió");
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.ok(doc.querySelector(".sidebar-scrim"), "falta la capa oscura detrás del drawer");
  assert.ok(sidebar.contains(doc.activeElement), "el foco debe entrar en el drawer");

  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(sidebar.classList.contains("open"), false, "Escape no cerró el drawer");
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(doc.activeElement, toggle, "el foco debe volver a quien lo abrió");
  assert.equal(doc.querySelector(".sidebar-scrim"), null, "la capa oscura debe retirarse");
  assert.deepEqual(env.errors, [], env.errors.join("; "));
});

test("cerrar el drawer con la capa oscura también devuelve el foco", async () => {
  const env = await loadPage({ page: PAGE, mobile: true });
  const { window, doc } = env;
  const toggle = doc.getElementById("sidebarToggle");
  toggle.focus();
  toggle.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  doc.querySelector(".sidebar-scrim").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(doc.getElementById("docsSidebar").classList.contains("open"), false);
  assert.equal(doc.activeElement, toggle, "el foco debe volver al botón");
});

test("Escape cierra el menú burger", async () => {
  const env = await loadPage({ page: PAGE, mobile: true });
  const { window, doc } = env;
  const burger = doc.getElementById("burger");
  const menu = doc.getElementById("mobileMenu");

  burger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(menu.classList.contains("open"), true, "el menú no se abrió");
  assert.equal(burger.getAttribute("aria-expanded"), "true");

  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(menu.classList.contains("open"), false, "Escape no cerró el menú burger");
  assert.equal(burger.getAttribute("aria-expanded"), "false");
  assert.equal(doc.activeElement, burger, "el foco debe volver al burger");
  assert.deepEqual(env.errors, [], env.errors.join("; "));
});

test("un clic fuera del menú burger lo cierra", async () => {
  const env = await loadPage({ page: PAGE, mobile: true });
  const { window, doc } = env;
  doc.getElementById("burger").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(doc.getElementById("mobileMenu").classList.contains("open"), true);

  doc.querySelector(".doc-body, main, body").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert.equal(doc.getElementById("mobileMenu").classList.contains("open"), false, "debería cerrarse al pulsar fuera");
});

test("cambiar de idioma conserva la posición de lectura", async () => {
  const env = await loadPage({ page: PAGE });
  const llamadas = [];
  env.window.scrollTo = (x, y) => llamadas.push([x, y]);
  Object.defineProperty(env.window, "scrollY", { value: 1200, configurable: true });

  clickLangSwitch(env);
  await settle();

  assert.equal(env.doc.documentElement.lang, "en", "el idioma debe haber cambiado");
  assert.ok(llamadas.some(([, y]) => y === 1200), `no se restauró el scroll: ${JSON.stringify(llamadas)}`);
});

test("la carga inicial no fuerza el scroll", async () => {
  // En la primera visita manda la restauración del navegador (o el #ancla):
  // applyLang no debe pelearse con ella.
  const llamadas = [];
  const env = await loadPage({ page: PAGE });
  env.window.scrollTo = (x, y) => llamadas.push([x, y]);
  env.window.i18n.applyLang("en");
  await settle();
  assert.deepEqual(llamadas, [], "applyLang sin preserveScroll no debe tocar el scroll");
});


test("cambiar de idioma reteclea los textos, y con menos movimiento no", async () => {
  // La animación más visible de la web al cambiar de idioma: los textos se borran
  // y se vuelven a teclear bloque a bloque, con un retardo escalonado. El arnés la
  // apaga por defecto —ver animateLang en helpers/browser.mjs— precisamente para
  // que no vacíe los textos en mitad de otras pruebas, así que aquí se enciende a
  // propósito y se comprueba entera: que arranca, que termina y que respeta
  // prefers-reduced-motion.
  const env = await loadPage({ page: "index.html", animateLang: true });
  const { window, doc } = env;
  const dict = window.i18n.dict;

  const tecleables = [...doc.querySelectorAll("[data-i18n]")]
    .filter((element) => !element.closest("[aria-live], [data-content-key], pre, code, textarea"))
    .filter((element) => typeof dict.en?.[element.dataset.i18n] === "string"
      && typeof dict.es?.[element.dataset.i18n] === "string");
  assert.ok(tecleables.length > 10, `solo ${tecleables.length} bloques tecleables en la portada`);

  window.i18n.applyLang("en");
  assert.ok(tecleables.some((element) => element.textContent.trim() === ""),
    "los textos se vacían antes de volver a escribirse");
  assert.ok(tecleables.some((element) => element.getAttribute("aria-busy") === "true"),
    "el bloque se marca ocupado mientras se teclea");
  // La reserva de altura no se puede observar aquí: jsdom no tiene maquetación y
  // getBoundingClientRect() devuelve siempre 0, así que la condición «solo si hay
  // altura» no se cumple nunca. Se comprueba en el fuente, que es donde vive la
  // decisión —medir antes de vaciar, reservar solo si el bloque medía algo y
  // soltar la reserva al terminar, también al cancelar—.
  const fuente = readFileSync(path.join(ROOT, "assets", "js", "i18n.js"), "utf8");
  assert.ok(fuente.includes("block.height = block.element.getBoundingClientRect().height;"),
    "hay que medir el bloque antes de vaciarlo");
  assert.ok(fuente.includes("block.nodes.forEach((entry) => { entry.node.nodeValue = \"\"; });"),
    "los nodos de texto se vacían después de medir");
  assert.ok(/if \(block\.height > 0\) block\.element\.style\.minHeight/.test(fuente),
    "la altura solo se reserva cuando el bloque medía algo");
  assert.equal(fuente.split('block.element.style.minHeight = "";').length - 1, 2,
    "la reserva se suelta al terminar y al cancelar");

  // 380 ms de escalonado como máximo y 3 ms por carácter en el bloque más largo
  // admitido (320): sobra margen, pero jsdom va más despacio que un navegador.
  await settle(2600);
  for (const element of tecleables) {
    const key = element.dataset.i18n;
    assert.equal(element.innerHTML, normalized(window, dict.en[key]), `${key} queda tecleado del todo`);
    assert.equal(element.hasAttribute("aria-busy"), false, `${key} deja de estar ocupado`);
    assert.equal(element.style.minHeight, "", `${key} no se queda con altura reservada`);
  }

  // Con prefers-reduced-motion: reduce no arranca y el cambio es instantáneo, que
  // es exactamente lo que está pidiendo quien desactiva el movimiento.
  window.matchMedia = (query) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  window.i18n.applyLang("es");
  assert.equal(doc.querySelectorAll('[data-i18n][aria-busy="true"]').length, 0,
    "con menos movimiento no se teclea nada");
  for (const element of tecleables) {
    const key = element.dataset.i18n;
    assert.equal(element.innerHTML, normalized(window, dict.es[key]),
      `${key} cambia al instante con menos movimiento`);
  }
  assert.deepEqual(env.errors, [], "el retecleo no debe provocar errores");
});
