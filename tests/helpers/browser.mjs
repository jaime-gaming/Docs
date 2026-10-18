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
 * @param {object} [options.index] índice a servir (por defecto el del build)
 * @returns {Promise<object>} window, doc, errores, peticiones y observers
 */
export async function loadPage({
  page = "wave/install/index.html",
  lang = "es",
  browserLang = lang === "en" ? "en-US" : "es-ES",
  indexFails = false,
  index = null,
} = {}) {
  const html = readFileSync(path.join(ROOT, page), "utf8");
  const url = `https://jaime-gaming.github.io${BASE}${page.replace(/index\.html$/, "")}`;

  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));

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
