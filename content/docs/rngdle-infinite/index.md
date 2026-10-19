---
description: "Qué es RNGdle Infinite, cómo se juega en tres pasos y en qué se diferencia del RNGdle original."
updated: "2026-10-19"
---

**RNGdle Infinite** es un juego incremental de navegador: tira un número entero entre **0 y 1.000.000** y descubre qué lo hace especial.

> [!TIP]
> **[▶ Jugar](https://jaime-gaming.github.io/RNGdle-Infinite/)** — funciona en escritorio y en móvil, sin instalar nada.

## La idea en una frase

Cada número que sale tiene patrones: parejas, escaleras, sietes de la suerte y muchos más. Cada patrón que tiene es una **insignia**, y las insignias dan **EP**. El EP es tu cartera: se gasta en mejoras, compañeros y skills para tirar más rápido y ganar más.

## Lo básico

1. **Tirar.** Pulsa **GENERATE**. Obtienes un número entero aleatorio entre 0 y 1.000.000.
2. **Puntuar.** El número gana EP por sus patrones. Cada patrón que tiene es una insignia.
3. **Esperar.** Una revelación corta y un enfriamiento marcan el ritmo. Las mejoras acortan ambos.

No hay medidor de energía, ni límite diario, ni cuenta. **Se juega todo lo que se quiera** en cuanto terminan la revelación y el enfriamiento.

Los tempos de referencia son **45 segundos de revelación** y **60 de enfriamiento**. Son duraciones reales del juego, no aproximaciones: hay especificaciones automáticas que se ejecutan despacio a propósito para respetarlas.

## Formas de crecer

| Sistema | Qué hace |
| --- | --- |
| **Compañeros** | Trece amigos que multiplican el EP que ganas. Se lleva uno a la vez; algunos se encuentran gratis mientras tiras. |
| **Skills** | Efectos que se cargan y se disparan en tu próxima tirada: EP doble, tiradas extra, sin enfriamiento y más. |
| **Tareas e insignias** | Objetivos que perseguir y una colección que completar. |
| **Rebirth** | Empezar de nuevo con una bonificación permanente. |
| **Prestige** | Un reinicio mayor, cuando tienes media colección y 30 millones de EP ganados en el ciclo. |
| **Rollback** | Aparece tras tres prestigios, y se puede repetir. |

## Qué no es

> [!NOTE]
> **No es el RNGdle oficial.** Es una recreación independiente. El crédito de la idea original y de los datos de puntuación está en [Preguntas frecuentes](/rngdle-infinite/faq/).

Tres límites que definen el juego:

- **No puedes elegir un número concreto.** No hay semilla, ni editor, ni valores predefinidos.
- **Un compañero no da más suerte.** Los compañeros multiplican el EP que ganas; tu número y sus insignias siguen siendo los mismos.
- **Las skills nunca cambian cómo se puntúa un número.** Solo afectan a lo que ganas o a cuánto esperas.

## Cómo está hecho

```text
JavaScript · Vite · Web Worker · localStorage
Tipografías: Inter, Plus Jakarta Sans y Space Mono (autoalojadas)
Iconos: Lucide
Pruebas: Playwright
```

El cálculo de las tiradas corre en un **Web Worker** aparte, así que la interfaz no se bloquea aunque estés tirando en cadena. Las tipografías están autoalojadas en el propio build: el juego no llama a servicios de fuentes externos.

## Jugar en otro dispositivo

La partida vive en tu navegador. Para jugar en otro dispositivo, abre **Ajustes → Enlace de dispositivo** en uno y abre el enlace (o escanea el QR) en el otro. Los detalles y las precauciones están en [Partida y sincronización](/rngdle-infinite/save/).

## Ejecutarlo en local

Hacen falta Node.js y npm:

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # la suite de Playwright (necesita un binario de Chromium)
npm run build   # build de producción
```

El archivo `AGENTS.md` del repositorio tiene el mapa del proyecto y las convenciones para quienes contribuyen y para los agentes de código.

## Seguir leyendo en el repositorio

Esta guía resume y ordena. Esto es lo que hay en el repositorio, con sus tamaños reales, por si quieres ir a la fuente.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`AGENTS.md`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/AGENTS.md) | 8 KB | El mapa del proyecto y las convenciones, escrito para quienes contribuyen y para los agentes de código |
| [`src/data/README.md`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/README.md) | 13 KB | La procedencia de los datos de puntuación: el commit fijado, cada tabla, sus formatos y qué exige cambiarlos. **Es más largo que el README principal** |
| [`README.md`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/README.md) | 3 KB | La presentación del juego |
| [`src/data/badge-metadata.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/badge-metadata.json) | 71 KB | Las 233 insignias con etiqueta, descripción, emoji, EP, familia y rareza, en el orden de la fuente fijada |
| [`src/data/roll-samples.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/roll-samples.json) | 152 KB | Cincuenta resultados observados. **Solo los usan las pruebas**, no se importan en producción |
| [`src/data/game-index.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/game-index.json) | 6 KB | Fuente y revisión, población, orden de filas, SHA-256 y longitudes de las tablas, rutas versionadas y umbrales de nivel |
| [`vite.config.js`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/vite.config.js) | 3 KB | El build y el servidor de desarrollo |
| [`src/data/diagram-hints.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/src/data/diagram-hints.json) | 2 KB | Las categorías de contribución observadas. **Nunca determina pertenencia ni EP** |
| [`package.json`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/package.json) | 1 KB | Los scripts, incluido `prepare:data` y `audit:economy` |
| [`index.html`](https://github.com/jaime-gaming/RNGdle-Infinite/blob/main/index.html) | 1 KB | El punto de entrada |

> [!NOTE]
> Los dos `README.md` se leen en orden distinto al que sugiere su tamaño: el de la raíz presenta el juego y el de `src/data/` es la documentación técnica de los datos.

## Recorrido de la guía

- [Cómo se juega](/rngdle-infinite/play/) — la tirada, la puntuación y el ritmo.
- [Sistemas y progresión](/rngdle-infinite/systems/) — compañeros, skills, tareas, rebirth, prestige y rollback.
- [Partida y sincronización](/rngdle-infinite/save/) — dónde se guarda y cómo se enlaza otro dispositivo.
- [Preguntas frecuentes](/rngdle-infinite/faq/) — dudas habituales y créditos.
- [Desarrollo](/rngdle-infinite/dev/) — cómo está construido, mapa del repositorio, comandos y reglas de diseño.
