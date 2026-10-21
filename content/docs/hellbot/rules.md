---
title: "Reglas del evento"
icon: "scroll"
order: 20
blurb: "cronologías, hitos, dificultades, apuestas y final."
description: "El reglamento completo: dos cronologías, hitos, dificultades, apuestas, comprobaciones de vida y el final de las 160 horas."
updated: "2026-10-18"
---

## Dos cronologías explícitas

El código mantiene estos dos relojes en módulos separados **a propósito**: confundirlos es la forma clásica en que este tipo de bot sale mal.

| | Módulo | Rango | Lo mueve | Lo detiene |
| --- | --- | --- | --- | --- |
| **Cronología global del evento** | `hell/timeline.py` — `EventTimeline` | **0 → 160 h** | Solo el reloj de pared | Que termine la partida (FAILED / COMPLETED / CANCELLED) |
| **Cronología de sesión por usuario** | `hell/tracking.py` — `UserTimeTracker` | **0 → X h** por persona | Que esa persona esté en el canal | Que esa persona se vaya (solo su reloj) |

Que un usuario se desconecte, se vaya, sea expulsado por una comprobación de vida o sea retirado por `@clanker` **nunca** toca el progreso global de 0 → 160 h, mientras quede al menos un participante válido. Su propio reloj de 0 → X h simplemente se pausa y se reanuda donde lo dejó cuando vuelve.

## El bucle de un segundo

1. Leer los miembros del canal de voz objetivo.
2. Descartar los bots.
3. `@clanker` → `member.move_to(None)` de inmediato (más una vía rápida por `on_voice_state_update`), y nunca aparecen en la lista de participantes.
4. Los humanos restantes son los participantes válidos; a cada uno se le acredita su propio reloj por el intervalo observado.
5. Si `valid_human_count == 0` → se abre el **periodo de gracia**. Solo cuando expira, la partida queda FAILED de forma permanente, con la clasificación congelada y guardada.

## Periodo de gracia con el canal vacío

```text
El canal se vacía ──► GRACIA ABIERTA (15s) ──► alguien entra a tiempo ──► la partida continúa
                                          └──► nadie entra ──────────► partida FAILED
```

- El embed de aviso va al canal de progreso o anuncios **con los pings explícitamente desactivados** (`AllowedMentions(everyone=False, users=False, roles=False)`): alerta a quien ya está mirando sin despertar el servidor.
- Si un humano válido entra antes del límite, se publica «✅ SAVED — THE RUN CONTINUES», también sin pings, y el reloj de 160 h —que nunca se detuvo— sigue.
- Nadie acumula tiempo por usuario durante la ventana y los hitos no se disparan con el canal vacío (no habría quién los reclamara). Un hito que caiga en mitad de la ventana se dispara en el primer tick con gente dentro.
- Si la ventana expira, el evento falla **desde el momento en que el canal se vació**, no desde el momento en que la ventana se agotó: la gracia nunca puede inflar el tiempo sobrevivido.
- La ventana está persistida (`event.grace_started_ts`), así que un reinicio a mitad de la cuenta atrás la reanuda.
- La duración es `EMPTY_VC_GRACE_SECONDS` (15 por defecto; `0` restaura el fallo instantáneo).

## Hitos

Los mueve **puramente el cronómetro global** (`now - start_ts`), nunca el tiempo individual de cada usuario.

