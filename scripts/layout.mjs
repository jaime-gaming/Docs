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
<meta name="theme-color" content="#10120f" />
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
          <pattern id="languageFlagEs" width="24" height="24" patternUnits="userSpaceOnUse">
            <g><path fill="#aa151b" d="M0 0h24v24H0z"/><path fill="#f1bf00" d="M0 6h24v12H0z"/></g>
          </pattern>
          <pattern id="languageFlagEn" width="24" height="24" patternUnits="userSpaceOnUse">
            <g><path fill="#012169" d="M0 0h24v24H0z"/><path stroke="#fff" stroke-width="5" d="m0 0 24 24M24 0 0 24"/><path stroke="#c8102e" stroke-width="2" d="m0 0 24 24M24 0 0 24"/><path stroke="#fff" stroke-width="8" d="M12 0v24M0 12h24"/><path stroke="#c8102e" stroke-width="4" d="M12 0v24M0 12h24"/></g>
          </pattern>
          <radialGradient id="languageGloss" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stop-color="#fff" stop-opacity=".42"/>
            <stop offset="55%" stop-color="#fff" stop-opacity=".08"/>
            <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle class="flag flag-es" cx="12" cy="12" r="9.5" fill="url(#languageFlagEs)"/>
        <circle class="flag flag-en" cx="12" cy="12" r="9.5" fill="url(#languageFlagEn)"/>
        <circle class="language-globe__gloss" cx="12" cy="12" r="9.5" fill="url(#languageGloss)" aria-hidden="true"/>
        <use href="${spriteUrl}#icon-globe" fill="none" stroke="#0d100d" stroke-opacity=".55" stroke-width="1.9" stroke-linecap="round"/>
        <use href="${spriteUrl}#icon-globe" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".9" stroke-linecap="round"/>
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
  <div class="footer__inner">
    <div class="footer__brand">
      <a href="${main("/")}" class="footer__logo" aria-label="Jaime Gaming — inicio" data-i18n-aria="aria.footerLogo">JG<span class="dot">.</span></a>
      <p class="footer__tagline" data-i18n="footer.tagline">Juegos para navegador, aplicaciones web y vídeos.</p>
      <div class="footer__socials" role="group" aria-label="Redes sociales" data-i18n-aria="aria.socials">
        <a class="social-icon" href="https://github.com/jaime-gaming" aria-label="GitHub" data-i18n-aria="social.github" target="_blank" rel="noopener noreferrer">${renderIcon("github")}</a>
        <a class="social-icon" href="https://www.youtube.com/@jaimegaming5731" aria-label="YouTube" data-i18n-aria="social.youtube" target="_blank" rel="noopener noreferrer">${renderIcon("youtube")}</a>
        <a class="social-icon" href="https://x.com/JaimeGamingPro" aria-label="X / Twitter" data-i18n-aria="social.x" target="_blank" rel="noopener noreferrer">${renderIcon("x")}</a>
        <a class="social-icon" href="https://discord.com/users/984083829767675965" aria-label="Discord" data-i18n-aria="social.discord" target="_blank" rel="noopener noreferrer">${renderIcon("discord")}</a>
        <a class="social-icon" href="mailto:jaimegamingpro@gmail.com" aria-label="Correo electrónico" data-i18n-aria="social.email">${renderIcon("mail")}</a>
      </div>
    </div>
    <nav class="footer__col" aria-label="Enlaces del sitio" data-i18n-aria="footer.siteAria">
      <h2 class="footer__title" data-i18n="footer.site">Sitio</h2>
      <a href="${u("/")}"><span data-i18n="nav.home">Inicio</span></a>
      <a href="${u("/projects/")}"><span data-i18n="nav.projects">Proyectos</span></a>
      <a href="${main("/blog/")}"><span data-i18n="nav.blog">Blog</span></a>
      <a href="${main("/contact/")}"><span data-i18n="nav.contact">Contacto</span></a>
    </nav>
    <nav class="footer__col" aria-label="Recursos y enlaces externos" data-i18n-aria="footer.resourcesAria">
      <h2 class="footer__title" data-i18n="footer.resources">Recursos</h2>
      <a href="${main("/")}"><span data-i18n="footer.mainSite">Mi web</span></a>
      <a class="footer__status" href="${u("/status/")}"><span class="footer__status-dot" aria-hidden="true"></span><span data-i18n="footer.status">Estado del servicio</span></a>
      <a href="https://github.com/jaime-gaming" target="_blank" rel="noopener noreferrer">GitHub<span class="footer__arrow" aria-hidden="true">↗</span></a>
      <a href="mailto:jaimegamingpro@gmail.com"><span data-i18n="footer.email">Correo</span></a>
    </nav>
  </div>
  <div class="footer__bottom">
    <p class="footer__copy">© <span id="year"></span> Jaime Gaming. <span data-i18n="footer.rights">Todos los derechos reservados.</span></p>
    <div class="footer__bottom-actions">
      <nav class="footer__legal" aria-label="Términos y privacidad" data-i18n-aria="footer.legalAria">
        <a href="${main("/terms/")}" data-i18n="footer.terms">Términos del servicio</a>
        <a href="${main("/privacy/")}" data-i18n="footer.privacy">Privacidad</a>
      </nav>
      <a href="https://github.com/jaime-gaming/Docs" target="_blank" rel="noopener noreferrer" data-i18n="footer.source">Código fuente ↗</a>
      <button class="to-top" id="toTop" type="button" aria-label="Volver arriba" data-i18n-aria="aria.backToTop">${renderIcon("arrow")}</button>
    </div>
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
