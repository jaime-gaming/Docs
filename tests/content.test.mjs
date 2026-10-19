/**
 * Integridad del contenido Markdown.
 *
 * Comprueba lo que el build da por supuesto: que cada página existe en los dos
 * idiomas, que el front matter está completo, que las fechas de la pareja
 * coinciden y que los enlaces internos apuntan a rutas que existen de verdad.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { PROJECTS } from "../scripts/registry.mjs";
import { LANGUAGES } from "../scripts/config.mjs";

const DOCS_DIR = path.resolve(import.meta.dirname, "..", "content", "docs");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Lee una página y devuelve su front matter y su cuerpo. */
function load(projectSlug, pageSlug, lang) {
  const suffix = lang === "en" ? ".en.md" : ".md";
  const file = path.join(DOCS_DIR, projectSlug, `${pageSlug}${suffix}`);
  assert.ok(existsSync(file), `falta el archivo ${projectSlug}/${pageSlug}${suffix}`);
  const parsed = matter(readFileSync(file, "utf8"));
  return { file, data: parsed.data, body: parsed.content };
}

/** Todas las rutas internas válidas del sitio de documentación. */
const VALID_PATHS = new Set(["/", "/projects/"]);
for (const project of PROJECTS) {
  for (const page of project.pages) {
    VALID_PATHS.add(page.slug === "index" ? `/${project.slug}/` : `/${project.slug}/${page.slug}/`);
  }
}

test("cada proyecto tiene su carpeta con las dos versiones de cada página", () => {
  for (const project of PROJECTS) {
    const dir = path.join(DOCS_DIR, project.slug);
    assert.ok(existsSync(dir), `falta content/docs/${project.slug}`);
    for (const page of project.pages) {
      for (const lang of LANGUAGES) load(project.slug, page.slug, lang);
    }
  }
});

test("no sobran archivos Markdown sin entrada en el registro", () => {
  const declared = new Set();
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      declared.add(`${project.slug}/${page.slug}.md`);
      declared.add(`${project.slug}/${page.slug}.en.md`);
    }
  }
  const onDisk = [];
  for (const entry of readdirSync(DOCS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(path.join(DOCS_DIR, entry.name))) {
      if (file.endsWith(".md")) onDisk.push(`${entry.name}/${file}`);
    }
  }
  const orphans = onDisk.filter((file) => !declared.has(file));
  assert.deepEqual(orphans, [], "Markdown huérfano (no está en scripts/registry.mjs)");
});

test("el front matter lleva description y updated válidos", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, data } = load(project.slug, page.slug, lang);
        assert.ok(
          typeof data.description === "string" && data.description.trim().length > 20,
          `${file}: description ausente o demasiado corta`,
        );
        assert.match(String(data.updated), DATE_RE, `${file}: updated no es AAAA-MM-DD`);
      }
    }
  }
});

test("las dos versiones de una página comparten fecha", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const es = load(project.slug, page.slug, "es");
      const en = load(project.slug, page.slug, "en");
      assert.equal(
        String(en.data.updated),
        String(es.data.updated),
        `${project.slug}/${page.slug}: las fechas es/en no coinciden`,
      );
    }
  }
});

