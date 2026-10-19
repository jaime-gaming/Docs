/**
 * Conmutador de idioma ES/EN.
 *
 * Mismo modelo que la web principal: el HTML se sirve en español y los
 * textos en inglés viven en dos bloques JSON (#uiStrings para la interfaz
 * y #pageTranslations para el cuerpo de cada página). La preferencia se
 * guarda en localStorage con la clave "lang", que es la misma que usa
 * jaime-gaming.github.io, así que el idioma se mantiene entre los dos sitios.
 */
(function () {
  "use strict";

  function readJson(id) {
    try {
      return JSON.parse(document.getElementById(id)?.textContent || "{}");
    } catch {
      return {};
    }
  }

  const dict = readJson("uiStrings");

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* modo privado */ }
  }

  function detectDefaultLang() {
    const saved = storageGet("lang");
    if (saved && dict[saved]) return saved;
    const browserLang = (navigator.language || "es").slice(0, 2).toLowerCase();
    return dict[browserLang] ? browserLang : "en";
  }

  // Al cambiar de idioma la web no sustituye los textos en seco: los borra y los
  // vuelve a teclear, bloque a bloque y con un retardo escalonado. Es su
  // animación más visible y se portó tal cual, con sus tres salvaguardas —no
  // animar la primera aplicación, no animar si quien lee pidió menos movimiento,
  // y no animar con la pestaña en segundo plano—.
  let langAppliedOnce = false;
  let typingToken = 0;
  let typingFrame = 0;
  let typingBlocks = [];

  function motionAllowed() {
    return typeof window.matchMedia !== "function" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** Cancela un retecleo en vuelo y devuelve los bloques a su estado normal. */
  function stopRetyping() {
    typingToken += 1;
    if (typingFrame && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(typingFrame);
    typingFrame = 0;
    typingBlocks.forEach((block) => {
      block.element.removeAttribute("aria-busy");
      block.element.style.minHeight = "";
    });
    typingBlocks = [];
  }

  /**
   * Los bloques que se van a teclear: cada elemento con data-i18n y sus nodos de
   * texto. Se quedan fuera las regiones vivas —reteclear un aria-live le grita
   * cada carácter a un lector de pantalla—, el cuerpo traducido de la página, que
   * va por data-content-key y no tiene nada que hacer en una animación de un
   * segundo, y el código, donde el espaciado es contenido.
   *
   * El tope de 320 caracteres evita que un texto largo tarde varios segundos.
   */
  function collectTypingBlocks() {
    const blocks = [];
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      if (element.closest("[aria-live], [data-content-key], pre, code, textarea")) return;
      const nodes = [];
      let total = 0;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let node = walker.nextNode();
      while (node) {
        const text = node.nodeValue || "";
        if (text.trim()) {
          nodes.push({ node, text });
          total += text.length;
        }
        node = walker.nextNode();
      }
      if (!nodes.length || total < 2 || total > 320) return;
      blocks.push({ element, nodes, total });
    });
    return blocks;
  }

  function retypePage() {
    stopRetyping();
    if (typeof window.requestAnimationFrame !== "function" || typeof document.createTreeWalker !== "function") return;
    if (!motionAllowed() || document.visibilityState === "hidden") return;
    const blocks = collectTypingBlocks();
    if (!blocks.length) return;
    const token = typingToken;
    const originals = blocks.map((block) => block.nodes.map((entry) => entry.text));

    // Se reserva la altura de cada bloque antes de vaciarlo: si no, la página
    // entera se encoge y vuelve a crecer mientras se teclea, y quien estaba
    // leyendo pierde el sitio.
    blocks.forEach((block) => {
      block.height = block.element.getBoundingClientRect().height;
      block.nodes.forEach((entry) => { entry.node.nodeValue = ""; });
      block.element.setAttribute("aria-busy", "true");
      if (block.height > 0) block.element.style.minHeight = `${block.height}px`;
    });
    typingBlocks = blocks;

    let startTime = 0;
    function frame(now) {
      if (token !== typingToken) return;
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      let finished = true;
      blocks.forEach((block, index) => {
        // Cada bloque empieza 15 ms después del anterior, con un tope de 380 ms
        // para que una página con cien textos no tarde en arrancar.
        const budget = elapsed - Math.min(index * 15, 380);
        if (budget < 0) { finished = false; return; }
        // Entre 3 y 13 ms por carácter: los textos cortos se leen como un tecleo
        // y los largos no se eternizan.
        const speed = Math.max(3, Math.min(13, 900 / block.total));
        const visible = Math.min(block.total, Math.floor(budget / speed));
        let remaining = visible;
        block.nodes.forEach((entry, nodeIndex) => {
          const full = originals[index][nodeIndex];
          const shown = remaining > 0 ? full.slice(0, remaining) : "";
          if (entry.node.nodeValue !== shown) entry.node.nodeValue = shown;
          remaining -= full.length;
        });
        if (visible < block.total) finished = false;
      });
      if (!finished) {
        typingFrame = window.requestAnimationFrame(frame);
        return;
      }
      typingFrame = 0;
      blocks.forEach((block) => {
        block.element.removeAttribute("aria-busy");
        block.element.style.minHeight = "";
      });
      typingBlocks = [];
    }
    typingFrame = window.requestAnimationFrame(frame);
  }

  function applyLang(lang, { persist = true, preserveScroll = false, animate = true } = {}) {
    if (!dict[lang]) lang = "es";
    // Cambiar de idioma reescribe el cuerpo de la página. Si la versión
    // traducida mide distinto, la lectura salta; anotamos dónde estaba quien
    // leía para devolvérsele al terminar. Solo en cambios iniciados por la
    // persona: en la carga inicial manda la restauración del navegador.
    const savedScroll = preserveScroll
      ? (window.scrollY || document.documentElement.scrollTop || 0)
      : 0;
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = dict[lang]?.[element.getAttribute("data-i18n")];
      if (typeof value === "string") element.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const value = dict[lang]?.[element.getAttribute("data-i18n-aria")];
      if (typeof value === "string") element.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const value = dict[lang]?.[element.getAttribute("data-i18n-placeholder")];
      if (typeof value === "string") element.setAttribute("placeholder", value);
    });

    // Cuerpo de la página y campos sueltos (títulos, descripciones de tarjeta).
    const pageData = readJson("pageTranslations")[lang] || {};
    document.querySelectorAll("[data-content-key]").forEach((element) => {
      const value = pageData.fields?.[element.dataset.contentKey];
      if (typeof value !== "string") return;
      const attribute = element.dataset.contentAttr;
      if (attribute) {
        // Para href, aria-label y demás atributos que cambian con el idioma.
        element.setAttribute(attribute, value);
      } else if (element.hasAttribute("data-content-language")) {
        element.innerHTML = value;
        element.lang = lang;
      } else {
        element.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-date]").forEach((element) => {
      const date = new Date(`${element.getAttribute("datetime")}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return;
      element.textContent = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
      }).format(date);
    });

    const page = document.body.dataset.page;
    const title = pageData.title || dict[lang]?.[`meta.${page}.title`];
    const description = pageData.description || dict[lang]?.[`meta.${page}.description`];
    if (title) {
      document.title = title;
      document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((el) => { el.content = title; });
    }
    if (description) {
      document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach((el) => { el.content = description; });
    }
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = lang === "es" ? "es_ES" : "en_US";

    const switchButton = document.getElementById("langSwitch");
    if (switchButton) {
      switchButton.setAttribute("data-active", lang);
      switchButton.title = dict[lang]?.["aria.langSwitch"] || "";
      const name = document.getElementById("languageName");
      if (name) name.textContent = lang === "es" ? "Español" : "English";
    }

    if (persist) storageSet("lang", lang);
    window.currentLang = lang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));

    // Antes de restaurar el scroll: retypePage reserva las alturas, así que la
    // posición a la que se vuelve ya es la definitiva.
    if (animate && langAppliedOnce) retypePage();
    langAppliedOnce = true;

    // Después de langchange: los oyentes (índice lateral, anclas, tablas)
    // pueden cambiar la altura del documento, así que restauramos al final y
    // una vez más tras el reflujo.
    if (savedScroll > 0) {
      window.scrollTo(0, savedScroll);
      window.requestAnimationFrame?.(() => window.scrollTo(0, savedScroll));
    }
  }

  window.i18n = { dict, applyLang, detectDefaultLang, retypePage };

  document.addEventListener("DOMContentLoaded", () => {
    applyLang(detectDefaultLang());
    const switchButton = document.getElementById("langSwitch");
    switchButton?.addEventListener("click", () => {
      applyLang(window.currentLang === "es" ? "en" : "es", { preserveScroll: true });
      // El globo da una vuelta y su anillo se expande: el mismo gesto que en la
      // web. Se quita la clase y se fuerza el reflujo para que vuelva a sonar si
      // se pulsa dos veces seguidas.
      switchButton.classList.remove("is-switching");
      void switchButton.offsetWidth;
      switchButton.classList.add("is-switching");
      window.setTimeout(() => switchButton.classList.remove("is-switching"), 760);
    });
  });

  // Varias pestañas abiertas cambian de idioma a la vez.
  window.addEventListener("storage", (event) => {
    if (event.key === "lang" && dict[event.newValue] && event.newValue !== window.currentLang) {
      applyLang(event.newValue, { persist: false, preserveScroll: true });
    }
  });
})();
