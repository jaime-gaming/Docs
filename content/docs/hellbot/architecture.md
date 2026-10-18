---
description: "Capas, invariantes, modelo de datos y pruebas de hellbot: por qué un evento de 160 horas no se puede perder."
updated: "2026-10-18"
---

Si vas a cambiar **comportamiento**, empieza aquí. Si vas a cambiar **texto**, solo necesitas `Announcements.py`.

## Capas

```text
                     Announcements.py        ← todo el texto, recompensas y colores
                            │
                     hell/texts.py           ← lo carga, lo recarga en caliente, nunca falla por él
                            │
  ┌─────────────────────────┴───────────────────────────────────────────┐
  │  NÚCLEO PURO — sin imports de Discord, testeable de forma unitaria   │
  │                                                                      │
  │  timeline.py    reloj global del evento         0 → 160h             │
  │  tracking.py    relojes de sesión por usuario   0 → Xh cada uno      │
  │  grace.py       ventana de gracia del canal     máquina de 15s       │
  │  milestones.py  tabla de hitos y consultas                           │
  │  leaderboard.py clasificación, empates, podio                        │
  │  reports.py     fichas de estadísticas finales                       │
  │  alivecheck.py  programación y resolución del pase de lista          │
  │  engine.py      la máquina de estados que une todo lo anterior       │
  │  storage.py     persistencia SQLite de todo ello                     │
  └─────────────────────────┬───────────────────────────────────────────┘
                            │  entra Observation · sale DomainEvent
  ┌─────────────────────────┴───────────────────────────────────────────┐
  │  BORDE DE DISCORD                                                    │
  │                                                                      │
  │  monitor.py     sondeo del canal a 1s, ediciones de progreso         │
  │  embeds.py      cómo se ve cada mensaje                              │
  │  announcer.py   cómo se entrega cada mensaje                         │
  │  aliveio.py     pings, expulsiones y recuperación de respuestas      │
  │  dm.py          entrega de las fichas de estadísticas                │
  │  logsink.py     flujo de log en vivo a los MD del operador           │
  │  cog.py + ui.py comandos de barra, confirmaciones, permisos          │
  │  health.py      preflight de arranque (IDs, permisos, intents)       │
  │  bot.py         cableado y ciclo de vida                             │
  └──────────────────────────────────────────────────────────────────────┘
```

`launcher/` es un front-end de escritorio separado (`envfile.py` para la E/S de configuración, `runtime.py` para el hilo supervisor, `gui.py` para la ventana Tk). **Importa el bot; el bot nunca lo importa a él.**

## Los once invariantes

1. **El tiempo es absoluto.** Todo cálculo usa marcas POSIX; nada depende del tiempo de vida del proceso, así que un reinicio no puede desplazar ni resetear el cronómetro.
2. **El reloj nunca pasa de 160 h.** `EventTimeline.clamp()` se aplica antes de usar o guardar cualquier valor de tiempo transcurrido.
3. **Un estado terminal es terminal salvo reanudación explícita.** Una vez en FAILED, COMPLETED o CANCELLED, los ticks son inertes y la clasificación está congelada; solo `/hell reset` lo limpia, o `/hell resume` con MFA del operador para continuar una partida fallida.
4. **Un hito se dispara exactamente una vez.** `INSERT OR IGNORE` decide el ganador; `announced` solo se activa después de que Discord acepte el mensaje, así que un fallo entre ambos pasos lo vuelve a publicar en vez de perderlo.
5. **Solo se acredita tiempo observado**, con tope por tick (`MAX_TICK_CREDIT_SECONDS`), para que una caída nunca se pague en silencio. Con una excepción deliberada: una caída más corta que `DOWNTIME_CREDIT_SECONDS` se devuelve a los usuarios vistos en el canal **antes y después**, porque demostrablemente nunca se fueron.
6. **Los bots y los `@clanker` no existen** para el núcleo: el monitor los filtra antes de construir una `Observation`.
7. **Un canal vacío abre una ventana de gracia, no un fallo inmediato**, y el fallo se marca con la hora del momento en que el canal se vació, nunca más tarde. Si una comprobación de vida deja el canal vacío, se usa una gracia de recuperación de **2 minutos** en vez de la ventana normal de 15 segundos.
8. **Nada en la ruta de mensajes puede romper el evento.** Texto malo, placeholder ausente, envío fallido, MD cerrado: todo se registra, nada es fatal.
9. **El trabajo en segundo plano nunca bloquea el bucle de un segundo.** La E/S del pase de lista y la entrega de MD pasan por `hell/tasks.spawn()`, que además registra los fallos.
10. **Orden seguro ante fallos: la base de datos nunca queda contradiciendo a Discord.** Cada operación con estado escribe su fila **antes** de la llamada a la API de Discord que depende de ella, y limpia (o marca `pending`) si falla.
11. **La pausa es un desfase, no una parada.** `/hell pause` no cambia el estado del evento: registra `paused_ts` y acumula `paused_seconds` en la fila `event`. Cada lectura de hora se convierte con `_effective_now()` (`now − paused_seconds − pausa en curso`).

