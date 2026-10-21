/**
 * Configuración global del sitio de documentación.
 *
 * BASE permite publicar en cualquier ruta sin tocar el contenido:
 *   "/Docs/" -> https://jaime-gaming.github.io/Docs/
 *   "/"      -> https://docs.jaime-gaming.github.io/
 */

import path from "node:path";

export const BASE = process.env.DOCS_BASE || "/Docs/";

/** Raíz del repositorio y carpeta de los Markdown editables. */
export const ROOT = path.resolve(import.meta.dirname, "..");
export const DOCS_SOURCE = path.join(ROOT, "content", "docs");

export const SITE_NAME = "Jaime Gaming";
export const DOCS_NAME = "Docs";
export const SITE_URL = "https://jaime-gaming.github.io";
export const CANONICAL_ORIGIN = SITE_URL + BASE.replace(/\/$/, "");

export const GH_USER = "jaime-gaming";
export const EMAIL = "jaimegamingpro@gmail.com";
export const DISCORD_USER_ID = "984083829767675965";
export const YOUTUBE = "https://www.youtube.com/@jaimegaming5731";
export const X_HANDLE = "JaimeGamingPro";

export const LANGUAGES = ["es", "en"];
export const DEFAULT_LANG = "es";

/** Convierte una ruta absoluta del sitio en una URL con BASE aplicado. */
export function u(path = "/") {
  if (/^(https?:|mailto:|#|\/https?:)/.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  return `${BASE}${clean}`;
}

/** Enlace a la web principal (fuera de BASE). */
export function main(path = "/") {
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}

export function github(repo, path = "") {
  return `https://github.com/${GH_USER}/${repo}${path}`;
}
