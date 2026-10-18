/**
 * Plantilla HTML compartida por todas las páginas.
 *
 * Replica la estructura de la web principal (nav fija, progress bar,
 * skip link, conmutador ES/EN con globo-bandera, burger, footer con
 * botón de subir) y añade el esqueleto propio de un sitio de
 * documentación: sidebar de proyecto, columna de contenido y TOC.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { BASE, SITE_NAME, SITE_URL, CANONICAL_ORIGIN, main, u } from "./config.mjs";
import { DICT } from "./dict.mjs";
import { expandIcons, renderIcon, spriteUrl } from "./icons.mjs";

function assetUrl(path) {
  const content = readFileSync(new URL(`..${path}`, import.meta.url));
  const version = createHash("sha256").update(content).digest("hex").slice(0, 12);
  return `${u(path)}?v=${version}`;
}

const NAV_ITEMS = [
  { href: u("/"), key: "nav.home", label: "Inicio" },
  { href: u("/projects/"), key: "nav.projects", label: "Proyectos" },
  { href: main("/"), key: "nav.site", label: "Mi web", external: true },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isActiveNavItem(item, activePath) {
  if (item.external) return false;
  if (item.href === u("/")) return activePath === "/";
  return activePath === item.href || activePath.startsWith(item.href);
}

/** Marca qué proyecto está activo según la ruta de la página. */
function activeProjectSlug(activePath) {
  const segment = activePath.replace(/^\/+/, "").split("/")[0];
  return segment || "";
}

