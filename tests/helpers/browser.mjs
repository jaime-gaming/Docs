/**
 * Arnés de navegador para las pruebas de interfaz.
 *
 * Carga una página ya generada en jsdom y deja que el HTML cargue sus propios
 * scripts (i18n.js, search.js, main.js) en el orden real, con un único
 * DOMContentLoaded. Las pruebas anteriores despachaban ese evento a mano y
 * jsdom volvía a dispararlo después, lo que enganchaba los listeners dos veces
 * y falseaba cualquier prueba del conmutador de idioma.
 *
 * Los recursos se sirven desde el propio repositorio: nada sale a la red.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// jsdom es CommonJS y en la v30 ResourceLoader desapareció: los recursos se
// interceptan con requestInterceptor.
import jsdom from "jsdom";

const { JSDOM, VirtualConsole, requestInterceptor } = jsdom;

import { BASE } from "../../scripts/config.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

const CONTENT_TYPES = [
  [/\.js$/, "application/javascript"],
  [/\.css$/, "text/css"],
  [/\.svg$/, "image/svg+xml"],
  [/\.json$/, "application/json"],
];

/**
 * Sirve desde disco las rutas bajo BASE y corta todo lo demás: ni las fuentes
 * de Google ni ningún otro dominio salen a la red durante las pruebas.
 */
function localInterceptor(requested) {
  return requestInterceptor((request) => {
    requested.push(request.url);
    const { pathname } = new URL(request.url);
    const notFound = () => new Response("", { status: 404, headers: { "Content-Type": "text/plain" } });
    if (!pathname.startsWith(BASE)) return notFound();

    const file = path.join(ROOT, pathname.slice(BASE.length));
    if (!existsSync(file)) return notFound();

    const type = CONTENT_TYPES.find(([pattern]) => pattern.test(file))?.[1] ?? "text/plain";
    return new Response(readFileSync(file), { status: 200, headers: { "Content-Type": type } });
  });
}

/**
 * @param {object} options
 * @param {string} [options.page] archivo generado, relativo a la raíz del repo
 * @param {string} [options.lang] idioma guardado en localStorage
 * @param {string} [options.browserLang] navigator.language
 * @param {boolean} [options.indexFails] el índice de búsqueda responde 503
 * @param {boolean} [options.mobile] emula la cascada de móvil que jsdom no aplica
 * @param {string} [options.userAgent] navigator.userAgent alternativo
 * @param {object} [options.index] índice a servir (por defecto el del build)
 * @returns {Promise<object>} window, doc, errores, peticiones y observers
 */
export async function loadPage({
  page = "wave/install/index.html",
  lang = "es",
  browserLang = lang === "en" ? "en-US" : "es-ES",
  indexFails = false,
  index = null,
  mobile = false,
  userAgent = null,
} = {}) {
  const html = readFileSync(path.join(ROOT, page), "utf8");
  const url = `https://jaime-gaming.github.io${BASE}${page.replace(/index\.html$/, "")}`;

  const errors = [];
  const virtualConsole = new VirtualConsole();
  // Las fuentes de Google son externas y aquí no hay red: jsdom lo reporta como
  // error de carga. Es ruido del arnés, no un fallo del sitio, así que se
  // filtra para que `errors` solo contenga problemas reales.
  const EXTERNAL_NOISE = /Could not load link: "https:\/\/fonts\.(googleapis|gstatic)\.com/;
  virtualConsole.on("jsdomError", (error) => {
    if (!EXTERNAL_NOISE.test(error.message)) errors.push(error.message);
  });

  const requested = [];
  const indexPayload = index ?? JSON.parse(readFileSync(path.join(ROOT, "assets", "data", "search-index.json"), "utf8"));

  const dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    resources: { interceptors: [localInterceptor(requested)] },
    virtualConsole,
    pretendToBeVisual: true,
    beforeParse(window) {
      // lang: null simula una primera visita sin preferencia guardada.
      if (lang) window.localStorage.setItem("lang", lang);
      Object.defineProperty(window.navigator, "language", { value: browserLang, configurable: true });
      // Para probar lo que depende de la plataforma (el atajo ⌘K / Ctrl K).
      if (userAgent) {
        Object.defineProperty(window.navigator, "userAgent", { value: userAgent, configurable: true });
      }

      // jsdom no trae estas APIs; main.js y search.js las usan sin red.
      window.matchMedia = (query) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      });

      window.Element.prototype.scrollIntoView = function scrollIntoView() {};
      // jsdom no tiene layout ni implementa scrollTo: lo emite como jsdomError
      // ("Not implemented"), igual que scrollIntoView arriba.
      window.scrollTo = () => {};

      const observers = [];
      window.IntersectionObserver = class {
        constructor(callback, options) {
          this.callback = callback;
          this.options = options;
          this.targets = [];
          this.disconnected = false;
          observers.push(this);
        }

        observe(target) { this.targets.push(target); }
        unobserve(target) { this.targets = this.targets.filter((item) => item !== target); }
        disconnect() { this.targets = []; this.disconnected = true; }
        takeRecords() { return []; }
      };

      window.fetch = async (target) => {
        requested.push(String(target));
        if (indexFails) return { ok: false, status: 503, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => indexPayload };
      };

      window.__observers = observers;
    },
  });

  const { window } = dom;
  await new Promise((resolve) => {
    if (window.document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
    // Red de seguridad: si algún recurso no llega, no bloquear la prueba.
    setTimeout(resolve, 1500);
  });

  // jsdom no evalúa las media queries: los controles que solo existen en móvil
  // (.burger, .sidebar-toggle) quedan en display:none y no se pueden enfocar,
  // así que cualquier prueba de foco o del drawer fallaría por el arnés y no
  // por el código. Con mobile:true inyectamos lo que un navegador estrecho sí
  // aplicaría.
  if (mobile) {
    const style = window.document.createElement("style");
    style.textContent = ".burger{display:block !important}.sidebar-toggle{display:inline-flex !important}";
    window.document.head.append(style);
  }

  return {
    window,
    doc: window.document,
    errors,
    requested,
    observers: window.__observers,
  };
}

/** El input del buscador está debounceado 90 ms. */
export const settle = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

/** Pulsa el conmutador de idioma como lo haría alguien. */
export function clickLangSwitch(env) {
  env.doc.getElementById("langSwitch").dispatchEvent(new env.window.MouseEvent("click", { bubbles: true }));
}
