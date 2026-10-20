#!/usr/bin/env node
/**
 * Genera el sitio de documentación como HTML estático.
 *
 *   content/docs/<proyecto>/<pagina>.md      -> español
 *   content/docs/<proyecto>/<pagina>.en.md   -> inglés
 *
 * El HTML se sirve en español y el inglés viaja en el JSON
 * #pageTranslations, igual que la web principal. Las páginas generadas
 * no se editan a mano: se sobrescriben en cada build y las huérfanas
 * se borran.
 */
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { BASE, CANONICAL_ORIGIN, DOCS_SOURCE, GH_USER, ROOT, SITE_NAME, SITE_URL, github, main as mainSite, u } from "./config.mjs";
import { DICT } from "./dict.mjs";
import { expandIcons, iconSprite, renderIcon } from "./icons.mjs";
import { renderLayout } from "./layout.mjs";
import { escapeHtml, renderMarkdown, stripTags } from "./markdown.mjs";
import { GROUPS, LANGUAGES, PROJECTS, pagePath, projectBySlug } from "./registry.mjs";

const BUILD_DATE = new Date().toISOString().slice(0, 10);

/** Directorios que el build puede borrar sin riesgo. */
const GENERATED_TOP_LEVEL = new Set([
  ...PROJECTS.map((p) => p.slug),
  "projects",
  "status",
]);
const KEEP_TOP_LEVEL = new Set([
  "assets", "content", "scripts", "tests", "node_modules", ".git", ".github",
]);

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

async function writePage(relPath, html) {
  const outPath = path.join(ROOT, relPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, html, "utf8");
  console.log(`built ${relPath}`);
}