### El invariante 10 en detalle

Es el que sostiene todo lo demás:

- La **expiración de la gracia** ejecuta `_terminate(FAILED)` —un único `save_state` que fija `status` y limpia `grace_started_ts`— antes de cualquier limpieza en memoria, así que un fallo nunca puede dejar el evento en RUNNING sin ventana.
- Una **comprobación de vida** se persiste en `alive_check` **antes** de llamar a `send_check`. Un envío fallido borra la fila tentativa (nunca «la BD dice activa, Discord dice que no existe») y un envío correcto va seguido de una segunda escritura con el `channel_id` y el `message_id` reales. Una *excepción* de `send_check` (error de red) limpia exactamente igual que un resultado `None`, así que ninguna comprobación fantasma puede expulsar después a gente que nunca vio un pase de lista.
- La **resolución** escribe `alive_check_history` y limpia la fila pendiente **antes** de expulsar a nadie, así que un fallo a mitad de la expulsión deja un historial resoluble y ninguna comprobación pendiente obsoleta.
- Cada **MD de ficha** se registra en `dm_log` como `pending` **antes** de la llamada y se actualiza a `sent`, `blocked` o `failed` después, así que un fallo a mitad de la entrega reintenta exactamente a los destinatarios correctos y nunca vuelve a escribir a nadie marcado como `sent`.

### El invariante 11 en detalle

Mientras está pausado, las dos cronologías se detienen, los hitos, la gracia y el completado quedan inertes, y tras `/hell resume` los relojes continúan exactamente donde se pararon. Una ventana de gracia abierta se desplaza hacia delante por la pausa al reanudar, así que su cuenta atrás sigue con el tiempo que le quedaba. Un reinicio estando pausado vuelve pausado, y el healthcheck del contenedor trata un evento pausado como **sano**: un `last_tick_ts` congelado *no* es un monitor atascado.

## Modelo de datos (SQLite, esquema v3)

| Tabla | Qué guarda |
| --- | --- |
| `event` | Una fila: estado, marcas de inicio y fin, identificadores de canal y mensaje, ventana de gracia, `last_valid_observed_ts` y estado de pausa (`paused_ts`, `paused_seconds`, `pause_reason`) |
| `user_time` | Segundos acumulados por usuario (cronología 2) |
| `presence` | Quién está en el canal ahora mismo (se escribe solo cuando cambia) |
| `milestones` / `milestone_members` | Reclamaciones, marcas e instantáneas de elegibles |
| `final_leaderboard` | Clasificaciones congeladas |
| `alive_check` / `alive_check_history` | Pase de lista pendiente y resultados pasados |
| `dm_log` | Quién recibió ya su ficha (entrega reanudable) |
| `meta` | Versión del esquema, hora del próximo pase de lista y segundos no observados |

Las migraciones son **aditivas** y se ejecutan al arrancar (`Store._migrate`).

### Campos de reconstrucción tras un fallo

