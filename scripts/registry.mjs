/**
 * Registro de proyectos documentados.
 *
 * Cada proyecto declara sus páginas en orden; el build busca
 * content/docs/<slug>/<page>.md y content/docs/<slug>/<page>.en.md.
 * Añadir una página = añadir dos Markdown y una entrada aquí.
 */

export const PROJECTS = [
  {
    slug: "wave",
    repo: "Wave",
    name: "Wave",
    icon: "music",
    language: "TypeScript",
    languageColor: "#3178c6",
    demo: "https://jaime-gaming.github.io/Wave/",
    license: "MIT",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "install", icon: "download", title: { es: "Instalación", en: "Installation" } },
      { slug: "features", icon: "layers", title: { es: "Funciones y uso", en: "Features & usage" } },
      { slug: "platforms", icon: "monitor", title: { es: "Plataformas", en: "Platforms" } },
      { slug: "architecture", icon: "boxes", title: { es: "Arquitectura", en: "Architecture" } },
      { slug: "privacy", icon: "shield", title: { es: "Privacidad y datos", en: "Privacy & data" } },
      { slug: "dev", icon: "code", title: { es: "Desarrollo", en: "Development" } },
    ],
  },
  {
    slug: "jaigent",
    repo: "jAIgent",
    name: "jAIgent",
    icon: "bot",
    language: "Python",
    languageColor: "#3572A5",
    demo: "",
    license: "MIT",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "install", icon: "download", title: { es: "Instalación y claves", en: "Install & API keys" } },
      { slug: "cli", icon: "terminal", title: { es: "Uso en la terminal", en: "Using the CLI" } },
      { slug: "models", icon: "cpu", title: { es: "Modelos y proveedores", en: "Models & providers" } },
      { slug: "mcp", icon: "plug", title: { es: "MCP y tu propia API", en: "MCP & your own API" } },
      { slug: "extend", icon: "puzzle", title: { es: "Skills, plugins y horarios", en: "Skills, plugins & schedules" } },
      { slug: "reference", icon: "book", title: { es: "Referencia de tools", en: "Tools reference" } },
      { slug: "security", icon: "shield", title: { es: "Seguridad", en: "Security" } },
    ],
  },
  {
    slug: "hellbot",
    repo: "hellbot",
    name: "hellbot",
    icon: "flame",
    language: "Python",
    languageColor: "#3572A5",
    demo: "",
    license: "",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "rules", icon: "scroll", title: { es: "Reglas del evento", en: "Event rules" } },
      { slug: "install", icon: "download", title: { es: "Instalación y despliegue", en: "Install & deploy" } },
      { slug: "commands", icon: "terminal", title: { es: "Comandos", en: "Commands" } },
      { slug: "dashboard", icon: "monitor", title: { es: "Dashboard en vivo", en: "Live dashboard" } },
      { slug: "architecture", icon: "boxes", title: { es: "Arquitectura", en: "Architecture" } },
    ],
  },
  {
    slug: "rngdle-infinite",
    repo: "RNGdle-Infinite",
    name: "RNGdle Infinite",
    icon: "dice",
    language: "JavaScript",
    languageColor: "#f1e05a",
    demo: "https://jaime-gaming.github.io/RNGdle-Infinite/",
    license: "",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "play", icon: "play", title: { es: "Cómo se juega", en: "How to play" } },
      { slug: "systems", icon: "sparkles", title: { es: "Sistemas y progresión", en: "Systems & progression" } },
      { slug: "save", icon: "save", title: { es: "Partida y sincronización", en: "Save & sync" } },
      { slug: "faq", icon: "help", title: { es: "Preguntas frecuentes", en: "FAQ" } },
      { slug: "dev", icon: "terminal", title: { es: "Desarrollo", en: "Development" } },
    ],
  },
  {
    slug: "daily-diary",
    repo: "daily-diary",
    name: "Diario",
    icon: "notebook",
    language: "JavaScript",
    languageColor: "#f1e05a",
    demo: "https://jaime-gaming.github.io/daily-diary/",
    license: "",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "install", icon: "download", title: { es: "Instalación y uso", en: "Install & run" } },
      { slug: "areas", icon: "layout", title: { es: "Las cinco áreas", en: "The five areas" } },
      { slug: "data", icon: "database", title: { es: "Datos y privacidad", en: "Data & privacy" } },
      { slug: "dev", icon: "code", title: { es: "Estructura y desarrollo", en: "Structure & development" } },
    ],
  },
  {
    slug: "void",
    repo: "VOID",
    name: "VOID",
    icon: "ghost",
    language: "HTML",
    languageColor: "#e34c26",
    demo: "",
    license: "",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "install", icon: "download", title: { es: "Instalación y juego", en: "Install & play" } },
      { slug: "world", icon: "eye", title: { es: "El mundo de VOID Corp", en: "The VOID Corp world" } },
      { slug: "faq", icon: "help", title: { es: "Avisos y preguntas", en: "Warnings & FAQ" } },
    ],
  },
  {
    slug: "website",
    repo: "jaime-gaming.github.io",
    name: "jaime-gaming.github.io",
    icon: "globe",
    language: "JavaScript",
    languageColor: "#f1e05a",
    demo: "https://jaime-gaming.github.io/",
    license: "ISC",
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
    pages: [
      { slug: "index", icon: "compass", title: { es: "Visión general", en: "Overview" } },
      { slug: "build", icon: "hammer", title: { es: "Build y preview", en: "Build & preview" } },
      { slug: "content", icon: "file", title: { es: "Editar el contenido", en: "Editing content" } },
      { slug: "architecture", icon: "boxes", title: { es: "Arquitectura del sitio", en: "Site architecture" } },
    ],
  },
];

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
