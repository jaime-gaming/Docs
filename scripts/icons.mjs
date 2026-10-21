/**
 * Sprite de iconos generado durante el build.
 *
 * UI: lucide-static (mismo trazo 1.65 que la web principal).
 * Marcas: simple-icons (github, discord, youtube, x).
 * Se escribe en assets/img/icons.svg y se referencia con <use href="...#icon-nombre">.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { siGithub, siDiscord, siYoutube, siX } from "simple-icons";

import { u } from "./config.mjs";

/** nombre del sprite -> nombre del archivo en lucide-static/icons */
const uiIcons = {
  // Proyectos
  music: "music",
  bot: "bot",
  flame: "flame",
  dice: "dice-5",
  notebook: "notebook",
  ghost: "ghost",
  globe: "globe",
  // Páginas
  compass: "compass",
  download: "download",
  layers: "layers",
  monitor: "monitor",
  boxes: "boxes",
  shield: "shield-check",
  terminal: "square-terminal",
  cpu: "cpu",
  plug: "plug",
  puzzle: "puzzle",
  book: "book-open",
  scroll: "scroll-text",
  play: "play",
  sparkles: "sparkles",
  save: "save",
  help: "circle-help",
  layout: "layout-grid",
  database: "database",
  code: "code-xml",
  eye: "eye",
  hammer: "hammer",
  file: "file-text",
  // Grupos
  app: "app-window",
  gamepad: "gamepad-2",
  // Interfaz
  arrow: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  search: "search",
  menu: "menu",
  close: "x",
  external: "external-link",
  chevron: "chevron-right",
  down: "chevron-down",
  star: "star",
  fork: "git-fork",
  commit: "git-commit-horizontal",
  mail: "mail",
  message: "message-circle",
  video: "video",
  calendar: "calendar-days",
  clock: "clock",
  copy: "copy",
  check: "check",
  done: "circle-check",
  alert: "circle-alert",
  warn: "triangle-alert",
  bulb: "lightbulb",
  zap: "zap",
  package: "package",
  rocket: "rocket",
  list: "list",
  hash: "hash",
  lock: "lock",
  key: "key-round",
  refresh: "refresh-cw",
  sun: "sun",
  moon: "moon",
  panel: "panel-left",
  router: "router",
  workflow: "workflow",
  server: "server",
  drive: "hard-drive",
  settings: "settings",
  gauge: "gauge",
  type: "type",
  lang: "languages",
  link: "link-2",
  qr: "qr-code",
  heart: "heart",
  trophy: "trophy",
  medal: "medal",
  badge: "badge-check",
};

const brands = { github: siGithub, discord: siDiscord, youtube: siYoutube, x: siX };

function readLucide(name) {
  const svg = readFileSync(new URL(`../node_modules/lucide-static/icons/${name}.svg`, import.meta.url), "utf8");
  return svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();
}

const symbols = Object.entries(uiIcons).map(
  ([name, filename]) => `<symbol id="icon-${name}" viewBox="0 0 24 24">${readLucide(filename)}</symbol>`
);
for (const [name, brand] of Object.entries(brands)) {
  symbols.push(`<symbol id="icon-${name}" viewBox="0 0 24 24"><path d="${brand.path}" fill="currentColor" stroke="none"/></symbol>`);
}

export const iconSprite = `<svg xmlns="http://www.w3.org/2000/svg"><defs>${symbols.join("")}</defs></svg>\n`;
export const iconVersion = createHash("sha256").update(iconSprite).digest("hex").slice(0, 12);
export const knownIcons = new Set([...Object.keys(uiIcons), ...Object.keys(brands)]);

/**
 * Ruta absoluta del sprite, ya con BASE.
 *
 * Imprescindible: el sitio se publica en https://jaime-gaming.github.io/Docs/,
 * así que un href "/assets/…" apuntaría al sprite de la web principal y ningún
 * icono se pintaría.
 */
export const spriteUrl = `${u("/assets/img/icons.svg")}?v=${iconVersion}`;

export function renderIcon(name, className = "icon") {
  if (!knownIcons.has(name)) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${spriteUrl}#icon-${name}"></use></svg>`;
}

/** Sustituye <span data-icon="x"></span> por el SVG correspondiente. */
export function expandIcons(html) {
  return html.replace(/<span data-icon="([a-z0-9-]+)"><\/span>/g, (_, name) => renderIcon(name));
}
