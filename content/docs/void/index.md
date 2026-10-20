---
title: "Visión general"
icon: "compass"
order: 10
description: "Qué es VOID, su premisa, cómo está construido y en qué estado se encuentra."
updated: "2026-10-19"
---

**VOID** es un juego psicológico ambientado en una corporación misteriosa donde todo el mundo y todo desaparece.

> *Michael Burns desapareció el año pasado. ¿Quieres entrar?*

> [!WARNING]
> **Estado: beta y en desarrollo.** Las dos versiones de idioma están sin terminar: la issue [#2 *Finish Spanish Version*](https://github.com/jaime-gaming/VOID/issues/2) y la [#1 *Finish English Version*](https://github.com/jaime-gaming/VOID/issues/1) siguen abiertas. Hay además una issue [#3](https://github.com/jaime-gaming/VOID/issues/3) sobre un problema detectado. Lo que hay hoy es jugable, pero no está completo.

## Esta documentación separa dos cosas

El README del repositorio está escrito **dentro de la ficción**: es una guía de instalación de VOID Corp dirigida a alguien que ha sido «seleccionado». Es parte de la obra, no documentación técnica.

Por eso esta guía distingue siempre:

| Capa | Qué es |
| --- | --- |
| **El relato** | VOID Corp, el sistema ECO, el Nivel −3, Michael Burns, la autenticación por rotación de espejos |
| **La realidad** | Un archivo HTML de ~1,04 MB con todo integrado, una carpeta de recursos con un vídeo de ~23,5 MB, y tres issues abiertas |

El relato se documenta en [El mundo de VOID Corp](/void/world/). Lo técnico, en [Instalación y juego](/void/install/).

## La premisa

Has sido «seleccionado» —por mérito, por azar o por inevitabilidad algorítmica— y ahora tienes las llaves del **sistema ECO**. El instalador es un contenedor de toda la suite VOID: cada experimento, cada registro y cada fragmento de conciencia que se ha conseguido archivar.

Debido a problemas de estabilidad con el **Nivel −3 (Latencia Absoluta)**, el consejo ejecutivo ha restringido el acceso: el ecosistema completo está presente en el paquete, pero **solo la interfaz BETA está desbloqueada**.

Según el propio relato, la etiqueta «Beta» no mide cuánto le falta al software, sino **cuánto te queda a ti**.

## Cómo está construido

```text
VOID/
├── .github/agents/my-agent.agent.md     # agente personalizado: Michael Burns
├── README.md                            # la guía de instalación, escrita dentro de la ficción
└── VOID mxks version/
    ├── VOID mxks version (code).html    # 1.091.298 bytes (~1,04 MB), todo integrado
    └── assets [DO NOT TOUCH]/
        └── VOIDMXKSnight_shift.mp4      # 24.686.173 bytes (~23,5 MB)
```

El juego son esos dos archivos. El resto del repositorio es documentación y una pieza de utilería que cuenta como contenido: un **agente personalizado** para agentes de código que interpreta a Michael Burns, el ex-empleado desaparecido.

Dos decisiones técnicas que definen el proyecto:

1. **Un solo archivo HTML.** Marcado, estilos y script van integrados. No hay build, no hay dependencias, no hay servidor: se abre y funciona.
2. **Recursos aparte y sin tocar.** La carpeta se llama literalmente `assets [DO NOT TOUCH]`, porque el HTML referencia ese vídeo por su ruta relativa. Moverlo o renombrarlo rompe la escena.

La simulación CRT de alto contraste es la identidad visual del juego, y el README avisa de que puede causar «visión fantasma» tras sesiones prolongadas.

## Qué incluye el paquete

Según el listado del propio instalador:

| Contenido | Estado |
| --- | --- |
| Interfaz VOID (ES/EN) | ✓ Funcional. Tu espacio de trabajo principal. |
| Feed de cámara ECO | Parcialmente funcional. Algunas plantas están… a oscuras. |
| El Archivo (completo) | 🔒 Cifrado. En espera de autorización de Nivel 2. |
| Integración de proyectos | 🔒 Restringida. |

## Comandos básicos

Una vez que la terminal arranca, las interacciones disponibles en la beta son tres:

| Comando | Qué hace |
| --- | --- |
| `scan` | Comprobar si están dentro de las puertas lógicas |
| `trace` | Seguir las filtraciones. La verdad suele estar en los datos basura |
| `connect` | Alcanzar los hosts externos |

> *Recuerda: si haces ping al VOID, el VOID te devuelve el ping.*

## Seguir leyendo en el repositorio

Esta guía resume y ordena. Esto es lo que hay en el repositorio, con sus tamaños reales, por si quieres ir a la fuente.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/VOID/blob/main/README.md) | 3 KB | La presentación y las tres issues abiertas |
| [`.github/agents/my-agent.agent.md`](https://github.com/jaime-gaming/VOID/blob/main/.github/agents/my-agent.agent.md) | 510 B | El agente personalizado **Michael Burns**, escrito como utilería del relato |
| [`VOID mxks version (code).html`](https://github.com/jaime-gaming/VOID/blob/main/VOID%20mxks%20version/VOID%20mxks%20version%20%28code%29.html) | 1,04 MB | El juego entero en un solo archivo, con todo integrado |

> [!NOTE]
> El repositorio son cuatro ficheros y un vídeo de 23,5 MB en `VOID mxks version/assets [DO NOT TOUCH]/`. No hay build ni dependencias que documentar: el juego **es** el archivo HTML.
