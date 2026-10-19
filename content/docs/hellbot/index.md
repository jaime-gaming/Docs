---
description: "Qué es hellbot, qué evento ejecuta y qué garantías ofrece como bot de producción."
updated: "2026-10-19"
---

**hellbot** es el bot de Discord que ejecuta *Welcome to Hell*: mantener al menos a **una persona real** en un único canal de voz, de forma **continua, durante 160 horas**. Si ese canal se vacía y nadie vuelve dentro del periodo de gracia, la partida muere **para siempre**.

> [!NOTE]
> Python 3.10 / 3.11 / 3.12 · discord.py 2.3+ · pruebas pasando · **88 % de cobertura** · ruff y mypy limpios.

## La regla central

```text
160 horas consecutivas · cinco hitos: 32h · 64h · 96h · 128h · 160h
```

- Se arranca a mano con `/hell start`, restringido a `@gamenight host`.
- El canal de voz **debe** contener al menos un humano válido, o el arranque se rechaza. **No es configurable.**
- Los bots nunca cuentan. `@clanker` se expulsa en cuanto aparece. Estar AFK **sí** cuenta.
- **15 segundos de gracia** cuando el canal se vacía, con aviso sin pings.
- **Comprobaciones de vida aleatorias** cada 1–6 h: responde `Yes` en 5 minutos o te desconectan.
- **Ficha de estadísticas personal por MD** al terminar, para cada participante.
- Los hosts pueden publicar **embeds de colores** y enviar **MD en Markdown a todos los participantes**.

## Cómo se ve en Discord

```text
WELCOME TO HELL
🔥 THE 160 HOUR CHALLENGE
▰▰▰▰┃▰▰▰▰┃▰▱▱▱┃▱▱▱▱┃▱▱▱▱
73h 24m of 160h 00m  ·  45.9%  ·  🔥🔥◦◦◦

Status              👥 Currently in Hell   ⏳ Time remaining
RUNNING             7                      86h 36m

✅ Current milestone  🔥 Next milestone      🕛 Started
64h cleared           96h · in 22h 36m       in 3 days

Live · updates every 20s · /hell status · /hell leaderboard
```

Toda la salida son **embeds**. Las menciones dentro de un embed nunca hacen ping, así que un hito puede listar 250 usuarios elegibles sin 250 notificaciones, mientras el ping `@everyone` se queda en el contenido del mensaje.

## Garantías de un evento que no se puede repetir

Un evento de 160 horas no se puede reiniciar si algo falla, así que el bot está diseñado alrededor de esa restricción:

| Riesgo | Cómo lo cubre |
| --- | --- |
| Que el bot se reinicie | Basado en marcas de tiempo y persistido en SQLite: **un reinicio nunca resetea el cronómetro** |
| Que haya un fallo a mitad del evento | `/hell pause` congela el reloj global y el de cada usuario; nada puede fallar mientras esté pausado |
| Que un comando destructivo se ejecute por error | `/hell stop`, `/hell reset` y reanudar una partida fallida exigen un **código de un solo uso** enviado por MD al operador |
| Que un fallo interno quite tiempo a los participantes | Una caída corta se **devuelve** a quien no se fue del canal |
| Que el texto haya que cambiarlo en vivo | Todo el wording vive en un archivo, `Announcements.py`, **recargable en caliente** |
| Que nadie sepa qué pasó | **Flujo de log en vivo** por MD al operador: entradas, salidas, expulsiones, hitos y errores |

## Qué incluye además del temporizador

- **Apuestas de tiempo** a partir de la dificultad 3, con dos relojes (Real Timer y Gamble Time), cuotas, probabilidades públicas y estadísticas de sesión.
- **Dificultades progresivas de 0 a 4** que se expanden con cada hito alcanzado.
- **Hell 2**: al completar 160 h se vota si continuar hasta **320 h**, sin más hitos y con una recompensa final secreta.
- **Dashboard web en vivo** con WebSocket y respaldo por sondeo, que funciona incluso publicado como página estática conectándose al bot real.
- **Panel de control de escritorio** sin consola y un `.exe` de un solo archivo.
- **Suite de pruebas amplia**: motor, persistencia, casos límite de Discord, GUI y despliegue.

## Estructura del proyecto