Estos campos de la fila `event` bastan para reconstruir el estado completo del evento tras cualquier caída; todo lo demás es derivado:

| Campo | Guarda |
| --- | --- |
| `start_ts` | Cuándo empezó el evento |
| `status` | IDLE, RUNNING, FAILED, COMPLETED o CANCELLED |
| `last_tick_ts` | Última observación fiable del canal (cualquier población) |
| `last_valid_observed_ts` | Última observación con al menos un humano válido |
| `grace_started_ts` | Cuándo empezó la ventana de gracia |
| `paused_ts` / `paused_seconds` | Si el evento está congelado y cuánto tiempo se ha acumulado como pausado |
| `end_ts` | Cuándo terminó, guardado como tiempo de evento ajustado por pausas |
| tabla `milestones` | Qué hitos se alcanzaron y cuándo |
| tabla `user_time` | Segundos acumulados por usuario |

Con eso más el reloj de pared, `resume_after_restart()` puede seguir vigilando, reanudar una ventana de gracia, congelar la clasificación o reenviar anuncios perdidos **sin adivinar nada**. Los mismos invariantes los ejercitan las pruebas de inyección de fallos en `tests/test_resilience.py`.

## Casos límite cubiertos por pruebas

| Caso | Comportamiento |
| --- | --- |
| Alguien entra exactamente en un hito | Incluido en la instantánea de elegibles de ese hito |
| Alguien sale exactamente en un hito | Excluido de la instantánea |
| Entra un bot en el canal | Ignorado en todas partes; no puede mantener vivo el evento |
| Entra un `@clanker` | Desconectado de inmediato, sin tiempo de clasificación, no mantiene vivo el evento |
| Se va el último participante válido | Ventana de gracia de 15 s y aviso sin pings; FAILED solo si nadie vuelve |
| Alguien vuelve con 1 s de margen | La ventana se cierra, aviso «SAVED», la partida sigue intacta |
| El canal se vacía repetidamente | Cada periodo vacío tiene su propia ventana; el tiempo sobrevivido nunca se infla |
| Un hito cae con el canal vacío | Se retiene y se concede a quien esté presente cuando el canal se recupere (o se pierde con la partida) |
| Reinicio a mitad de la ventana | La ventana se reanuda desde el `grace_started_ts` persistido |
| El evento termina con MD sin enviar | `dm_log` reanuda la entrega en el siguiente arranque, sin duplicados |
| Un concursante tiene los MD cerrados | Se registra como bloqueado, se informa en el resumen y `/hell mystats` sigue funcionando |
| API de Discord lenta durante un pase de lista | Expulsiones y anuncios corren fuera del bucle de 1 s, así que la vigilancia del canal nunca se atasca |
| Un hito editado con forma inválida | Se rechaza con un motivo legible; la tabla anterior sigue en vivo |
| Duración del evento editada en marcha | Se rechaza y se registra: el reloj en marcha nunca se remodela |
| Sin internet, token malo o intent ausente | Error limpio de una línea, código de salida propio y traceback completo en `logs/` |
| Entradas y salidas rápidas | El muestreo de 1 segundo mantiene correctos los totales por usuario |
| Reinicio a mitad del evento | Estado recargado desde SQLite; transcurrido = `now - start_ts`; nada se resetea |
| Reinicio estando pausado | El evento vuelve pausado: los dos relojes siguen congelados hasta `/hell resume` |
| Reinicio alrededor de un hito | La reclamación atómica en BD evita duplicados; los anuncios no enviados se republican al arrancar |
| Las 160 h llegan durante una actualización de 10 s | El tick de 1 s lo ajusta todo a `start_ts + 160h`; el completado gana a un canal vacío en el límite |
| Tiempos totales idénticos | Puesto compartido y orden de visualización determinista |
| 250 personas en el canal en un hito | Mensaje repartido entre campos del embed; nunca supera los límites de Discord |
| Bot offline brevemente | El cronómetro sigue y quien estaba antes **y** después recupera ese tiempo |
| Bot offline mucho tiempo | El cronómetro sigue, pero la ventana no observada **no** se acredita a nadie y se informa en el mensaje de progreso |
| Pase de lista + reinicio | El estado se persiste; las respuestas enviadas offline se recuperan y una comprobación expirada se cancela en vez de expulsar |
| Todos ignoran el pase de lista | Todos son desconectados, el canal se vacía y arranca una gracia de recuperación de 2 minutos |
| Evento pausado durante un fallo | Los dos relojes se congelan: sin hitos, sin pases de lista, sin expiración de gracia y sin fallo |
| La pausa cruza la marca de 160 h | El completado espera al tiempo *efectivo*: una partida pausada nunca puede completarse antes |
| Alguien entra a mitad de una comprobación | Sin ping, sin obligación de responder y nunca expulsado por ello |
| Fallo de la API en un mensaje | Se registra y se reintenta en el ciclo siguiente; el estado del evento intacto |