test("las dos versiones de una página tienen la misma estructura", () => {
  // Compartir la fecha no basta. Una traducción puede llevar la fecha al día y
  // dejarse por el camino un apartado, una tabla o un aviso, y ninguna otra
  // prueba lo ve: cada idioma se comprueba contra sí mismo, nunca contra el otro.
  // Se comparan los dos cuerpos rasgo a rasgo, fuera de los bloques de código,
  // que es donde un "##" o una "|" no son estructura.
  //
  // Los títulos se cuentan, no se comparan: el texto sí difiere entre idiomas,
  // y de hecho difiere también entre las dos versiones de un mismo apartado.
  const rasgos = (body) => {
    const limpio = body.replace(/```[\s\S]*?```/g, "");
    const cuenta = (texto, patron) => (texto.match(patron) || []).length;
    return {
      "apartados ##": cuenta(limpio, /^## /gm),
      "subapartados ###": cuenta(limpio, /^### /gm),
      "subsubapartados ####": cuenta(limpio, /^#### /gm),
      "tablas": cuenta(limpio, /^\|[-: |]+\|$/gm),
      "avisos": cuenta(limpio, /^> \[!/gm),
      "bloques de código": cuenta(body, /^```/gm) / 2,
      "elementos de lista": cuenta(limpio, /^[-*] /gm),
      "enlaces": cuenta(limpio, /\]\((?!#)/g),
    };
  };

  for (const project of PROJECTS) {
    for (const page of project.pages) {
      const es = rasgos(load(project.slug, page.slug, "es").body);
      const en = rasgos(load(project.slug, page.slug, "en").body);
      for (const rasgo of Object.keys(es)) {
        assert.equal(
          en[rasgo],
          es[rasgo],
          `${project.slug}/${page.slug}: ${rasgo} — español ${es[rasgo]}, inglés ${en[rasgo]}`,
        );
      }
    }
  }
});

test("ninguna página se quedó en texto provisional", () => {
  const stubs = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        if (/Texto provisional|Lorem ipsum|TODO:|Por escribir/i.test(body)) stubs.push(file);
      }
    }
  }
  assert.deepEqual(stubs, [], "hay páginas sin escribir");
});

test("todo el contenido tiene sustancia", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        const words = body.trim().split(/\s+/).filter(Boolean).length;
        assert.ok(words > 150, `${file}: solo ${words} palabras`);
      }
    }
  }
});

test("cada página tiene al menos un apartado que alimente el índice", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        assert.match(body, /^##\s+\S/m, `${file}: sin ningún h2`);
      }
    }
  }
});

test("los enlaces internos apuntan a páginas que existen", () => {
  const broken = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        for (const match of body.matchAll(/\]\(([^)\s]+)\)/g)) {
          const href = match[1];
          if (/^(https?:|mailto:|tel:|#|~\/)/.test(href)) continue;
          if (!href.startsWith("/")) continue;
          const clean = href.split("#")[0];
          if (!VALID_PATHS.has(clean)) broken.push(`${file} → ${href}`);
        }
      }
    }
  }
  assert.deepEqual(broken, [], "enlaces internos rotos");
});

test("ningún enlace apunta a una web que no sea la del proyecto", () => {
  // Lista blanca de dominios revisados a mano. Si aparece uno nuevo, hay que
  // decidir conscientemente si se enlaza: por eso la prueba falla en vez de
  // aceptar cualquier https.
  const HOSTS = [
    "github.com",
    "jaime-gaming.github.io",
    "www.roblox.com",
    "render.com",
    "chatgpt.com",
    "lucide.dev",
    "www.rngdle.com",
    "rng.cubityfir.st",
    "janiito.com",
    "mateag.com",
    "creativecommons.org",
    "openai.com",
    "platform.openai.com",
    "anthropic.com",
    "ai.google",
    "openrouter.ai",
    "groq.com",
    "together.ai",
    "deepseek.com",
    "mistral.ai",
    "x.ai",
    "ollama.com",
    "tavily.com",
    "discord.com",
    "www.youtube.com",
    "nodejs.org",
    "vitejs.dev",
    "react.dev",
    "learn.microsoft.com",
    "developer.android.com",
    "docs.python.org",
    "www.python.org",
    "wave.js.org",
    "code.visualstudio.com",
  ];
  const allowed = new RegExp(`^https://(${HOSTS.map((h) => h.replace(/\./g, "\\.")).join("|")})(/|$|#)`);
  const unexpected = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        for (const match of body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
          if (!allowed.test(match[1])) unexpected.push(`${file} → ${match[1]}`);
        }
      }
    }
  }
  assert.deepEqual(unexpected, [], "dominios externos no revisados");
});

test("no hay imágenes externas enlazadas desde el contenido", () => {
  // El sandbox y Pages no pueden hotlinkear otros repositorios: los visuales
  // son SVG/CSS en línea. Esta prueba evita que alguien vuelva a intentarlo.
  const images = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        for (const match of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) images.push(`${file} → ${match[1]}`);
      }
    }
  }
  assert.deepEqual(images, [], "hay imágenes en el Markdown");
});

test("el contenido no arrastra caracteres de otros alfabetos", () => {
  // Error histórico del generador: texto cirílico o CJK colado por accidente.
  const stray = [];
  const forbidden = /[\u0400-\u04FF\u4E00-\u9FFF\uAC00-\uD7AF\u3040-\u30FF]/;
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        const line = body.split("\n").find((l) => forbidden.test(l));
        if (line) stray.push(`${file}: ${line.trim().slice(0, 60)}`);
      }
    }
  }
  assert.deepEqual(stray, [], "caracteres fuera del alfabeto latino");
});

