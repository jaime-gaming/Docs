/**
 * Buscador de la documentación.
 *
 * Lee assets/data/search-index.json (generado en el build con las páginas
 * y sus apartados, en los dos idiomas) y filtra en el navegador. No hay
 * servicio externo ni consultas a ninguna API: el índice es un archivo
 * estático del propio sitio.
 *
 * Atajos: Ctrl/Cmd + K o "/" para abrir, Esc para cerrar,
 * flechas para moverse y Enter para abrir el resultado.
 */
(function () {
  "use strict";

  const modal = document.getElementById("searchModal");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const hint = document.getElementById("searchModalHint");
  const trigger = document.getElementById("searchTrigger");
  if (!modal || !input || !results) return;

  const config = (() => {
    try { return JSON.parse(document.getElementById("searchConfig")?.textContent || "{}"); }
    catch { return {}; }
  })();

  const BASE = document.querySelector('meta[name="docs:base"]')?.content || "/";
  const getLang = () => window.currentLang || document.documentElement.lang || "es";
  const textFor = (key, fallback = "") => window.i18n?.dict?.[getLang()]?.[key] || fallback;

  let index = null;
  let loading = false;
  let scopeAll = true;
  let selected = 0;
  let current = [];
  let lastFocused = null;

  function iconHtml(name) {
    const base = document.body.dataset.icons || "icons.svg";
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${base}#icon-${name}"></use></svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Quita acentos y pasa a minúsculas para que la búsqueda no dependa de ellos. */
  function normalize(value) {
    return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async function loadIndex() {
    if (index || loading) return index;
    loading = true;
    try {
      const response = await fetch(config.index || `${BASE}assets/data/search-index.json`, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      index = await response.json();
    } catch {
      index = { entries: [], error: true };
    } finally {
      loading = false;
    }
    return index;
  }

  function scoreEntry(entry, terms) {
    const title = normalize(entry.title);
    const heading = normalize(entry.heading || "");
    const project = normalize(entry.projectName || "");
    const excerpt = normalize(entry.excerpt || "");
    let score = 0;
    for (const term of terms) {
      let hit = 0;
      if (title === term) hit = 120;
      else if (title.startsWith(term)) hit = 90;
      else if (title.includes(term)) hit = 70;
      if (heading.includes(term)) hit = Math.max(hit, 55);
      if (project.includes(term)) hit = Math.max(hit, 45);
      if (excerpt.includes(term)) hit = Math.max(hit, 20);
      if (!hit) return 0; // todas las palabras deben aparecer en algún campo
      score += hit;
    }
    if (!entry.heading) score += 12; // la página pesa más que un apartadito suelto
    return score;
  }

  function highlight(text, terms) {
    if (!text) return "";
    let html = escapeHtml(text);
    for (const term of terms) {
      if (!term) continue;
      // Resaltar sobre el texto escapado con una comparación sin acentos.
      const pattern = new RegExp(`(${escapeRegExp(escapeHtml(term))})`, "gi");
      html = html.replace(pattern, "<mark>$1</mark>");
    }
    return html;
  }

  function excerptAround(excerpt, terms, radius = 70) {
    const haystack = normalize(excerpt);
    let at = -1;
    for (const term of terms) {
      const found = haystack.indexOf(term);
      if (found >= 0 && (at < 0 || found < at)) at = found;
    }
    if (at < 0) return excerpt.slice(0, radius * 2);
    const start = Math.max(0, at - radius);
    const end = Math.min(excerpt.length, at + radius);
    return `${start > 0 ? "…" : ""}${excerpt.slice(start, end)}${end < excerpt.length ? "…" : ""}`;
  }

  function search(query) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length || !index) return [];
    const projectScope = scopeAll ? null : document.body.dataset.project;
    return index.entries
      .filter((entry) => entry.lang === getLang())
      .filter((entry) => !projectScope || entry.project === projectScope)
      .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order)
      .slice(0, 30)
      .map((hit) => hit.entry);
  }

  function render(query) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) {
      results.innerHTML = `<p class="search-modal__empty">${escapeHtml(textFor("search.noQuery", "Prueba con «instalar», «comandos», «privacidad»…"))}</p>`;
      current = [];
      selected = 0;
      return;
    }
    current = search(query);
    selected = 0;
    if (!current.length) {
      results.innerHTML = `<p class="search-modal__empty">${escapeHtml(textFor("search.empty", "Sin resultados para"))} <strong>${escapeHtml(query)}</strong></p>`;
      return;
    }
    const label = current.length === 1 ? textFor("search.result", "resultado") : textFor("search.results", "resultados");
    results.innerHTML = current.map((entry, position) => `
      <button class="search-result" type="button" role="option" aria-selected="${position === 0}" data-position="${position}" data-url="${escapeHtml(entry.url)}">
        <span class="search-result__top">${iconHtml(entry.icon || "file")}<span>${escapeHtml(entry.crumb)}</span></span>
        <span class="search-result__title">${highlight(entry.heading || entry.title, terms)}</span>
        ${entry.excerpt ? `<span class="search-result__excerpt">${highlight(excerptAround(entry.excerpt, terms), terms)}</span>` : ""}
      </button>`).join("");
    results.setAttribute("aria-label", `${current.length} ${label}`);
  }

  function moveSelection(delta) {
    if (!current.length) return;
    selected = (selected + delta + current.length) % current.length;
    results.querySelectorAll(".search-result").forEach((node, position) => {
      const active = position === selected;
      node.setAttribute("aria-selected", String(active));
      if (active) node.scrollIntoView({ block: "nearest" });
    });
  }

  function goTo(entry) {
    if (!entry) return;
    window.location.href = entry.url;
  }

  function open() {
    if (!modal.hidden) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    render("");
    input.focus();
    loadIndex().then((data) => {
      if (data?.error) {
        hint.textContent = getLang() === "es"
          ? "No se ha podido cargar el índice de búsqueda."
          : "The search index could not be loaded.";
      } else if (input.value) render(input.value);
    });
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    lastFocused?.focus?.();
  }

  let debounce = 0;
  input.addEventListener("input", () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => render(input.value), 90);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") { event.preventDefault(); moveSelection(1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); moveSelection(-1); }
    else if (event.key === "Enter") { event.preventDefault(); goTo(current[selected]); }
    else if (event.key === "Escape") { event.preventDefault(); close(); }
  });

  results.addEventListener("click", (event) => {
    const node = event.target.closest(".search-result");
    if (!node) return;
    goTo(current[Number(node.dataset.position)]);
  });

  results.addEventListener("mousemove", (event) => {
    const node = event.target.closest(".search-result");
    if (!node) return;
    const position = Number(node.dataset.position);
    if (position === selected) return;
    selected = position;
    results.querySelectorAll(".search-result").forEach((other, index) => {
      other.setAttribute("aria-selected", String(index === selected));
    });
  });

  modal.querySelectorAll("[data-search-close]").forEach((node) => {
    node.addEventListener("click", close);
  });

  // Conmutador de alcance: toda la documentación o solo el proyecto actual.
  function buildScopeToggle() {
    if (!document.body.dataset.project || hint.querySelector(".scope-toggle")) return;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "filter-chip scope-toggle";
    toggle.style.cssText = "margin-left:auto;padding:3px 10px;font-size:.68rem;";
    const paint = () => {
      toggle.setAttribute("aria-pressed", String(!scopeAll));
      toggle.textContent = scopeAll
        ? textFor("search.scopeAll", "Toda la documentación")
        : textFor("search.scopeProject", "Solo este proyecto");
    };
    toggle.addEventListener("click", () => { scopeAll = !scopeAll; paint(); render(input.value); });
    paint();
    hint.style.display = "flex";
    hint.style.alignItems = "center";
    hint.append(toggle);
  }

  trigger?.addEventListener("click", open);

  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      modal.hidden ? open() : close();
      return;
    }
    if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && modal.hidden) {
      event.preventDefault();
      open();
    }
    if (event.key === "Escape" && !modal.hidden) close();
  });

  // Traducir el buscador al cambiar de idioma y reejecutar la consulta abierta.
  document.addEventListener("langchange", () => {
    buildScopeToggle();
    input.placeholder = textFor("search.placeholder", "Buscar en la documentación…");
    if (!modal.hidden) render(input.value);
  });

  document.addEventListener("DOMContentLoaded", buildScopeToggle);
})();
