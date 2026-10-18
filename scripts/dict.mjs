/**
 * Diccionario completo de interfaz.
 *
 * Une los textos estáticos de content/ui.mjs con las claves derivadas del
 * registro de proyectos. Así el sidebar, las tarjetas y los filtros se
 * generan una sola vez en HTML y se traducen en el navegador con
 * data-i18n, igual que la navegación de la web principal.
 */
import { UI } from "../content/ui.mjs";
import { GROUPS, LANGUAGES as LANGS, PROJECTS } from "./registry.mjs";

function buildDict() {
  const dict = { es: { ...UI.es }, en: { ...UI.en } };

  for (const lang of LANGS) {
    for (const project of PROJECTS) {
      dict[lang][`proj.${project.slug}.name`] = project.name;
      dict[lang][`proj.${project.slug}.tagline`] = project.tagline[lang];
      dict[lang][`proj.${project.slug}.summary`] = project.summary[lang];
      dict[lang][`proj.${project.slug}.status`] = project.status[lang];
      for (const page of project.pages) {
        dict[lang][`page.${project.slug}.${page.slug}`] = page.title[lang];
      }
    }
    for (const group of GROUPS) {
      dict[lang][`group.${group.slug}.title`] = group.title[lang];
      dict[lang][`group.${group.slug}.sub`] = group.sub[lang];
    }
  }

  return dict;
}

export const DICT = buildDict();
