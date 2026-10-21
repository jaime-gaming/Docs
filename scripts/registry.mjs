/**
 * Registro de proyectos documentados.
 *
 * Aquí solo se declara lo que es del proyecto: nombre, repositorio, lenguaje,
 * demo, resumen y grupo. Las páginas NO se listan: salen de los Markdown de
 * content/docs/<slug>/, que llevan en su front matter el título, el icono y el
 * orden. Así una página nueva no hay que apuntarla en ningún sitio.
 *
 *   Añadir una página = crear <pagina>.md y <pagina>.en.md en la carpeta del
 *   proyecto. `npm run new -- <proyecto> <pagina>` crea los dos.
 *
 * De ahí salen solos el sidebar, el recorrido del índice, las migas, la
 * paginación, el buscador, el sitemap y las cifras del README.
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DOCS_SOURCE, ROOT } from "./config.mjs";

const PROYECTOS = [
  {
    slug: "wave",
    repo: "Wave",
    name: "Wave",
    icon: "music",
    language: "TypeScript",
    languageColor: "#3178c6",
    demo: "https://jaime-gaming.github.io/Wave/",
    status: { es: "0.1.0 · activa", en: "0.1.0 · active" },
    tagline: {
      es: "Reproductor de música local-first para web, Android y Windows.",
      en: "A local-first music player for web, Android and Windows.",
    },
    summary: {
      es: "Un hogar para la música que ya tienes. Wave guarda tu colección en el dispositivo: sin cuenta, sin suscripción y sin subir audio a ningún servidor.",
      en: "A home for the music you already own. Wave keeps your collection on the device: no account, no subscription and no audio uploaded to any server.",
    },
    stack: ["TypeScript", "C# / WPF", "Kotlin", "Python", "Vite"],
  },
  {
    slug: "jaigent",
    repo: "jAIgent",
    name: "jAIgent",
    icon: "bot",
    language: "Python",
    languageColor: "#3572A5",
    demo: "",
    status: { es: "0.5.x · activa", en: "0.5.x · active" },
    tagline: {
      es: "Todos tus agentes de IA en un mismo sitio.",
      en: "All your agents in one place.",
    },
    summary: {
      es: "Un binario y diez proveedores. Los mismos tools en la terminal, en ChatGPT Web por MCP remoto, en Claude Desktop y en cualquier app que hable OpenAI. Con deshacer en cada escritura y tope de gasto.",
      en: "One binary, ten providers. The same tools in the terminal, in ChatGPT Web over remote MCP, in Claude Desktop and in any app that speaks OpenAI. With undo on every write and a hard spend cap.",
    },
    stack: ["Python 3.11+", "MCP", "OpenAI SDK", "SQLite"],
  },
  {
    slug: "hellbot",
    repo: "hellbot",
    name: "hellbot",
    icon: "flame",
    language: "Python",
    languageColor: "#3572A5",
    demo: "",
    status: { es: "producción · estable", en: "production · stable" },
    tagline: {
      es: "El bot de Discord que ejecuta el evento de resistencia Welcome to Hell.",
      en: "The Discord bot that runs the Welcome to Hell endurance event.",
    },
    summary: {
      es: "Mantén al menos a una persona real en un canal de voz durante 160 horas seguidas. Si el canal se vacía y nadie vuelve en el periodo de gracia, la partida muere para siempre.",
      en: "Keep at least one real human in a single voice channel for 160 consecutive hours. If that channel empties and nobody returns within the grace period, the run is dead permanently.",
    },
    stack: ["Python 3.10+", "discord.py", "SQLite", "aiohttp"],
  },
  {
    slug: "rngdle-infinite",
    repo: "RNGdle-Infinite",
    name: "RNGdle Infinite",
    icon: "dice",
    language: "JavaScript",
    languageColor: "#f1e05a",
    demo: "https://jaime-gaming.github.io/RNGdle-Infinite/",
    status: { es: "jugable · activa", en: "playable · active" },
    tagline: {
      es: "Un número, infinitas posibilidades.",
      en: "One number, infinite possibilities.",
    },
    summary: {
      es: "Tira un número entre 0 y 1.000.000 y descubre qué lo hace especial. Un incremental de navegador con EP, insignias, compañeros, skills, rebirth, prestige y rollback.",
      en: "Roll a number from 0 to 1,000,000 and find out what makes it special. A browser incremental with EP, badges, companions, skills, rebirth, prestige and rollback.",
    },
    stack: ["JavaScript", "Vite", "Web Worker", "localStorage"],
  },
  {
    slug: "daily-diary",
    repo: "daily-diary",
    name: "Diario",
    icon: "notebook",
    language: "JavaScript",
    languageColor: "#f1e05a",
    demo: "https://jaime-gaming.github.io/daily-diary/",
    status: { es: "completo · local", en: "complete · local" },
    tagline: {
      es: "Tu espacio personal: un diario minimalista y 100 % local.",
      en: "Your personal space: a minimalist, 100% local diary.",
    },
    summary: {
      es: "Sin backend, sin cuentas, sin IA y sin APIs externas. Los resúmenes, estadísticas y tendencias se calculan en tu navegador con reglas y plantillas de texto.",
      en: "No backend, no accounts, no AI and no external APIs. Summaries, statistics and trends are computed in your browser with rules and text templates.",
    },
    stack: ["JavaScript", "Vite", "localStorage", "Service Worker"],
  },
  {
    slug: "void",
    repo: "VOID",
    name: "VOID",
    icon: "ghost",
    language: "HTML",
    languageColor: "#e34c26",
    demo: "",
    status: { es: "beta · en desarrollo", en: "beta · in development" },
    tagline: {
      es: "Michael Burns desapareció el año pasado. ¿Quieres entrar?",
      en: "Michael Burns disappeared last year. Would you come in?",
    },
    summary: {
      es: "Un juego psicológico ambientado en una corporación misteriosa donde todo el mundo y todo desaparece. Interfaz CRT de alto contraste, en español e inglés.",
      en: "A psychological game set in a mysterious corporation where everyone and everything disappears. High-contrast CRT interface, in Spanish and English.",
    },
    stack: ["HTML", "CSS", "JavaScript"],
  },
  {
    slug: "website",
    repo: "jaime-gaming.github.io",
    name: "jaime-gaming.github.io",
    icon: "globe",
    language: "JavaScript",
    languageColor: "#f1e05a",
    demo: "https://jaime-gaming.github.io/",
    status: { es: "publicada · activa", en: "published · active" },
    tagline: {
      es: "El sitio personal que da origen a esta documentación.",
      en: "The personal site this documentation is built from.",
    },
    summary: {
      es: "Portfolio oscuro y bilingüe generado con Node: proyectos sincronizados desde GitHub, calendario de contribuciones, presencia de Discord y blog desde Markdown.",
      en: "Dark, bilingual portfolio generated with Node: projects synced from GitHub, contributions calendar, Discord presence and a Markdown blog.",
    },
    stack: ["Node", "JavaScript", "CSS", "GitHub Pages"],
  },
];

/** Front matter de un Markdown, con los campos que ordenan el sitio validados. */
function frontMatter(file, lang, slug, base) {
  const relativo = path.relative(ROOT, file);
  let data;
  try {
    data = matter.read(file).data;
  } catch {
    throw new Error(
      `Falta el archivo ${lang.toUpperCase()} de ${slug}/${base}: ${relativo}. ` +
        `Cada página existe en los dos idiomas; npm run new crea la pareja.`,
    );
  }
  for (const campo of ["title", "icon", "order"]) {
    if (data[campo] === undefined || data[campo] === "") {
      throw new Error(
        `A ${relativo} le falta «${campo}» en el front matter. ` +
          `Lleva title, icon, order y description (y blurb si quieres una frase propia en el recorrido del índice).`,
      );
    }
  }
  if (typeof data.order !== "number") {
    throw new Error(`${relativo}: «order» debe ser un número sin comillas (order: 20), no ${JSON.stringify(data.order)}.`);
  }
  return data;
}