function formatDate(iso, lang = "es") {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function collapse(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

function excerpt(html, limit = 200) {
  const text = collapse(stripTags(html));
  return text.length > limit ? `${text.slice(0, limit).replace(/\s\S*$/, "")}…` : text;
}

/** Ruta del Markdown original en GitHub, para el enlace de editar. */
function sourceFile(project, page, lang) {
  const name = lang === "en" ? `${page.slug}.en.md` : `${page.slug}.md`;
  return github(project.repo, `/blob/main/content/docs/${project.slug}/${name}`);
}

/* ------------------------------------------------------------------ */
/* Carga de contenido                                                  */
/* ------------------------------------------------------------------ */

async function loadDocPage(project, page, lang) {
  const name = lang === "en" ? `${page.slug}.en.md` : `${page.slug}.md`;
  const file = path.join(DOCS_SOURCE, project.slug, name);
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    throw new Error(`Falta el contenido ${lang.toUpperCase()} de ${project.slug}/${page.slug}: content/docs/${project.slug}/${name}`);
  }
  const { data, content } = matter(raw);
  const source = page.slug === "index" ? content + recorrido(project, lang) : content;
  const rendered = renderMarkdown(source, { lang, dict: DICT[lang] });
  return {
    project,
    page,
    lang,
    file,
    source,
    description: data.description || project.tagline[lang],
    updated: data.updated || BUILD_DATE,
    ...rendered,
    // Los callouts salen del Markdown con <span data-icon="…">. El HTML en
    // inglés viaja dentro del JSON #pageTranslations, donde el expandIcons()
    // del layout no lo ve porque va escapado. Se expanden aquí para que los
    // dos idiomas pinten los iconos de sus avisos.
    html: expandIcons(rendered.html),
  };
}

async function loadProject(project) {
  const pages = [];
  for (const page of project.pages) {
    const variants = {};
    for (const lang of LANGUAGES) variants[lang] = await loadDocPage(project, page, lang);
    if (variants.es.updated !== variants.en.updated) {
      throw new Error(`Las fechas de revisión difieren en ${project.slug}/${page.slug}: es=${variants.es.updated} en=${variants.en.updated}`);
    }
    pages.push({ ...page, variants, updated: variants.es.updated });
  }
  return { ...project, pages };
}

/**
 * Apartado final de cada portada de guía: «Recorrido de la guía».
 *
 * No se escribe a mano en los index.md. Se compone con las páginas hermanas y
 * se añade al Markdown ANTES de renderizar, así que entra en el índice lateral,
 * en el buscador y en las traducciones como cualquier otro apartado: crear la
 * página es lo único que hace falta para que aparezca aquí.
 */
const TOUR_HEADING = { es: "Recorrido de la guía", en: "Guide tour" };

function recorrido(project, lang) {
  const hermanas = project.pages.filter((page) => page.slug !== "index");
  if (!hermanas.length) return "";
  const lineas = hermanas.map(
    (page) => `- [${page.title[lang]}](${pagePath(project.slug, page.slug)}) — ${page.blurb[lang]}`,
  );
  return `\n## ${TOUR_HEADING[lang]}\n\n${lineas.join("\n")}\n`;
}

/**
 * Las cifras del README las escribe el build.
 *
 * Estaban a mano y se pudrían en cuanto crecía el registro: llegaron a decir 37
 * guías cuando ya había 40. Ahora quien añade una página no tiene que acordarse
 * de nada, y si el número cambia el build lo deja dicho en la consola.
 */
async function syncReadme(guias) {
  const file = path.join(ROOT, "README.md");
  const texto = await readFile(file, "utf8");
  const paginas = guias * LANGUAGES.length;
  const nuevo = texto.replace(
    /\|\s*Guías\s*\|\s*\d+\s*\(\d+\s*páginas[^|]*\|/,
    `| Guías | ${guias} (${paginas} páginas: cada una en español e inglés) |`,
  );
  if (nuevo === texto) return "";
  await writeFile(file, nuevo, "utf8");
  return `README.md actualizado: ${guias} guías · ${paginas} páginas`;
}

/* ------------------------------------------------------------------ */
/* Piezas de plantilla                                                 */
/* ------------------------------------------------------------------ */

function renderSidebar(project, currentPageSlug) {
  const links = project.pages
    .map((page) => {
      const active = page.slug === currentPageSlug ? " active" : "";
      const href = u(pagePath(project.slug, page.slug));
      const label = DICT.es[`page.${project.slug}.${page.slug}`];
      return `      <li><a class="side-nav__link${active}" href="${href}" data-i18n="page.${project.slug}.${page.slug}">${renderIcon(page.icon)}<span>${escapeHtml(label)}</span></a></li>`;
    })
    .join("\n");

  const others = PROJECTS.filter((other) => other.slug !== project.slug)
    .map((other) => `        <li><a class="side-nav__chip" href="${u(pagePath(other.slug, "index"))}" title="${escapeHtml(other.name)}">${renderIcon(other.icon)}<span>${escapeHtml(other.name)}</span></a></li>`)
    .join("\n");

  return `    <nav class="side-nav">
      <div class="side-nav__head">
        <span class="side-nav__eyebrow" data-i18n="docs.eyebrow">Documentación</span>
        <a class="side-nav__project" href="${u(pagePath(project.slug, "index"))}">
          <span class="side-nav__project-icon">${renderIcon(project.icon)}</span>
          <span class="side-nav__project-name" data-i18n="proj.${project.slug}.name">${escapeHtml(project.name)}</span>
        </a>
      </div>
      <p class="side-nav__group" data-i18n="docs.sidebarTitle">En esta documentación</p>
      <ol class="side-nav__list">
${links}
      </ol>
      <div class="side-nav__foot">
        <a class="side-nav__all" href="${u("/projects/")}">${renderIcon("left")}<span data-i18n="docs.allProjects">Todos los proyectos</span></a>
        <div class="side-nav__switch">
          <span class="side-nav__switch-label" data-i18n="docs.otherProjects">Otros proyectos</span>
          <ul class="side-nav__switch-list">
${others}
          </ul>
        </div>
      </div>
    </nav>`;
}

function renderToc(doc) {
  if (!doc.toc.length) return "";
  const items = doc.toc
    .map((entry) => {
      const cls = entry.level === 3 ? ' class="toc__h3"' : "";
      return `      <li><a${cls} href="#${entry.id}">${escapeHtml(entry.text)}</a></li>`;
    })
    .join("\n");
  return `    <p class="toc__title" data-i18n="docs.tocTitle">En esta página</p>
    <ol class="toc__list">
${items}
    </ol>
    <p class="toc__progress" aria-hidden="true"><span></span></p>`;
}

function renderBreadcrumb(project, page) {
  return `    <nav class="breadcrumb" aria-label="breadcrumb">
      <a href="${u("/")}">Docs</a>
      <span class="breadcrumb__sep">/</span>
      <a href="${u(pagePath(project.slug, "index"))}" data-i18n="proj.${project.slug}.name">${escapeHtml(project.name)}</a>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current" data-i18n="page.${project.slug}.${page.slug}">${escapeHtml(page.title.es)}</span>
    </nav>`;
}

function renderPager(project, position) {
  const prev = project.pages[position - 1];
  const next = project.pages[position + 1];

  const card = (page, direction) => {
    if (!page) return '    <span class="pager__spacer" aria-hidden="true"></span>';
    const key = `page.${project.slug}.${page.slug}`;
    const modifier = direction === "next" ? " pager__link--next" : "";
    return `    <a class="pager__link${modifier}" href="${u(pagePath(project.slug, page.slug))}">
      <span class="pager__label">${renderIcon(direction === "next" ? "right" : "left")}<span data-i18n="docs.${direction}">${direction === "next" ? "Siguiente" : "Anterior"}</span></span>
      <span class="pager__title" data-i18n="${key}">${escapeHtml(DICT.es[key])}</span>
    </a>`;
  };

  return `    <nav class="pager reveal" aria-label="paginación">
${card(prev, "prev")}
${card(next, "next")}
    </nav>`;
}

function renderDocPage(project, entry, position) {
  const page = entry; // loadProject aplana la página sobre la entrada
  const activePath = pagePath(project.slug, page.slug);
  const title = DICT.es[`page.${project.slug}.${page.slug}`];

  const bodyHtml = `
${renderBreadcrumb(project, page)}
    <header class="doc-head reveal">
      <p class="doc-head__kicker">${renderIcon(project.icon)}<span data-i18n="proj.${project.slug}.name">${escapeHtml(project.name)}</span></p>
      <h1 class="doc-head__title" data-i18n="page.${project.slug}.${page.slug}">${escapeHtml(title)}</h1>
      <p class="doc-head__desc" data-content-key="desc">${escapeHtml(entry.variants.es.description)}</p>
      <div class="doc-head__meta">
        <span>${renderIcon("calendar")}<span data-i18n="docs.updated">Última revisión</span> <time datetime="${entry.updated}" data-i18n-date>${formatDate(entry.updated, "es")}</time></span>
        <span>${renderIcon("clock")}<span data-content-key="readtime">${entry.variants.es.readTime} min de lectura</span></span>
        <a class="doc-head__edit" href="${sourceFile(project, page, "es")}" data-content-key="editHref" data-content-attr="href" target="_blank" rel="noopener noreferrer">${renderIcon("code")}<span data-i18n="docs.editOnGithub">Editar esta página en GitHub</span></a>
      </div>
    </header>
    <article class="doc-body reveal" lang="es" data-content-key="body" data-content-language>
${entry.variants.es.html}
    </article>
${renderPager(project, position)}
    <p class="source-note reveal" data-i18n="docs.sourceNote">Documentación escrita a mano para este sitio, basada en el README y los docs del repositorio.</p>`;

  const fields = (lang) => ({
    body: entry.variants[lang].html,
    desc: entry.variants[lang].description,
    readtime: `${entry.variants[lang].readTime} ${DICT[lang]["docs.readTime"]}`,
    editHref: sourceFile(project, page, lang),
    toc: renderToc(entry.variants[lang]).replace(/^ {4}/gm, ""),
  });

  return renderLayout({
    title,
    description: entry.variants.es.description,
    bodyHtml,
    activePath,
    layout: "docs",
    sidebarHtml: renderSidebar(project, page.slug),
    tocHtml: renderToc(entry.variants.es),
    translations: Object.fromEntries(
      LANGUAGES.map((lang) => [lang, {
        title: `${DICT[lang][`page.${project.slug}.${page.slug}`]} · ${project.name} — Docs de ${SITE_NAME}`,
        description: entry.variants[lang].description,
        fields: fields(lang),
      }])
    ),
  });
}

/* ------------------------------------------------------------------ */
/* Tarjetas de proyecto                                                */
/* ------------------------------------------------------------------ */

function projectCard(project) {
  const pages = project.pages.length;
  const demo = project.demo
    ? `<a class="btn btn--ghost" href="${project.demo}" target="_blank" rel="noopener noreferrer">${renderIcon("play")}<span data-i18n="projects.demo">Probar</span></a>`
    : "";
  return `      <article class="doc-card reveal" data-group="${groupSlugOf(project.slug)}" data-name="${escapeHtml(project.name.toLowerCase())}">
        <div class="doc-card__top">
          <span class="doc-card__icon">${renderIcon(project.icon)}</span>
          <span class="doc-card__heading">
            <span class="doc-card__name" data-i18n="proj.${project.slug}.name">${escapeHtml(project.name)}</span>
            <span class="doc-card__repo">${GH_USER}/${project.repo}</span>
          </span>
          <span class="doc-card__arrow">${renderIcon("right")}</span>
        </div>
        <p class="doc-card__tagline" data-i18n="proj.${project.slug}.tagline">${escapeHtml(project.tagline.es)}</p>
        <p class="doc-card__summary" data-i18n="proj.${project.slug}.summary">${escapeHtml(project.summary.es)}</p>
        <div class="doc-card__meta">
          <span class="pill pill--lang" style="--lang-color:${project.languageColor}">${escapeHtml(project.language)}</span>
          <span>${renderIcon("file")}<span>${pages}</span> <span data-i18n="projects.pages">páginas</span></span>
          <span>${renderIcon("gauge")}<span data-i18n="proj.${project.slug}.status">${escapeHtml(project.status.es)}</span></span>
        </div>
        <div class="doc-card__links">
          <a class="btn btn--primary" href="${u(pagePath(project.slug, "index"))}">${renderIcon("book")}<span data-i18n="projects.openDocs">Abrir documentación</span></a>
          ${demo}
          <a class="btn btn--ghost" href="${github(project.repo)}" target="_blank" rel="noopener noreferrer">${renderIcon("github")}<span data-i18n="projects.code">Código</span></a>
        </div>
      </article>`;
}

function groupSlugOf(slug) {
  return GROUPS.find((group) => group.projects.includes(slug))?.slug || "otros";
}

/* ------------------------------------------------------------------ */
/* Páginas del sitio                                                   */
/* ------------------------------------------------------------------ */

function totalPages() {
  return PROJECTS.reduce((sum, project) => sum + project.pages.length, 0);
}

function buildHome() {
  const hero = `  <section class="hero docs-hero">
    <div class="hero__inner">
      <div class="hero__content">
        <p class="docs-hero__kicker reveal" data-i18n="home.kicker">Documentación</p>
        <h1 class="hero__title reveal" data-i18n="home.title">Todos mis proyectos, <span class="hero__title-accent">documentados</span></h1>
        <p class="hero__subtitle reveal" data-i18n="home.subtitle">Un solo sitio con la documentación de todo lo que construyo.</p>
        <div class="hero__cta docs-hero__cta reveal">
          <a class="btn btn--primary" href="${u(pagePath(PROJECTS[0].slug, "index"))}">${renderIcon("book")}<span data-i18n="home.ctaPrimary">Empezar a leer</span></a>
          <a class="btn btn--ghost" href="${u("/projects/")}">${renderIcon("layers")}<span data-i18n="home.ctaSecondary">Ver todos los proyectos</span></a>
        </div>
        <div class="docs-hero__meta reveal">
          <span>${renderIcon("github")}<a href="${github("Docs")}" target="_blank" rel="noopener noreferrer">github.com/${GH_USER}/Docs</a></span>
          <span>${renderIcon("globe")}<a href="${mainSite("/")}" data-i18n="footer.mainSite">Mi web</a></span>
          <span>${renderIcon("lang")}ES · EN</span>
        </div>
      </div>
      <div class="hero__visual reveal">
        <div class="stack-card">
          <div class="stack-card__top">
            <span>~/docs</span>
            <span class="stack-card__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>
          <div class="stack-card__lines">
${PROJECTS.map((project) => `            <span class="stack-card__line"><span class="stack-card__prompt">›</span>${escapeHtml(project.name)}</span>`).join("\n")}
            <span class="stack-card__line stack-card__line--muted"><span class="stack-card__prompt">$</span><span data-content-key="stackFoot">${totalPages()} páginas · 2 idiomas</span></span>
          </div>
          <a class="stack-card__foot" href="${u("/projects/")}"><span data-i18n="docs.allProjects">Todos los proyectos</span> →</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="github__stats stat-strip reveal">
      <div class="stat"><span class="stat__value">${PROJECTS.length}</span><span class="stat__label" data-i18n="home.stats.projects">proyectos</span></div>
      <div class="stat"><span class="stat__value">${totalPages()}</span><span class="stat__label" data-i18n="home.stats.pages">páginas</span></div>
      <div class="stat"><span class="stat__value">2</span><span class="stat__label" data-i18n="home.stats.languages">idiomas</span></div>
      <div class="stat"><span class="stat__value">${BUILD_DATE.slice(5).replace("-", "/")}</span><span class="stat__label" data-i18n="home.stats.updated">actualizada</span></div>
    </div>
${GROUPS.map((group) => `    <div class="group reveal">
      <div class="group__head">
        <div>
          <h2 class="group__title">${renderIcon(group.icon)}<span data-i18n="group.${group.slug}.title">${escapeHtml(group.title.es)}</span></h2>
          <p class="group__sub" data-i18n="group.${group.slug}.sub">${escapeHtml(group.sub.es)}</p>
        </div>
        <span class="group__count">${group.projects.length} ${DICT.es["projects.pages"]}</span>
      </div>
      <div class="projects__grid" data-stagger>
${group.projects.map((slug) => projectCard(projectBySlug(slug))).join("\n")}
      </div>
    </div>`).join("\n")}
  </section>

  <section class="section">
    <div class="section__head reveal">
      <h2 class="section__title" data-i18n="home.guide.title">Cómo están organizadas las guías</h2>
      <p class="section__sub" data-i18n="home.guide.sub">Todas siguen la misma anatomía, para que sepas dónde buscar.</p>
    </div>
    <div class="skills__grid">
${["overview", "install", "usage", "deep", "reference"].map((key) => `      <div class="skill-card reveal">
        <span class="skill-card__icon" data-i18n="home.guide.${key}.num">${""}</span>
        <h3 data-i18n="home.guide.${key}.title">Sección</h3>
        <p data-i18n="home.guide.${key}.desc">Descripción.</p>
      </div>`).join("\n")}
    </div>
  </section>

  <section class="section" id="about-docs">
    <div class="about__grid">
      <div class="reveal">
        <div class="section__head">
          <h2 class="section__title" data-i18n="home.about.title">Sobre esta documentación</h2>
          <p class="section__sub" data-i18n="home.about.sub">Cómo está hecha y cómo se mantiene.</p>
        </div>
        <p class="about__text" data-i18n="home.about.text1">Texto.</p>
        <p class="about__text" data-i18n="home.about.text2">Texto.</p>
        <h3 class="about__card-title" data-i18n="home.contribute.title">¿Ves un error?</h3>
        <p class="about__text" data-i18n="home.contribute.text">Toda la documentación está en un repositorio público.</p>
        <div class="hero__cta">
          <a class="btn btn--ghost" href="${github("Docs", "/issues/new")}" target="_blank" rel="noopener noreferrer">${renderIcon("alert")}<span data-i18n="home.contribute.issue">Abrir una issue</span></a>
          <a class="btn btn--ghost" href="${github("Docs", "/edit/main/content/docs")}" target="_blank" rel="noopener noreferrer">${renderIcon("code")}<span data-i18n="home.contribute.pr">Proponer un cambio</span></a>
          <a class="btn btn--ghost" href="mailto:${"jaimegamingpro@gmail.com"}">${renderIcon("mail")}<span data-i18n="home.contribute.email">Escribirme un correo</span></a>
        </div>
      </div>
      <div class="about__card reveal">
        <p class="about__card-top" data-i18n="home.about.card.label">CÓMO FUNCIONA</p>
        <h3 class="about__card-title" data-i18n="home.about.card.title">Escrita a mano, generada con Node</h3>
        <p class="about__card-copy" data-i18n="home.about.card.text">Cada página es un Markdown en content/docs/.</p>
        <p class="about__card-stamp" data-i18n="home.about.card.stamp">VER EL REPOSITORIO ↗</p>
        <div class="public-profile">
          <dl>
            <div><dt data-i18n="home.about.row.stack">Generador</dt><dd>Node · scripts/build.mjs</dd></div>
            <div><dt data-i18n="home.about.row.palette">Paleta</dt><dd>#0d100d · #c8eb85</dd></div>
            <div><dt data-i18n="home.about.row.fonts">Tipografías</dt><dd>Space Grotesk · DM Sans · IBM Plex Mono</dd></div>
            <div><dt data-i18n="home.about.row.host">Publicación</dt><dd>GitHub Pages</dd></div>
            <div><dt data-i18n="home.about.row.search">Buscador</dt><dd data-i18n="home.about.row.searchValue">Índice estático, sin servicios externos</dd></div>
          </dl>
        </div>
        <a class="profile-card__footer" href="${github("Docs")}" target="_blank" rel="noopener noreferrer">github.com/${GH_USER}/Docs ↗</a>
      </div>
    </div>
  </section>`;

  return renderLayout({
    title: "",
    description: DICT.es["meta.home.description"],
    bodyHtml: hero,
    activePath: "/",
    layout: "home",
    translations: Object.fromEntries(LANGUAGES.map((lang) => [lang, {
      title: DICT[lang]["meta.home.title"],
      description: DICT[lang]["meta.home.description"],
      fields: { stackFoot: lang === "es" ? `${totalPages()} páginas · 2 idiomas` : `${totalPages()} pages · 2 languages` },
    }])),
  });
}

function buildProjectsIndex() {
  const chips = GROUPS.map((group) => `      <button class="filter-chip reveal" type="button" data-filter="${group.slug}" aria-pressed="false">${renderIcon(group.icon)}<span data-i18n="group.${group.slug}.title">${escapeHtml(group.title.es)}</span><span class="filter-chip__count">${group.projects.length}</span></button>`).join("\n");

  const bodyHtml = `  <section class="section">
    <div class="section__head reveal">
      <p class="contact-eyebrow" data-i18n="docs.eyebrow">Documentación</p>
      <h1 class="section__title" data-i18n="projects.title">Proyectos</h1>
      <p class="section__sub" data-i18n="projects.sub">Toda la documentación, proyecto por proyecto.</p>
    </div>
    <div class="filter-bar" role="group" aria-label="filtro">
      <button class="filter-chip reveal" type="button" data-filter="all" aria-pressed="true">${renderIcon("list")}<span data-i18n="projects.group.all">Todos</span><span class="filter-chip__count">${PROJECTS.length}</span></button>
${chips}
    </div>
    <div class="projects__grid" id="projectCards" data-stagger>
${PROJECTS.map((project) => projectCard(project)).join("\n")}
    </div>
    <p class="pindex__empty" id="projectEmpty" hidden data-i18n="projects.empty">No hay proyectos en esta categoría.</p>
  </section>`;

  return renderLayout({
    title: DICT.es["projects.title"],
    description: DICT.es["meta.projects.description"],
    bodyHtml,
    activePath: "/projects/",
    layout: "projects",
    translations: Object.fromEntries(LANGUAGES.map((lang) => [lang, {
      title: DICT[lang]["meta.projects.title"],
      description: DICT[lang]["meta.projects.description"],
      fields: {},
    }])),
  });
}

function buildStatus() {
  // Misma página que /status/ en la web: el resumen se consulta en vivo al panel
  // de incident.io y el iframe solo se carga si quien lee lo pide, porque es un
  // tercero que puede usar sus propias cookies. La lógica vive en main.js.
  const bodyHtml = `  <section class="section status-page">
    <div class="section__head reveal">
      <h1 class="section__title" data-i18n="status.title">Estado del servicio</h1>
      <p class="section__sub" data-i18n="status.sub">Estado en directo de la web, la documentación y los proyectos, desde el panel oficial de incident.io.</p>
    </div>
    <div class="status-page__bar reveal">
      <p class="status-page__note" data-i18n="status.note">Datos del panel oficial de estado</p>
      <a class="btn btn--ghost" href="https://statuspage.incident.io/jaime-gaming" target="_blank" rel="noopener noreferrer" data-i18n="status.open">Abrir panel completo ↗</a>
    </div>
    <div class="status-summary reveal" id="statusSummary" data-state="loading" data-api="https://statuspage.incident.io/jaime-gaming/api/v2/summary.json" aria-live="polite" aria-busy="true">
      <div class="status-summary__head">
        <span class="status-summary__dot" aria-hidden="true"></span>
        <div class="status-summary__copy">
          <strong class="status-summary__title" id="statusOverall" data-i18n="status.loading">Consultando el estado…</strong>
          <span class="status-summary__meta" id="statusUpdated"></span>
        </div>
      </div>
      <ul class="status-components" id="statusComponents" aria-label="Componentes del servicio" data-i18n-aria="status.componentsAria"></ul>
      <p class="status-summary__error" id="statusError" role="status" data-i18n="status.error" hidden>No se pudo consultar el estado en directo. Puedes abrir el panel completo.</p>
    </div>
    <section class="status-maintenance" id="statusMaintenance" aria-labelledby="statusMaintenanceTitle" hidden>
      <h2 id="statusMaintenanceTitle" data-i18n="status.maintenanceTitle">Mantenimiento programado</h2>
      <div id="statusMaintenanceBody"></div>
    </section>
    <div class="status-page__frame reveal" id="statusFrameWrap">
      <div class="status-page__placeholder" id="statusFramePlaceholder">
        <p data-i18n="status.frameNotice">El panel completo pertenece a incident.io y solo se carga si lo pides. Al cargarlo puede usar sus propias cookies.</p>
        <button class="btn btn--ghost" id="loadStatusFrame" type="button" data-i18n="status.loadFrame">Cargar panel incrustado</button>
      </div>
    </div>
    <p class="status-page__hint" data-i18n="status.hint">El resumen se actualiza al abrir esta página. Si el panel incrustado no aparece, ábrelo con el botón superior.</p>
  </section>`;

  return renderLayout({
    title: DICT.es["status.title"],
    description: DICT.es["status.sub"],
    bodyHtml,
    activePath: "/status/",
    layout: "status",
    translations: Object.fromEntries(LANGUAGES.map((lang) => [lang, {
      title: DICT[lang]["status.title"],
      description: DICT[lang]["status.sub"],
      fields: {},
    }])),
  });
}

function build404() {
  const bodyHtml = `  <section class="section">
    <div class="section__head section__head--center reveal">
      <p class="contact-eyebrow">404</p>
      <h1 class="section__title" data-i18n="notFound.title">Página no encontrada</h1>
      <p class="section__sub" data-i18n="notFound.sub">Puede que el enlace esté roto o que esta guía se haya movido.</p>
      <div class="hero__cta hero__cta--center">
        <a class="btn btn--primary" href="${u("/")}">${renderIcon("compass")}<span data-i18n="notFound.home">Volver al inicio de la documentación</span></a>
        <a class="btn btn--ghost" href="${u("/projects/")}">${renderIcon("layers")}<span data-i18n="notFound.projects">Ver todos los proyectos</span></a>
      </div>
    </div>
  </section>`;

  return renderLayout({
    title: "404",
    description: "Página no encontrada.",
    bodyHtml,
    activePath: "/404/",
    layout: "notfound",
    noindex: true,
  });
}

/* ------------------------------------------------------------------ */
/* Índice de búsqueda y sitemap                                        */
/* ------------------------------------------------------------------ */

/** Divide el HTML en tramos por encabezado para indexar cada apartado. */
function splitSections(html) {
  const pattern = /<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const matches = [...html.matchAll(pattern)];
  const lead = matches.length ? html.slice(0, matches[0].index) : html;
  const sections = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : html.length;
    return {
      id: match[2],
      level: Number(match[1]),
      text: collapse(stripTags(match[3])),
      body: html.slice(start, end),
    };
  });
  return { lead, sections };
}

