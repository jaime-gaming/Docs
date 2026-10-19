/**
 * Prepara el payload de GitHub Pages en _site/.
 *
 * El build escribe las páginas en la raíz del repositorio (las rutas públicas
 * son /Docs/<proyecto>/<pagina>/), pero la raíz también contiene el código
 * fuente. Este script copia solo lo que se sirve, guiándose por el registro de
 * proyectos en vez de por una lista escrita a mano en el workflow.
 *
 * Uso:  node scripts/stage_site.mjs            (después de npm run build)
 */
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PROJECTS } from "./registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "_site");

/** Archivos generados de la raíz que Pages debe servir. */
const ROOT_FILES = ["index.html", "404.html", "sitemap.xml", "robots.txt"];

/** Directorios generados: los siete proyectos más el índice. */
const ROOT_DIRS = [...PROJECTS.map((project) => project.slug), "projects"];

/** Todo lo que se sirve tal cual: estilos, scripts, sprite, datos y favicon. */
const ASSET_DIRS = ["assets"];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(path.join(ROOT, "index.html")))) {
    throw new Error("Falta index.html: ejecuta `npm run build` antes de preparar el despliegue.");
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const copied = [];

  for (const name of ROOT_FILES) {
    const source = path.join(ROOT, name);
    if (!(await exists(source))) throw new Error(`Falta el archivo generado ${name}`);
    await cp(source, path.join(OUT, name));
    copied.push(name);
  }

  for (const name of [...ROOT_DIRS, ...ASSET_DIRS]) {
    const source = path.join(ROOT, name);
    if (!(await exists(source))) throw new Error(`Falta el directorio generado ${name}/`);
    await cp(source, path.join(OUT, name), { recursive: true });
    copied.push(`${name}/`);
  }

  // Comprobación final: nada de código fuente ni dependencias en el payload.
  const forbidden = ["node_modules", "content", "scripts", "tests", "package.json", ".git"];
  const staged = (await readdir(OUT)).filter((name) => forbidden.includes(name));
  if (staged.length) throw new Error(`_site/ contiene fuentes que no deberían publicarse: ${staged.join(", ")}`);

  const pages = PROJECTS.reduce((sum, project) => sum + project.pages.length, 0);
  console.log(`_site/ listo: ${copied.length} entradas · ${pages} guías · ${ROOT_FILES.length} páginas fijas`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