export function renderLayout({
  title,
  description,
  bodyHtml,
  activePath = "/",
  sidebarHtml = "",
  tocHtml = "",
  translations = {},
  extraHead = "",
  layout = "docs",
  noindex = false,
}) {
  const fullTitle =
    activePath === "/"
      ? "Docs — Jaime Gaming"
      : title
        ? `${escapeHtml(title)} — Docs de ${SITE_NAME}`
        : `Docs de ${SITE_NAME}`;
  const safeDescription = escapeHtml(description || "");
  const canonical = `${CANONICAL_ORIGIN}${activePath === "/" ? "/" : activePath}`;
  const projectSlug = activeProjectSlug(activePath);

  const nav = NAV_ITEMS.map((item) => {
    const active = isActiveNavItem(item, activePath) ? " active" : "";
    const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const arrow = item.external ? ' <span class="nav__external" aria-hidden="true">↗</span>' : "";
    return `<a href="${item.href}"${target} data-i18n="${item.key}" class="${active.trim()}">${item.label}${arrow}</a>`;
  }).join("\n    ");

  const mobileNav = NAV_ITEMS.map((item) => {
    const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${item.href}"${target} data-i18n="${item.key}">${item.label}</a>`;
  }).join("\n  ");

  const aside = sidebarHtml
    ? `<aside class="docs__sidebar" id="docsSidebar" aria-label="Índice de esta documentación" data-i18n-aria="aria.sidebar">
${sidebarHtml}
    </aside>`
    : "";

  // data-content-key="toc" es lo que permite que i18n.js sustituya el índice al
  // cambiar de idioma. Sin él los títulos se quedan en español y, peor, sus
  // anclajes (#apartado-en-espanol) no existen en el cuerpo traducido.
  const rail = tocHtml
    ? `<aside class="docs__toc" id="docsToc" aria-label="En esta página" data-i18n-aria="aria.toc" data-content-key="toc" data-content-language>
${tocHtml}
    </aside>`
    : "";

  const shell = sidebarHtml || tocHtml
    ? `<div class="docs docs--with-rails">
    <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-label="Abrir índice" aria-expanded="false" aria-controls="docsSidebar" data-i18n-aria="aria.openSidebar">
      ${renderIcon("panel")}
    </button>
    ${aside}
    <div class="docs__main">
${bodyHtml}
    </div>
    ${rail}
  </div>`
    : bodyHtml;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${fullTitle}</title>
<meta name="description" content="${safeDescription}" />
<meta name="author" content="${SITE_NAME}" />
<meta name="theme-color" content="#0d100d" />
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow"}" />
<meta name="docs:base" content="${BASE}" />
<meta name="docs:project" content="${projectSlug}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="es_ES" />
<meta property="og:site_name" content="${SITE_NAME} Docs" />
<meta property="og:title" content="${fullTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE_URL}/assets/img/social-card.png" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:site" content="@JaimeGamingPro" />
<meta name="twitter:title" content="${fullTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" href="${u("/assets/img/favicon.svg")}" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${assetUrl("/assets/css/style.css")}" />
${extraHead}</head>
<body data-icons="${spriteUrl}" data-page="${layout}" data-project="${projectSlug}" data-path="${escapeHtml(activePath)}">

<a class="skip-link" href="#top" data-i18n="aria.skipToContent">Saltar al contenido</a>
<div class="progress-bar" id="progressBar" aria-hidden="true"></div>

<header class="nav">
  <a href="${u("/")}" class="nav__logo" aria-label="Jaime Gaming Docs — inicio" data-i18n-aria="aria.homeLogo">JG<span class="dot">.</span><span class="nav__logo-badge">docs</span></a>
  <nav class="nav__links" aria-label="Navegación principal" data-i18n-aria="aria.mainNav">
    ${nav}
  </nav>
  <div class="nav__actions">
    <button class="search-trigger" id="searchTrigger" type="button" aria-label="Buscar" data-i18n-aria="nav.search">
      ${renderIcon("search")}
      <span class="search-trigger__label" data-i18n="search.button">Buscar</span>
      <kbd class="search-trigger__kbd" aria-hidden="true">Ctrl K</kbd>
    </button>
    <button class="lang-switch" id="langSwitch" data-active="es" type="button" aria-label="Cambiar idioma" data-i18n-aria="aria.langSwitch">
      <svg class="language-globe" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="languageFlag" width="24" height="24" patternUnits="userSpaceOnUse">
            <g class="flag-es"><path fill="#aa151b" d="M0 0h24v24H0z"/><path fill="#f1bf00" d="M0 6h24v12H0z"/></g>
            <g class="flag-en"><path fill="#012169" d="M0 0h24v24H0z"/><path stroke="#fff" stroke-width="5" d="m0 0 24 24M24 0 0 24"/><path stroke="#c8102e" stroke-width="2" d="m0 0 24 24M24 0 0 24"/><path stroke="#fff" stroke-width="8" d="M12 0v24M0 12h24"/><path stroke="#c8102e" stroke-width="4" d="M12 0v24M0 12h24"/></g>
          </pattern>
        </defs>
        <circle cx="12" cy="12" r="9.5" fill="url(#languageFlag)"/>
        <use href="${spriteUrl}#icon-globe" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width=".9" stroke-linecap="round"/>
      </svg>
      <span class="sr-only" id="languageName">Español</span>
    </button>
    <a class="social-icon nav__github" href="https://github.com/jaime-gaming/Docs" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
      ${renderIcon("github")}
    </a>
    <button class="burger" id="burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobileMenu" data-i18n-aria="nav.openMenu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<nav class="mobile-menu" id="mobileMenu" aria-label="Navegación móvil" data-i18n-aria="aria.mainNav">
  ${mobileNav}
</nav>

<main id="top" class="layout--${layout}">
${expandIcons(shell)}
</main>

<footer class="footer">
  <p>© <span id="year"></span> <span data-i18n="footer.rights">Jaime Gaming.</span> <span class="footer__note" data-i18n="footer.made">Documentación generada con Node y publicada en GitHub Pages.</span></p>
  <div class="footer__actions">
    <a class="footer__link" href="${main("/")}" data-i18n="footer.mainSite">Mi web</a>
    <button class="to-top" id="toTop" type="button" aria-label="Volver arriba" data-i18n-aria="aria.backToTop">${renderIcon("arrow")}</button>
  </div>
</footer>

<div class="search-modal" id="searchModal" role="dialog" aria-modal="true" aria-labelledby="searchModalTitle" hidden>
  <div class="search-modal__backdrop" data-search-close></div>
  <div class="search-modal__panel">
    <h2 class="sr-only" id="searchModalTitle" data-i18n="search.dialogTitle">Buscar en la documentación</h2>
    <div class="search-modal__head">
      <span class="search-modal__icon" aria-hidden="true">${renderIcon("search")}</span>
      <input id="searchInput" type="search" autocomplete="off" spellcheck="false" placeholder="Buscar en la documentación…" data-i18n-placeholder="search.placeholder" aria-describedby="searchModalHint" role="combobox" aria-expanded="false" aria-controls="searchResults" aria-autocomplete="list" aria-activedescendant="" />
      <button class="search-modal__close" type="button" data-search-close aria-label="Cerrar búsqueda" data-i18n-aria="search.close">${renderIcon("close")}</button>
    </div>
    <div class="search-modal__hintrow">
      <p class="search-modal__hint" id="searchModalHint" data-i18n="search.hint">Escribe para filtrar páginas y apartados</p>
      <p class="search-modal__keys" id="searchKeys" aria-hidden="true">
        <span class="keyhint"><kbd>↑</kbd><kbd>↓</kbd><span data-i18n="search.kbdNavigate">navegar</span></span>
        <span class="keyhint"><kbd>↵</kbd><span data-i18n="search.kbdOpen">abrir</span></span>
        <span class="keyhint"><kbd>Esc</kbd><span data-i18n="search.kbdClose">cerrar</span></span>
      </p>
    </div>
    <div class="search-modal__results" id="searchResults" role="listbox" aria-label="Resultados de búsqueda" data-i18n-aria="search.resultsLabel"></div>
  </div>
</div>

<script type="application/json" id="uiStrings">${JSON.stringify(DICT).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="pageTranslations">${JSON.stringify(translations).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="searchConfig">${JSON.stringify({ index: u("/assets/data/search-index.json"), scope: projectSlug }).replace(/</g, "\\u003c")}</script>
<script src="${assetUrl("/assets/js/i18n.js")}"></script>
<script src="${assetUrl("/assets/js/search.js")}"></script>
<script src="${assetUrl("/assets/js/main.js")}"></script>
</body>
</html>
`;
}

export { assetUrl, escapeHtml };
