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

  function applyLang(lang, { persist = true, preserveScroll = false } = {}) {
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

    // Después de langchange: los oyentes (índice lateral, anclas, tablas)
    // pueden cambiar la altura del documento, así que restauramos al final y
    // una vez más tras el reflujo.
    if (savedScroll > 0) {
      window.scrollTo(0, savedScroll);
      window.requestAnimationFrame?.(() => window.scrollTo(0, savedScroll));
    }
  }

  window.i18n = { dict, applyLang, detectDefaultLang };

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