function buildSearchIndex(docs) {
  const entries = [];
  let order = 0;

  for (const project of docs) {
    for (const entry of project.pages) {
      const url = u(pagePath(project.slug, entry.slug));
      const crumbBase = `${project.name}`;
      for (const lang of LANGUAGES) {
        const doc = entry.variants[lang];
        const pageTitle = DICT[lang][`page.${project.slug}.${entry.slug}`];
        const { lead, sections } = splitSections(doc.html);

        entries.push({
          lang, order: order++, project: project.slug, projectName: project.name,
          icon: project.icon, url, crumb: crumbBase, title: pageTitle, heading: "",
          excerpt: excerpt(lead, 220) || excerpt(doc.html, 220),
        });

        for (const [position, section] of sections.entries()) {
          // Una sección contenedora (un h2 seguido de h3) no tiene cuerpo
          // propio: su excerpt se toma del texto de las secciones que cuelgan
          // de ella, para que la búsqueda no devuelva resultados en blanco.
          let snippet = excerpt(section.body, 220);
          if (!snippet) {
            const nested = [];
            for (let next = position + 1; next < sections.length && sections[next].level > section.level; next++) {
              nested.push(stripTags(sections[next].body));
            }
            snippet = excerpt(nested.join(" "), 220);
          }

          entries.push({
            lang, order: order++, project: project.slug, projectName: project.name,
            icon: entry.icon, url: `${url}#${section.id}`,
            crumb: `${crumbBase} · ${pageTitle}`, title: pageTitle, heading: section.text,
            excerpt: snippet,
          });
        }
      }
    }
  }

  return { generated: BUILD_DATE, count: entries.length, entries };
}