Dos decisiones de política deliberadas que conviene conocer:

- **Una caída no hace fallar el evento** (el bot no puede demostrar que el canal se vació mientras estaba ciego), pero nadie gana tiempo de clasificación por esa ventana y el hueco se muestra en la salida de progreso y estado.
- Si el canal está vacío **en el mismo tick** en que caería un hito, gana el fallo: no había nadie presente para reclamar la recompensa.

## Pruebas

`tests/` replica las capas. Sin red, sin token de Discord y sin pantalla:

| Archivo | Cubre |
| --- | --- |
| `test_engine`, `test_grace`, `test_properties` | La máquina de estados, la regla de gracia y ejecuciones de caos aleatorizadas que afirman los invariantes anteriores |
| `test_storage`, `test_reports`, `test_leaderboard_and_milestones` | Persistencia, fichas y clasificación |
| `test_alivecheck`, `test_health_and_aliveio` | Pases de lista de punta a punta y diagnóstico de preflight |
| `test_announcer`, `test_announcements_file` | Límites de embed y que `Announcements.py` de verdad gobierna cada mensaje |
| `test_integration`, `test_command_flows`, `test_bot`, `test_monitor` | El borde de Discord a través de dobles: monitor → motor → anunciador → canal, cada callback de comando y el enrutado de eventos |
| `test_gui`, `test_launcher`, `test_logging`, `test_logsink` | El lanzador de escritorio (sin ventana, vía `tests/faketk.py`) y el logging |
| `test_deployment`, `test_consistency` | Que el contenedor arranca de verdad desde los archivos que copia; configuración, comandos y documentación no pueden divergir |
| `test_resilience` | Las rutas de «Discord dijo que no»: canales prohibidos, límites de tasa, mensajes borrados, reinicios a mitad de un pase de lista, más **inyección de fallos** en cada frontera entre escritura en BD y llamada a la API |

```bash
pip install -r requirements-dev.txt

./tools/check.sh          # compile + pyflakes + ruff + mypy + pruebas + simulaciones
./tools/check.sh --fast   # lo mismo, sin las simulaciones
python -m pytest          # solo pruebas: no hace falta conexión con Discord

python tools/simulate.py              # imprime cada mensaje de una partida completa de 160 h, offline
python tools/simulate.py --fail-at 40 # …de una partida que muere a las 40 horas
```

`tools/simulate.py` conduce **el motor real y los renderizadores de mensajes reales** sin conexión: es la forma más rápida de revisar textos o verificar un cambio de regla de punta a punta. La configuración de las herramientas vive en `pyproject.toml`.

Hay un workflow de GitHub Actions ya hecho (pruebas en Python 3.10–3.12, lint y las dos rutas de simulación) en `deploy/github-actions-ci.yml`: se copia a `.github/workflows/ci.yml` para activarlo.

**Marca.** `assets/hellbotlogo.png` es la obra maestra. Tras cambiarla, ejecuta `python tools/make_icon.py` para regenerar el icono de ventana, el logotipo de cabecera y el `.ico` mult tamaño de Windows que usa el ejecutable compilado.