/** Las páginas de un proyecto, leídas de su carpeta y ordenadas por «order». */
function pagesDe(slug) {
  const dir = path.join(DOCS_SOURCE, slug);
  let nombres;
  try {
    nombres = readdirSync(dir);
  } catch {
    throw new Error(`El proyecto «${slug}» no tiene carpeta de contenido: crea content/docs/${slug}/ con sus Markdown.`);
  }
  const en = nombres.filter((n) => n.endsWith(".en.md")).map((n) => n.slice(0, -".en.md".length));
  const bases = nombres.filter((n) => n.endsWith(".md") && !n.endsWith(".en.md")).map((n) => n.slice(0, -3));

  for (const suelto of en.filter((b) => !bases.includes(b))) {
    throw new Error(`content/docs/${slug}/${suelto}.en.md se ha quedado sin su versión española ${suelto}.md.`);
  }
  if (!bases.includes("index")) {
    throw new Error(`content/docs/${slug}/ necesita una página index.md (y index.en.md): es la portada de la guía.`);
  }

  const vistos = new Map();
  const paginas = bases.map((base) => {
    const es = frontMatter(path.join(dir, `${base}.md`), "es", slug, base);
    const enData = frontMatter(path.join(dir, `${base}.en.md`), "en", slug, base);
    if (es.icon !== enData.icon || es.order !== enData.order) {
      throw new Error(
        `${slug}/${base}: icon y order deben coincidir en los dos idiomas ` +
          `(es=${es.icon}/${es.order}, en=${enData.icon}/${enData.order}).`,
      );
    }
    if (vistos.has(es.order)) {
      throw new Error(`${slug}/${base} repite order ${es.order} con ${slug}/${vistos.get(es.order)}. Deja hueco: 10, 20, 30…`);
    }
    vistos.set(es.order, base);
    return {
      slug: base,
      icon: es.icon,
      order: es.order,
      title: { es: es.title, en: enData.title },
      // La frase del recorrido del índice. Si el archivo no trae blurb se usa la
      // description, que también vale: así una página nueva no necesita nada más.
      blurb: { es: es.blurb || es.description, en: enData.blurb || enData.description },
    };
  });

  return paginas.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** Los siete proyectos con sus páginas resueltas desde el disco. */
export const PROJECTS = PROYECTOS.map((project) => ({ ...project, pages: pagesDe(project.slug) }));

/** Grupos del índice general. */
export const GROUPS = [
  {
    slug: "apps",
    icon: "app",
    title: { es: "Aplicaciones y herramientas", en: "Apps & tools" },
    sub: {
      es: "Software que resuelve algo concreto: música, agentes y organización personal.",
      en: "Software that solves something concrete: music, agents and personal organisation.",
    },
    projects: ["wave", "jaigent", "daily-diary"],
  },
  {
    slug: "games",
    icon: "gamepad",
    title: { es: "Juegos", en: "Games" },
    sub: {
      es: "Del incremental de navegador al terror psicológico.",
      en: "From the browser incremental to psychological horror.",
    },
    projects: ["rngdle-infinite", "void"],
  },
  {
    slug: "bots",
    icon: "bot",
    title: { es: "Bots y eventos", en: "Bots & events" },
    sub: {
      es: "Automatización en directo para comunidades.",
      en: "Live automation for communities.",
    },
    projects: ["hellbot"],
  },
  {
    slug: "web",
    icon: "globe",
    title: { es: "Web", en: "Web" },
    sub: {
      es: "Los sitios que publico, incluido el que estás leyendo.",
      en: "The sites I publish, including the one you are reading.",
    },
    projects: ["website"],
  },
];

export const projectBySlug = (slug) => PROJECTS.find((p) => p.slug === slug);
export const groupOf = (slug) => GROUPS.find((g) => g.projects.includes(slug));

/** Ruta canónica de una página de documentación. */
export function pagePath(projectSlug, pageSlug) {
  return pageSlug === "index" ? `/${projectSlug}/` : `/${projectSlug}/${pageSlug}/`;
}

export { LANGUAGES } from "./config.mjs";
