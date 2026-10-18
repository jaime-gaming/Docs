---
description: "Abrir VOID, qué hace falta, por qué no se puede mover la carpeta de recursos y qué problemas hay abiertos."
updated: "2026-10-18"
---

## Lo que hace falta

Nada. VOID es un archivo HTML autocontenido: **no hay instalación, ni build, ni dependencias, ni servidor**.

| Requisito | Valor |
| --- | --- |
| Sistema | Cualquiera con un navegador moderno |
| Node.js, Python, etc. | No hace falta |
| Conexión | No, una vez descargado el repositorio |
| Espacio | Unos 25 MB (casi todo es el vídeo) |

## Abrirlo

**Opción A — Clonar el repositorio**

```bash
git clone https://github.com/jaime-gaming/VOID.git
cd VOID/"VOID mxks version"
```

Después abre `VOID mxks version (code).html` con doble clic, o sírvelo:

```bash
python3 -m http.server 8000
# http://localhost:8000/VOID%20mxks%20version/VOID%20mxks%20version%20(code).html
```

**Opción B — Descargar el archivo suelto**

Si solo descargas el HTML, **necesitas también la carpeta `assets [DO NOT TOUCH]/` a su lado**, con la misma estructura relativa. Sin el vídeo, la escena que lo usa falla.

## Por qué no se puede mover nada

La carpeta se llama `assets [DO NOT TOUCH]` por una razón concreta: el HTML referencia el recurso por **ruta relativa**.

```text
VOID mxks version/
├── VOID mxks version (code).html      ← referencia ./assets [DO NOT TOUCH]/…
└── assets [DO NOT TOUCH]/
    └── VOIDMXKSnight_shift.mp4
```

> [!IMPORTANT]
> Mantén la estructura exacta. Renombrar la carpeta, mover el vídeo o cambiar el nombre del HTML **rompe la carga del recurso**. Los espacios y los corchetes del nombre forman parte de la ruta.

Si el navegador bloquea el vídeo por política de reproducción automática, suele resolverse sirviendo la carpeta por HTTP en vez de abriendo el archivo con `file://`.

## Idioma

La interfaz está pensada en **español e inglés**, pero ninguna de las dos versiones está terminada:

| Versión | Estado | Issue |
| --- | --- | --- |
| Español | Sin terminar | [#2 *Finish Spanish Version*](https://github.com/jaime-gaming/VOID/issues/2) |
| Inglés | Sin terminar | [#1 *Finish English Version*](https://github.com/jaime-gaming/VOID/issues/1) |

## Problemas conocidos

Hay tres issues abiertas en el repositorio:

- **[#1](https://github.com/jaime-gaming/VOID/issues/1)** — terminar la versión en inglés.
- **[#2](https://github.com/jaime-gaming/VOID/issues/2)** — terminar la versión en español.
- **[#3](https://github.com/jaime-gaming/VOID/issues/3)** — *There was a problem…*

> [!WARNING]
> Antes de invertir tiempo en una partida larga, revisa las issues abiertas: el contenido bloqueado del relato (el Archivo completo y la integración de proyectos) **no es contenido oculto que se pueda desbloquear jugando**, sino partes que aún no están implementadas.

## Trabajar en el código

El archivo HTML es grande (~1,04 MB) porque todo va integrado. Dos consejos prácticos:

1. **No lo reformatees en bloque.** Un cambio de indentación en un archivo así genera un diff ilegible y difícil de revisar.
2. **Edita por secciones**, buscando el texto o el identificador concreto, en vez de reescribir el archivo.

El repositorio incluye `.github/agents/my-agent.agent.md`, una configuración para agentes de código que trabajan sobre el proyecto.

## Contribuir

Las dos tareas grandes están ya descritas como issues: terminar la versión en español y terminar la en inglés. Si encuentras un fallo que no esté recogido, abre una issue con:

- En qué punto de la partida ocurre.
- Navegador y sistema.
- Si abriste el archivo con `file://` o lo serviste por HTTP.
- Qué esperabas y qué pasó.