```text
Announcements.py   cada mensaje que envía el bot, en un archivo editable
hell/              el bot: núcleo puro (motor, cronologías, gracia, clasificación…)
                   + borde de Discord (monitor, embeds, anunciador, comandos…)
launcher/          panel de control de escritorio (editor de config, supervisor, Tk)
tools/             check.sh (lint + tipos + tests) y simulate.py (simulación offline)
docs/              el dashboard publicado en Pages y las notas de arquitectura
```

`engine.py` y todo lo que hay por debajo **no importa nada de Discord**. El monitor le pasa valores simples `Observation(now, participants)` —con bots y `@clanker` ya filtrados— y recibe eventos de dominio simples (`MilestoneReached`, `EventFailed`, `EventCompleted`, `EventCancelled`) que el anunciador convierte en mensajes. **Por eso todo el reglamento es testeable de forma unitaria.**

## Seguir leyendo en el repositorio

Esta guía resume y ordena. El repositorio trae además su propia documentación, bastante más extensa, y conviene saber qué hay y dónde está.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/hellbot/blob/main/README.md) | 40 KB | Arranque rápido, el panel de control, la lista de comprobación de Discord, los comandos, cómo funciona y los casos límite (todos cubiertos por pruebas) |
| [`docs/ARCHITECTURE.md`](https://github.com/jaime-gaming/hellbot/blob/main/docs/ARCHITECTURE.md) | 11 KB | Las capas, los dos relojes, las **11 invariantes**, el modelo de datos SQLite v3 y los campos que bastan para reconstruir el evento tras un fallo |
| [`Announcements.py`](https://github.com/jaime-gaming/hellbot/blob/main/Announcements.py) | 41 KB | Todos los textos, recompensas y colores. El bot **no arranca sin él** |
| [`docs/index.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/index.html) | 60 KB | El dashboard público, *Welcome to Hell — Live Dashboard* |
| [`docs/dev.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/dev.html) | 31 KB | El dashboard de desarrollo y operador |
| [`tools/check.sh`](https://github.com/jaime-gaming/hellbot/blob/main/tools/check.sh) | 1,5 KB | Compilar, pyflakes, ruff, mypy, pytest y simulaciones |
| [`tools/simulate.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/simulate.py) | 8 KB | Imprime cada mensaje de una partida completa sin conexión; `--fail-at 40` la mata a las 40 horas |
| [`tools/healthcheck.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/healthcheck.py) | 3 KB | Inspecciona el **fichero de estado**, no el proceso |
| [`tools/make_icon.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/make_icon.py) | 2,5 KB | Deriva los iconos del logo maestro; necesita Pillow, que el bot en runtime no usa |
| [`tools/demo_web.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/demo_web.py) | 2 KB | El dashboard real contra un bot simulado, sin conectar a Discord |
| [`Dockerfile`](https://github.com/jaime-gaming/hellbot/blob/main/Dockerfile) | 1 KB | `python:3.12-slim`, volumen `/data`, uid 10001 |
| [`bot.py`](https://github.com/jaime-gaming/hellbot/blob/main/bot.py) | 113 B | Entrada de conveniencia: importa `hell.bot.main` |
| [`docker-compose.yml`](https://github.com/jaime-gaming/hellbot/blob/main/docker-compose.yml) | 534 B | El servicio y sus variables |
| [`requirements.txt`](https://github.com/jaime-gaming/hellbot/blob/main/requirements.txt) · [`requirements-dev.txt`](https://github.com/jaime-gaming/hellbot/blob/main/requirements-dev.txt) | 51 B · 66 B | Lo de runtime y lo de desarrollo |

> [!NOTE]
> `hell/` son **41 módulos** y el repositorio entero **114 ficheros**. El mapa de los 41, agrupados por responsabilidad, está en [Arquitectura](/hellbot/architecture/).

## Recorrido de la guía

- [Reglas del evento](/hellbot/rules/) — cronologías, hitos, dificultades, apuestas y final.
- [Casos límite](/hellbot/edge-cases/) — los 32 casos raros, agrupados, y qué hace el bot en cada uno.
- [Instalación y despliegue](/hellbot/install/) — Windows, consola, Docker, systemd y permisos de Discord.
- [Comandos](/hellbot/commands/) — los 25 comandos, quién puede usarlos y qué hacen.
- [Dashboard en vivo](/hellbot/dashboard/) — la web pública y la del operador.
- [Arquitectura](/hellbot/architecture/) — módulos, invariantes y el mapa de los 41.