function buildSitemap(docs) {
  const urls = ["/", "/projects/", "/status/"];
  for (const project of docs) {
    for (const page of project.pages) urls.push(pagePath(project.slug, page.slug));
  }
  const body = urls
    .map((url) => `  <url><loc>${CANONICAL_ORIGIN}${url}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function buildRobots() {
  // CANONICAL_ORIGIN ya lleva BASE sin la barra final, así que el Sitemap se
  // compone sumándole la ruta. Añadir BASE otra vez duplicaría /Docs/Docs/.
  return `User-agent: *
Allow: /

Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml
`;
}

/* ------------------------------------------------------------------ */
/* Limpieza de páginas huérfanas                                       */
/* ------------------------------------------------------------------ */

async function cleanOrphans(docs) {
  const validPages = new Map(docs.map((project) => [project.slug, new Set(project.pages.map((p) => p.slug))]));
  let entries = [];
  try {
    entries = await readdir(ROOT, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (KEEP_TOP_LEVEL.has(name) || name.startsWith(".")) continue;

    if (!GENERATED_TOP_LEVEL.has(name)) {
      await rm(path.join(ROOT, name), { recursive: true, force: true });
      console.log(`removed orphaned directory ${name}/`);
      continue;
    }

    if (!validPages.has(name)) continue;
    const allowed = validPages.get(name);
    for (const child of await readdir(path.join(ROOT, name), { withFileTypes: true })) {
      if (child.isDirectory() && !allowed.has(child.name)) {
        await rm(path.join(ROOT, name, child.name), { recursive: true, force: true });
        console.log(`removed orphaned page ${name}/${child.name}/`);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const started = Date.now();

  await mkdir(path.join(ROOT, "assets", "img"), { recursive: true });
  await writeFile(path.join(ROOT, "assets", "img", "icons.svg"), iconSprite, "utf8");
  console.log("built assets/img/icons.svg");

  const docs = [];
  for (const project of PROJECTS) docs.push(await loadProject(project));

  await cleanOrphans(docs);

  for (const project of docs) {
    for (const [position, entry] of project.pages.entries()) {
      const html = renderDocPage(project, entry, position);
      const rel = pagePath(project.slug, entry.slug).replace(/^\//, "");
      await writePage(`${rel}index.html`, html);
    }
  }

  await Promise.all([
    writePage("index.html", buildHome()),
    writePage("projects/index.html", buildProjectsIndex()),
    writePage("status/index.html", buildStatus()),
    writePage("404.html", build404()),
    writePage("sitemap.xml", buildSitemap(docs)),
    writePage("robots.txt", buildRobots()),
    // Pages procesa con Jekyll lo que sirve desde una rama, y Jekyll lee {{…}}
    // como Liquid. website/build/index.html documenta la sustitución {{CONTACT}}
    // de la web principal dentro de un <code>: sin este fichero aparecería vacía
    // y sin ningún error. Va vacío; su presencia es lo que cuenta.
    writePage(".nojekyll", ""),
  ]);

  const index = buildSearchIndex(docs);
  await mkdir(path.join(ROOT, "assets", "data"), { recursive: true });
  await writeFile(path.join(ROOT, "assets", "data", "search-index.json"), JSON.stringify(index), "utf8");
  console.log(`built assets/data/search-index.json (${index.count} entradas)`);

  const pages = docs.reduce((sum, project) => sum + project.pages.length, 0);
  const readme = await syncReadme(pages);
  if (readme) console.log(readme);
  console.log(`\n${pages} guías · ${pages * LANGUAGES.length} páginas · ${docs.length} proyectos · ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
