#!/usr/bin/env node
/**
 * Crea una página nueva en los dos idiomas.
 *
 *   npm run new -- wave notas "Notas de versión" "Release notes"
 *   npm run new -- wave notas --icon=bookmark --order=25
 *
 * Los títulos son opcionales: sin ellos se derivan del slug («notas-de-version»
 * -> «Notas de version»), que sirve de punto de partida para editarlos.
 *
 * Escribe content/docs/<proyecto>/<pagina>.md y su gemelo .en.md con el front
 * matter que lee el registro. No hay que apuntar la página en ningún otro sitio:
 * el sidebar, el recorrido de la portada, las migas, la paginación, el buscador,
 * el sitemap, robots.txt y las cifras del README salen solos del build.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

import { DOCS_SOURCE } from "./config.mjs";
import { knownIcons } from "./icons.mjs";
import { PROJECTS } from "./registry.mjs";

const HOY = new Date().toISOString().slice(0, 10);
const ICONO_POR_DEFECTO = "file";

/** «notas-de-version» -> «Notas de version». */
function tituloDesde(slug) {
  return slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function morir(mensaje) {
  console.error(`\n${mensaje}\n`);
  process.exit(1);
}

function leerArgumentos(argv) {
  const sueltos = [];
  const opciones = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [clave, ...resto] = arg.slice(2).split("=");
      opciones[clave] = resto.join("=") || true;
    } else {
      sueltos.push(arg);
    }
  }
  return { sueltos, opciones };
}

const { sueltos, opciones } = leerArgumentos(process.argv.slice(2));
const [slugProyecto, slugPagina, tituloEs, tituloEn] = sueltos;

if (!slugProyecto || !slugPagina) {
  morir(
    "Uso: npm run new -- <proyecto> <pagina> [\"Título ES\"] [\"Title EN\"] [--icon=nombre] [--order=N]\n" +
      `Proyectos: ${PROJECTS.map((p) => p.slug).join(", ")}`,
  );
}

const project = PROJECTS.find((p) => p.slug === slugProyecto);
if (!project) {
  morir(
    `No hay ningún proyecto llamado «${slugProyecto}».\n` +
      `Existen: ${PROJECTS.map((p) => p.slug).join(", ")}.\n` +
      "Para documentar un proyecto nuevo, añade su bloque a scripts/registry.mjs (nombre,\n" +
      "repositorio, lenguaje, demo, resumen) y crea content/docs/<slug>/index.md y index.en.md.",
  );
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugPagina)) {
  morir(
    `«${slugPagina}» no vale como slug: letras minúsculas, números y guiones, sin guiones\n` +
      "seguidos ni al principio o al final. Ejemplos: notas, edge-cases, mcp-remoto.",
  );
}
if (slugPagina === "index") {
  morir(`«index» ya existe: es la portada de la guía de ${project.slug}.`);
}

const icono = opciones.icon || ICONO_POR_DEFECTO;
if (typeof icono !== "string" || !knownIcons.has(icono)) {
  const parecidos = [...knownIcons].filter((n) => n.startsWith(String(icono).slice(0, 3))).slice(0, 8);
  morir(
    `El icono «${icono}» no está en el sprite.\n` +
      (parecidos.length ? `Empiezan así: ${parecidos.join(", ")}.\n` : "") +
      `Todos: ${[...knownIcons].sort().join(", ")}`,
  );
}

const ordenMaximo = Math.max(...project.pages.map((p) => p.order));
const order = opciones.order === undefined ? ordenMaximo + 10 : Number(opciones.order);
if (!Number.isInteger(order)) morir(`--order debe ser un número entero, no «${opciones.order}».`);
const choca = project.pages.find((p) => p.order === order);
if (choca) {
  morir(
    `El order ${order} ya lo usa ${project.slug}/${choca.slug}. Los órdenes de esta guía son:\n` +
      project.pages.map((p) => `  ${String(p.order).padStart(3)}  ${p.slug}`).join("\n") +
      "\nPara meter una página en medio usa un hueco (15 entre 10 y 20).",
  );
}

const dir = path.join(DOCS_SOURCE, project.slug);
const rutas = {
  es: path.join(dir, `${slugPagina}.md`),
  en: path.join(dir, `${slugPagina}.en.md`),
};
const existen = Object.entries(rutas).filter(([, f]) => existsSync(f)).map(([l, f]) => `${l}: ${f}`);
if (existen.length) morir(`Esa página ya existe.\n${existen.join("\n")}`);

const titulos = { es: tituloEs || tituloDesde(slugPagina), en: tituloEn || tituloEs || tituloDesde(slugPagina) };
if (!tituloEn && tituloEs) {
  console.log(`  aviso: sin título en inglés se repite el español («${titulos.en}»); edítalo en ${rutas.en}`);
}

const ESQUELETO = {
  es: {
    secciones: ["Qué es", "Cómo se usa", "Qué tener en cuenta"],
    description: `${titulos.es} en ${project.name}: qué es, cómo se usa y qué tener en cuenta.`,
    relleno: [
      "Cuenta en dos o tres frases qué resuelve esta parte del proyecto y cuándo se usa.",
      "Los pasos, con cada comando en su bloque de código.",
      "Los límites, los avisos y lo que no hace a propósito.",
    ],
  },
  en: {
    secciones: ["What it is", "How to use it", "What to keep in mind"],
    description: `${titulos.en} in ${project.name}: what it is, how to use it and what to keep in mind.`,
    relleno: [
      "Say in two or three sentences what this part of the project solves and when to use it.",
      "The steps, with every command in its own code block.",
      "The limits, the warnings and what it deliberately does not do.",
    ],
  },
};

function componer(lang) {
  const { secciones, description, relleno } = ESQUELETO[lang];
  const front = [
    "---",
    `title: ${JSON.stringify(titulos[lang])}`,
    `icon: ${JSON.stringify(icono)}`,
    `order: ${order}`,
    `description: ${JSON.stringify(description)}`,
    `updated: ${JSON.stringify(HOY)}`,
    "---",
    "",
  ];
  const cuerpo = secciones.map((s, i) => `## ${s}\n\n${relleno[i]}\n`);
  return [...front, ...cuerpo].join("\n").replace(/\n+$/, "\n");
}

for (const lang of ["es", "en"]) writeFileSync(rutas[lang], componer(lang), "utf8");

const url = `/${project.slug}/${slugPagina}/`;
console.log(`
  creada ${project.slug}/${slugPagina} (order ${order}, icono ${icono})
    content/docs/${project.slug}/${slugPagina}.md      «${titulos.es}»
    content/docs/${project.slug}/${slugPagina}.en.md   «${titulos.en}»

  Ahora escribe el contenido en los dos archivos: las pruebas piden más de 150
  palabras por idioma y que los apartados de las dos versiones coincidan.
  Con blurb: "frase corta" en el front matter le das su propia frase al
  recorrido de la portada; sin él se usa la description.

  Después:
    npm run build     # la enlaza en el sidebar, el recorrido, el buscador y el sitemap
    npm test          # comprueba el sitio entero
    npm run preview   # http://localhost:8000${url}
`);