| Hito | Recompensa |
| --- | --- |
| 32 h | `@hell` — limitada |
| 64 h | Verity por tiempo limitado en [Find the Verities](https://www.roblox.com/games/138268356635577/Find-the-Verities) |
| 96 h | `@hell-ist` — limitada |
| 128 h | Permisos de música para todos, si no se abusa de ellos |
| 160 h | `@hell master` — limitada |

Cada hito se reclama con un `INSERT OR IGNORE` en SQLite: **solo anuncia quien de verdad insertó la fila**, así que un hito nunca puede dispararse dos veces, ni siquiera si el bot se reinicia en el mismo segundo en que cae. La bandera `announced` solo se activa después de que Discord acepte el mensaje, de modo que un fallo entre medias lo vuelve a publicar en el siguiente arranque en vez de perderlo.

> [!NOTE]
> **Las recompensas son solo de anuncio.** El bot nunca asigna roles: publica exactamente quién es elegible en cada hito para que una persona los reparta.

A las **160 h** el evento pasa además a `COMPLETED`: el cronómetro se detiene (nunca cuenta más allá de 160 h), la acumulación de la clasificación se detiene, los puestos se congelan y se muestran, y se anuncia que el Top 3 final recibe **todas las recompensas de hito + `@cool people :D`**.

## Dificultades de 0 a 4

Las dificultades endurecen el reto conforme avanza el evento, expandiéndose con cada hito alcanzado.

| Nivel | Tramo | Comprobaciones de vida | Comprobaciones muertas | Apuestas |
| --- | --- | --- | --- | --- |
| **0 · Starter** | 0–32 h | cada 1–6 h | No | No |
| **1 · Hito 32 h** | 32–64 h | cada 1–5 h | No | No |
| **2 · Hito 64 h** | 64–96 h | cada 1–4 h | Sí: respondes `Yes` y te **silencian 1 minuto** | No |
| **3 · Hito 96 h** | 96–128 h | cada 1–3 h | Más frecuentes, silencios de **1–5 minutos** | **Desbloqueadas**: apuesta máx. 1 h, 2 apuestas/h, 38 % de acierto (+1.5×) / pérdida (−1.0× + 1 min de silencio) |
| **4 · Hito 128 h** | 128–160 h | cada 1–2 h | Silencios de **5–15 minutos** | Alto riesgo: máx. 2 h, 3 apuestas/h, 28 % de acierto, multiplicador 2.5× |

## Comprobaciones de vida

A un **intervalo aleatorio de entre 1 y 6 horas**, con el evento en marcha, el bot publica en el chat del canal:

```text
@alice @bob @carol
🚨 ARE YOU ALIVE? Say: Yes
Reply with Yes in this channel within 5 minutes or you will be disconnected from the VC.
You keep all your leaderboard time and can rejoin immediately.
```

- Se hace ping a **todo el que esté en el canal en ese momento**; los bots y los `@clanker` nunca se incluyen.
- Cada uno tiene **5 minutos** para responder `Yes` en ese canal (sin distinguir mayúsculas por defecto; `ALIVE_CHECK_STRICT=true` exige la cadena exacta). Las respuestas contabilizadas reciben una reacción ✅.
- Responder **No** —o cualquiera de sus sinónimos (`nope`, `nah`, `never`, `hell no`, `no way`, `nop`, `not sure`, `para nada`, `nunca`, …)— es una **salida instantánea pero indolora**: te desconectan, conservas todo tu tiempo de clasificación y, cuando vuelves al canal, el bot te escribe por MD *«Psssst, you don't have to do the Alive Check.»* para que sepas que volver no exige responder nada.
- Quien se queda en silencio es **desconectado del canal**. Su tiempo acumulado **no** se toca y puede **volver de inmediato**.
- Una desconexión nunca hace fallar el evento por sí sola: la partida solo termina si el canal se queda sin ningún humano válido.
- Quien entra *durante* una comprobación no tiene que responder; a quien ya se fue no se le persigue.
- La comprobación pendiente está persistida. Si el bot se reinicia a mitad, la reanuda e incluso lee las respuestas publicadas mientras estaba offline; si los 5 minutos expiraron durante la caída, la comprobación se **cancela**: nadie es castigado por una ausencia del bot.
- **El momento de la siguiente comprobación nunca se anuncia** (eso anularía el propósito). `/hell status` solo dice que ocurren aleatoriamente cada 1–6 h. El instante se sortea de forma uniforme dentro del rango de la dificultad actual, así que puede caer en **cualquier segundo de esa ventana**.

## Apuestas

Se desbloquean en la **dificultad 3** (96 h). Se apuesta desde el canal de Hell con `/hell gamble` o `!gamble [horas] [real|gamble]`. Cada tirada exige al menos **15 minutos de reloj restantes**: apostar todo tu tiempo siempre se rechaza. Las apuestas se ajustan a **fichas de 15 minutos** y están limitadas por dificultad (1 h en D3, 2 h en D4).

Dos relojes, una sola casa:

**Real Timer** — el juego con límite de tasa. Pierdes lo apostado **y** recibes un silencio del servidor (1 minuto base, +1 minuto por cada ficha extra de 15 min). Enfriamiento de 5 min (D3) o 4 min (D4) entre las **apuestas rápidas** (2/h en D3, 3/h en D4); agotada la cuota, la misma apuesta sigue siendo posible en un **temporizador de desbordamiento** aparte (45 min en D3, 30 min en D4). Enfriamientos e historial se persisten en SQLite por evento, así que un reinicio —o una partida nueva— nunca filtra estado viejo.

**Gamble Time** — una cartera privada con la que todos empiezan con **1 h**. Sin límites de tasa, pero una pérdida cuesta **1.5×–2× de lo apostado** (más cuanto mayor sea la apuesta) y no hay silencio. La cartera es visible para todos en `/hell leaderboard` → `Gamble Time`.

Las probabilidades escalan con la dificultad (38 % en D3, 28 % en D4) y **bajan con lo apostado**: en la apuesta máxima conservas el 70 % de la probabilidad listada, mientras el multiplicador crece un poco (+0.5 en la apuesta máxima: 1.5×→2.0× en D3, 2.5×→3.0× en D4). Un acierto acredita **apuesta × multiplicador** sobre la apuesta intacta, y un **jackpot** adicional (8 % de la banda de acierto, +1.0 de multiplicador) paga aún más.

> [!IMPORTANT]
> **Toda apuesta tiene valor esperado negativo.** La casa es el Infierno y el Infierno siempre gana.

Cada resultado muestra el pago, el nuevo total del reloj y las **estadísticas de sesión** del jugador (apuestas, ganadas/perdidas, neto; más las apuestas rápidas restantes en Real Timer). El registro completo se persiste por evento y aparece en `/hell mystats` y en la ficha de estadísticas que llega por MD al terminar. Antes de apostar, `/hell odds` o `!odds` muestra las probabilidades y el pago exactos para la ficha de 15 minutos y para la apuesta máxima de la dificultad actual, **para que nadie apueste a ciegas**.

## El final de las 160 horas

Un sistema dedicado gobierna la última hora (`159:00:00 → 160:00:00`) sin acelerar el cronómetro global:

| Momento | Qué ocurre |
| --- | --- |
| **159:00:00** | Activa el modo `FINAL_HOUR` y emite: `👹 THE FINAL HOUR — 1 HOUR REMAINING — DO NOT LET HELL GO EMPTY.` |
| **159:30:00** | Anuncio `⚠️ 30 MINUTES REMAIN` |
| **159:50:00** | Anuncio `🚨 10 MINUTES REMAIN — HELL IS ALMOST CONQUERED.` |
| **159:55:00** | Anuncio `🔥 5 MINUTES REMAIN` |
| **159:59:00** | El progreso cambia a **modo de cuenta atrás final**, actualizándose cada segundo con los segundos exactos (`60` hasta `1`) |
| **160:00:00** | Completado atómico: dispara el hito de 160 h, congela todo el tiempo individual, marca `COMPLETED`, registra el pico de población del canal, envía el anuncio `@everyone` destacando las recompensas del Top 3 y manda fichas de estadísticas por MD a todos los participantes |

**Seguridad ante fallo:** si el canal se vacía durante la última hora, se ejecuta la cuenta atrás de gracia estándar. Si nadie vuelve antes de que expire, el reto falla de forma permanente.

## Clasificación

Segundos acumulados por usuario en el canal, acreditados solo mientras el evento está `RUNNING`, ordenados de mayor a menor, con 🥇🥈🥉 para el Top 3 y el resto numerado debajo. Los empates exactos comparten puesto (`1, 1, 3`). Irse y volver **sigue acumulando** en vez de reiniciar. Se congela y se guarda en FAILED, COMPLETED o CANCELLED.

## Hell 2

Al completarse las 160 h, y después de enviar las fichas de estadísticas, el bot publica una votación *«keep on Hell?»* con botones **Yes/No** que permanece abierta **10 minutos**. Si la mayoría vota **Yes**, un host puede ejecutar `/hell resume` y el mismo evento continúa hasta **320 h**. Después de 160 h **no hay hitos**: solo una recompensa final y **secreta** a las 320 h.
