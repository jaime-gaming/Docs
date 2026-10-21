---
title: "Casos límite"
icon: "alert"
order: 30
blurb: "los 32 casos raros, agrupados, y qué hace el bot en cada uno."
description: "Los 32 casos límite de hellbot y qué hace el bot en cada uno: hitos, gracia, roll call, pausa, reinicios, caídas y ediciones en marcha."
updated: "2026-10-19"
---

Un evento de 160 horas no se puede repetir. Si algo sale mal a la hora 90, no hay segunda partida, así que los casos raros no son un apéndice: son el reglamento. El [`README.md`](https://github.com/jaime-gaming/hellbot/blob/main/README.md) del repositorio los lista en una tabla de 32 filas con la nota de que **todos están cubiertos por pruebas**. Aquí están agrupados por tema, que es como se consultan cuando algo está pasando.

> [!NOTE]
> La columna de la derecha es el comportamiento, no la intención. Si el bot hace otra cosa, es un fallo: estos casos tienen prueba detrás.

## Hitos y clasificación

| Caso | Qué hace |
| --- | --- |
| Alguien entra **justo** cuando cae un hito | Queda incluido en la instantánea de elegibles de ese hito |
| Alguien sale **justo** cuando cae un hito | Queda excluido de la instantánea |
| Un hito cae con el canal de voz vacío | Se retiene y se entrega a quien esté presente cuando el canal se recupere, o se pierde con la partida |
| El bot reinicia alrededor de un hito | La reclamación atómica en la base de datos impide duplicados, y los anuncios no enviados se vuelven a publicar al arrancar |
| Las 160 h caen durante una actualización de 10 s | El tick de 1 s lo recorta todo a `start_ts + 160h`; **la compleción gana** a un canal vacío en la fecha límite |
| Dos personas con el mismo tiempo total | Rango compartido y orden de presentación determinista |
| 250 personas en el canal cuando cae un hito | El mensaje se divide entre campos del embed y **nunca supera los límites de Discord** |

## Quién cuenta como participante

| Caso | Qué hace |
| --- | --- |
| Un bot entra al canal | Ignorado en todas partes; **no puede mantener vivo el evento** |
| Entra un `@clanker` | Desconectado de inmediato, sin tiempo en la clasificación y sin poder mantener vivo el evento |
| Entradas y salidas rápidas y repetidas | El muestreo de un segundo mantiene correctos los totales por persona |
| Alguien sale y vuelve | Los totales siguen acumulando |
| Alguien entra en mitad de una comprobación de vida | No recibe ping, no está obligado a responder y **nunca se le expulsa por ello** |

## Canal vacío, gracia y comprobaciones de vida

| Caso | Qué hace |
| --- | --- |
| Sale el último participante válido | Ventana de gracia de **15 s** más un aviso sin ping; `FAILED` solo si no vuelve nadie |
| Alguien vuelve con 1 s de margen | La ventana se cierra, sale el aviso **«SAVED»** y la partida continúa intacta |
| El canal se vacía varias veces | **Cada periodo vacío tiene su propia ventana**; el tiempo sobrevivido nunca se infla |
| Reinicio en mitad de la ventana de gracia | La ventana se reanuda desde el `grace_started_ts` persistido |
| Comprobación de vida más reinicio | El estado de la comprobación está persistido: las respuestas enviadas mientras no había conexión se recuperan, y una comprobación caducada **se cancela en vez de expulsar gente** |
| Todo el mundo ignora la comprobación | Se desconecta a todos, el canal se vacía y arranca un **periodo de recuperación de 2 minutos** antes del fallo |

## La pausa

| Caso | Qué hace |
| --- | --- |
| El bot reinicia estando en pausa | El evento vuelve pausado: los dos relojes siguen congelados hasta `/hell resume` |
| Se pausa durante un fallo | Se congelan el reloj global y los por persona; no hay hitos, ni roll call, ni caducidad de gracia, ni fallo. **El tiempo en pausa no cuenta nunca** |
| La pausa sorprende a una ventana de gracia abierta | La cuenta atrás también se congela; al reanudar **continúa con el tiempo que le quedaba** |
| La pausa cruza la marca de las 160 h | La compleción espera al tiempo **efectivo**: una partida pausada no puede completarse antes de tiempo |

## Reinicios, caídas y la API de Discord

| Caso | Qué hace |
| --- | --- |
| El evento termina con mensajes directos sin enviar | `dm_log` reanuda la entrega en el siguiente arranque, **sin duplicados** |
| Un participante tiene los MD cerrados | Se registra como bloqueado, se reporta en el resumen y `/hell mystats` sigue funcionando |
| La API de Discord va lenta durante un roll call | Las expulsiones y los anuncios corren **fuera del bucle de un segundo**, así que la vigilancia del canal nunca se atasca |
| Sin internet, token malo o intent que falta | Error limpio de una línea y un código de salida distinto; la traza completa queda en `logs/` |
| El bot reinicia a mitad de evento | El estado se recarga desde SQLite; el tiempo transcurrido es `now - start_ts` y **no se reinicia nada** |
| El bot cae un rato (reinicio, despliegue, crash) | El cronómetro sigue corriendo y **quien estaba en el canal antes *y* después de la caída recupera ese tiempo**: nadie pierde progreso por una caída del bot |
| El bot cae durante mucho tiempo | El cronómetro sigue corriendo, pero la ventana no observada **no se acredita a nadie** y se reporta en el mensaje de progreso |
| La API de Discord falla al enviar un mensaje | Se registra y se reintenta en el ciclo siguiente; **el estado del evento no se toca** |

## Editar el evento en marcha

| Caso | Qué hace |
| --- | --- |
| Un hito se edita a una forma inválida | Se rechaza con un motivo legible y **la tabla anterior sigue viva** |
| La duración del evento se edita con la partida en marcha | Se rechaza y se registra: **el reloj en marcha nunca se remodela** |

## Dos decisiones de diseño

Las dos las explica el propio README y merecen quedar aparte, porque son elecciones y no consecuencias.

> [!IMPORTANT]
> **Una caída no hace fallar el evento.** El bot no puede demostrar que el canal se vaciara mientras estaba ciego, así que no falla. Pero nadie gana tiempo de clasificación por esa ventana, y el hueco se muestra en la salida de progreso y de estado.

> [!WARNING]
> **Si el canal está vacío en el mismo tick en que caería un hito, gana el fallo.** No había nadie presente para reclamar la recompensa.

## Dónde seguir

- [Reglas del evento](/hellbot/rules/) — el reglamento normal, del que estos casos son el borde.
- [Arquitectura](/hellbot/architecture/) — las invariantes que hacen que estos comportamientos se sostengan tras un reinicio.
- [Comandos](/hellbot/commands/) — `/hell pause`, `/hell resume`, `/hell reset` y `/hell mystats`.
