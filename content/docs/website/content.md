---
description: "Añadir un post al blog, cambiar textos de la interfaz y cómo funciona el sistema de dos idiomas."
updated: "2026-10-18"
---

## Dónde se edita cada cosa

| Qué quieres cambiar | Dónde |
| --- | --- |
| Secciones de la portada | `content/home.fragment.html` |
| Listado de proyectos | `content/projects.fragment.html` |
| Bloque de contacto | `content/contact.fragment.html` |
| Página de error y detalle de proyecto | `content/404.fragment.html` |
| Posts del blog | `content/blog/*.md` |
| Textos de la interfaz | `assets/js/i18n.js` |
| Estilos | `assets/css/style.css` |
| Navegación y plantilla | `scripts/layout.mjs` |
| Comportamiento y datos | `assets/js/main.js` |

> [!WARNING]
> **No edites `index.html`, `projects/index.html`, `blog/*/index.html`, `contact/index.html` ni `404.html`.** Se generan en cada build y se sobrescriben.

## Añadir un post

Crea un archivo Markdown en `content/blog/` con título y fecha en el front matter:

```md
---
title: "Título del post"
date: "2026-10-04"
excerpt: "Resumen breve"
lang: "es"
---

Texto del post.
```

Después ejecuta el build. Al eliminar una fuente, **el build quita también la página generada correspondiente**.

### Las dos traducciones son obligatorias

El blog exige los dos idiomas para cada post. Los archivos se emparejan por slug:

```text
content/blog/lanzamiento-wave.md        # lang: "es"
content/blog/lanzamiento-wave.en.md     # lang: "en"
```

El build lanza un error explícito en tres casos:

| Error | Cuándo |
| --- | --- |
| `missing required "title" or "date"` | Falta título o fecha en el front matter |
| `Unsupported blog language: <lang>` | `lang` no es `es` ni `en` |
| `Duplicate <lang> translation: <slug>` | Dos archivos con el mismo slug e idioma |
| `Both es and en translations are required for <slug>` | Falta una de las dos versiones |
| `Translation dates differ: <slug>` | Las fechas de las dos versiones no coinciden |

Las fechas deben coincidir porque el post se ordena una sola vez y se muestra con la misma fecha en ambos idiomas.

### Cómo se genera el slug

Si no indicas `slug` en el front matter, se deriva del nombre del archivo: a minúsculas, los caracteres no alfanuméricos convertidos en guion y los guiones de los extremos recortados.

## Cómo funciona el cambio de idioma

Es el mecanismo más característico del sitio, y **esta documentación lo usa tal
cual**. Tiene página propia: [Los dos idiomas](/website/i18n/) recorre el
diccionario de 234 claves, los cinco atributos que dirigen la sustitución, la
detección y la persistencia, el conmutador y la animación de retecleo.

Lo mínimo para tocar textos sin salir de aquí: las claves de la interfaz viven en
`assets/js/i18n.js`, dentro de `dict.es` y `dict.en`, y los campos propios de
cada página en `pageTranslations`, que genera el build. Añadir una clave es
añadirla **en las dos ramas**, porque el sitio comprueba que no falte ninguna.

## Contactos y enlaces

`content/contact.fragment.html` se reutiliza en la portada y en `/contact/`. El correo y las redes tienen **enlaces reales incluso sin JavaScript**. El botón de copiar solo aparece con JavaScript y **comunica si la copia falla**.

Los accesos por tema preparan el asunto de un correo; **no envían mensajes ni guardan datos**.

## Referencias de diseño

De la revisión que dio forma a la portada:

- **[janiito.com](https://janiito.com/en)** — por su presentación directa y los proyectos en primer plano.
- **[mateag.com](https://mateag.com/home/)** — por el tono personal y la cabecera dinámica.

> [!NOTE]
> Se conservan la paleta y la estructura propias; **no se han copiado sus textos ni sus recursos**.
