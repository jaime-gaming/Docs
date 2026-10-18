/**
 * Markdown -> HTML para las páginas de documentación.
 *
 * Convenciones de autoría:
 *   - Los enlaces que empiezan por "/" son del sitio de docs y reciben BASE.
 *   - Los que empiezan por "~/" apuntan a la web principal (fuera de BASE).
 *   - Los encabezados generan su propio id y alimentan el índice lateral.
 *   - Las citas con [!NOTE] [!TIP] [!IMPORTANT] [!WARNING] [!CAUTION]
 *     se convierten en bloques destacables con el título traducido.
 *   - Las tablas se envuelven para poder desplazarse en móvil.
 */
import { marked } from "marked";
import { main, u } from "./config.mjs";

const ALERTS = {
  NOTE: { variant: "note", icon: "bulb", key: "callout.note", fallback: "Nota" },
  TIP: { variant: "tip", icon: "sparkles", key: "callout.tip", fallback: "Consejo" },
  IMPORTANT: { variant: "danger", icon: "alert", key: "callout.danger", fallback: "Importante" },
  WARNING: { variant: "warning", icon: "warn", key: "callout.warning", fallback: "Aviso" },
  CAUTION: { variant: "danger", icon: "warn", key: "callout.danger", fallback: "Importante" },
};

const WORDS_PER_MINUTE = 210;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, "").replace(/&([a-z]+|#\d+);/gi, " ");
}

/** Genera slugs estables y sin acentos, evitando duplicados por página. */
function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base = String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "seccion";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };
}

/** Reescribe href internos para que funcionen bajo BASE. */
function rewriteHref(href) {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|data:)/i.test(href)) return href;
  if (href.startsWith("#")) return href;
  if (href.startsWith("~/")) return main(href.slice(1));
  if (href.startsWith("/")) return u(href);
  return href; // relativas: se resuelven contra la ruta actual
}

function externalAttrs(href) {
  return /^https?:/i.test(href) && !href.includes("jaime-gaming.github.io")
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";
}

/**
 * Convierte Markdown en HTML y devuelve también el índice de apartados.
 * @returns {{ html: string, toc: Array, words: number, readTime: number }}
 */
export function renderMarkdown(source, { lang = "es", dict = {} } = {}) {
  const slug = makeSlugger();
  const toc = [];
  const renderer = new marked.Renderer();

  renderer.heading = (text, level, raw) => {
    const plain = stripTags(raw ?? text).trim();
    const id = slug(plain);
    if (level >= 2 && level <= 3) toc.push({ level, id, text: plain });
    return `<h${level} id="${id}">${text}</h${level}>\n`;
  };

  renderer.table = (header, body) =>
    `<div class="doc-table"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`;

  renderer.code = (code, infostring) => {
    const language = (infostring || "").trim().split(/\s+/)[0] || "";
    const cls = language ? ` class="language-${escapeHtml(language)}"` : "";
    return `<pre data-lang="${escapeHtml(language)}"><code${cls}>${escapeHtml(code)}</code></pre>\n`;
  };

  renderer.codespan = (code) => `<code>${code}</code>`;

  renderer.link = (href, title, text) => {
    const target = rewriteHref(href);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(target)}"${titleAttr}${externalAttrs(target)}>${text}</a>`;
  };

  renderer.image = (href, title, text) => {
    const target = rewriteHref(href);
    const alt = escapeHtml(text || "");
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<img src="${escapeHtml(target)}" alt="${alt}"${titleAttr} loading="lazy" />`;
  };

  renderer.blockquote = (quote) => {
    const match = quote.match(/^\s*<p>\[!(\w+)\]\s*(?:<br\s*\/?>)?\s*([\s\S]*)$/i);
    if (match) {
      const alert = ALERTS[match[1].toUpperCase()];
      if (alert) {
        const title = dict[alert.key] || alert.fallback;
        const body = match[2].replace(/<\/p>\s*$/, "");
        return `<div class="callout callout--${alert.variant}">
  <span data-icon="${alert.icon}"></span>
  <p class="callout__title">${escapeHtml(title)}</p>
  <div class="callout__body">${body}</div>
</div>\n`;
      }
    }
    return `<blockquote>${quote}</blockquote>\n`;
  };

  renderer.hr = () => '<hr />\n';
  renderer.listitem = (text, task, checked) => {
    if (!task) return `<li>${text}</li>\n`;
    const box = checked
      ? '<input class="readme-checkbox" type="checkbox" checked disabled /> '
      : '<input class="readme-checkbox" type="checkbox" disabled /> ';
    return `<li>${box}${text}</li>\n`;
  };

  const html = marked.parse(source, { renderer, gfm: true, breaks: false, pedantic: false });

  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return {
    html,
    toc,
    words,
    readTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

export { escapeHtml, stripTags, ALERTS };
