/**
 * Barrido de navegador: todas las páginas generadas, sin errores.
 *
 * Las demás pruebas de navegador cargan una página concreta para observar un
 * comportamiento —el conmutador, el buscador, el índice lateral—. Esta las carga
 * todas y exige una sola cosa: que los tres scripts (i18n.js, search.js y
 * main.js) se ejecuten de punta a punta sin que jsdom reporte nada.
 *
 * Es la red que coge el fallo que solo aparece en la página de estado, o solo en
 * una guía que lleva una tabla, o solo en el 404. Sin ella, una página rota entre
 * cuarenta y seis pasa desapercibida: el build la genera bien, las pruebas de
 * contenido la leen bien y nadie la ejecuta.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { PROJECTS, pagePath } from "../scripts/registry.mjs";
import { clickLangSwitch, loadPage } from "./helpers/browser.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

test.before(() => {
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], {
    cwd: ROOT,
    stdio: "pipe",
    timeout: 120_000,
  });
});

/** Las 46 páginas que se sirven: las fijas más una por guía. */
function todasLasPaginas() {
  const rutas = ["index.html", "projects/index.html", "status/index.html", "404.html"];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      rutas.push(`${pagePath(project.slug, page.slug).replace(/^\//, "")}index.html`);
    }
  }
  return rutas;
}

test("ninguna página produce errores al ejecutarse ni al cambiar de idioma", async () => {
  const errores = [];
  const sinScripts = [];

  for (const page of todasLasPaginas()) {
    const env = await loadPage({ page });
    try {
      if (env.errors.length) errores.push(`${page}: ${env.errors.join(" | ")}`);

      // Una página sin errores porque no llegó a ejecutar nada no vale: los tres
      // scripts se piden por red y el módulo de idioma se publica al final.
      // Las URLs llegan con su cache-buster (?v=<hash>): comparar sin partirlo
      // por el "?" da siempre "no cargó", que es justo el falso positivo que esta
      // prueba no puede permitirse.
      const pedidas = env.requested.map((url) => url.split("?")[0]);
      for (const script of ["i18n.js", "search.js", "main.js"]) {
        if (!pedidas.some((url) => url.endsWith(`/assets/js/${script}`))) {
          sinScripts.push(`${page}: no cargó ${script}`);
        }
      }
      if (typeof env.window.i18n?.applyLang !== "function") {
        sinScripts.push(`${page}: i18n.js se cargó pero no publicó window.i18n`);
      }

      // Y que cambie de idioma. Pulsar el conmutador recorre todos los data-i18n
      // de la página y dispara langchange, que es cuando trabajan el índice
      // lateral, las anclas, las tablas y el resumen de estado: una clave mal
      // escrita o un listener que supone un elemento que esta página no tiene
      // solo revientan aquí.
      const antes = env.errors.length;
      clickLangSwitch(env);
      if (env.doc.documentElement.lang !== "en") {
        sinScripts.push(`${page}: el conmutador no la pasó a inglés`);
      }
      if (env.errors.length > antes) {
        errores.push(`${page} al cambiar de idioma: ${env.errors.slice(antes).join(" | ")}`);
      }
    } finally {
      // Cuarenta y seis ventanas con sus bucles de animación: si no se cierran,
      // el proceso se queda con los temporizadores colgando.
      env.window.close();
    }
  }

  assert.deepEqual(errores, [], "páginas que fallan al ejecutarse");
  assert.deepEqual(sinScripts, [], "páginas que no ejecutaron los tres scripts");
});

test("el barrido cubre todas las páginas del registro", () => {
  // El test anterior vale lo que valga su lista: si alguien añade una guía y
  // olvida que esto recorre el registro, el barrido seguiría pasando con una
  // página menos. Se comprueba que el recuento es el del registro más las fijas.
  const esperadas = 4 + PROJECTS.reduce((total, project) => total + project.pages.length, 0);
  assert.equal(todasLasPaginas().length, esperadas, "el barrido no recorre todas las páginas");
  assert.equal(new Set(todasLasPaginas()).size, esperadas, "el barrido recorre alguna página dos veces");
});