test("los bloques de aviso usan etiquetas reconocidas", () => {
  const valid = new Set(["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION", "DANGER"]);
  const unknown = [];
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        for (const match of body.matchAll(/^>\s*\[!(\w+)\]/gm)) {
          if (!valid.has(match[1].toUpperCase())) unknown.push(`${file} → [!${match[1]}]`);
        }
      }
    }
  }
  assert.deepEqual(unknown, [], "etiquetas de aviso no soportadas");
});

test("las vallas de código están cerradas", () => {
  for (const project of PROJECTS) {
    for (const page of project.pages) {
      for (const lang of LANGUAGES) {
        const { file, body } = load(project.slug, page.slug, lang);
        const fences = (body.match(/^```/gm) || []).length;
        assert.equal(fences % 2, 0, `${file}: ${fences} vallas (número impar)`);
      }
    }
  }
});

test("cada portada de proyecto enlaza todas sus demás páginas", () => {
  // Al añadir /wave/dev/ y /jaigent/security/ las portadas se quedaron sin
  // enlazarlas: el sidebar las mostraba, pero el recorrido de la guía no, que
  // es por donde se lee una documentación seguida.
  const faltan = [];
  for (const project of PROJECTS) {
    for (const lang of LANGUAGES) {
      const file = lang === "es" ? "index.md" : "index.en.md";
      const texto = readFileSync(path.join(DOCS_DIR, project.slug, file), "utf8");
      for (const page of project.pages) {
        if (page.slug === "index") continue;
        if (!texto.includes(`/${project.slug}/${page.slug}/`)) faltan.push(`${project.slug}/${file} → ${page.slug}`);
      }
    }
  }
  assert.deepEqual(faltan, [], "páginas sin enlace desde su propia portada");
});

test("el texto de cada enlace interno coincide con el título del registro", () => {
  // Si el enlace dice otra cosa, el lector no reconoce en el sidebar la página a
  // la que acaba de llegar. Ocurrió en cinco sitios, incluido un index.md que
  // llamaba «Arquitectura y seguridad» a la Referencia de tools.
  const titulos = new Map();
  for (const project of PROJECTS) {
    for (const page of project.pages) titulos.set(`/${project.slug}/${page.slug}/`, page.title);
  }

  const malos = [];
  for (const project of PROJECTS) {
    for (const name of readdirSync(path.join(DOCS_DIR, project.slug))) {
      if (!name.endsWith(".md")) continue;
      const lang = name.endsWith(".en.md") ? "en" : "es";
      const texto = readFileSync(path.join(DOCS_DIR, project.slug, name), "utf8");
      for (const [, etiqueta, destino] of texto.matchAll(/\[([^\]]+)\]\((\/[a-z0-9.-]+\/[a-z-]+\/)\)/g)) {
        const titulo = titulos.get(destino);
        if (!titulo) continue; // destino no registrado: lo vigila otra prueba
        const limpio = etiqueta.replace(/[*`]/g, "").trim();
        if (limpio !== titulo[lang]) malos.push(`${project.slug}/${name} → ${destino} dice «${limpio}», el registro «${titulo[lang]}»`);
      }
    }
  }
  assert.deepEqual(malos, [], "textos de enlace que no coinciden con el título del registro");
});
