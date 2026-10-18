---
description: "Los comandos de hellbot: quién puede usarlos, qué hacen y qué protecciones llevan los destructivos."
updated: "2026-10-18"
---

Toda la salida son **embeds**. Las menciones dentro de un embed nunca hacen ping, así que un hito puede listar 250 usuarios elegibles sin 250 notificaciones, mientras el ping `@everyone` se queda en el contenido del mensaje.

## Comandos del evento

| Comando | Quién | Qué hace |
| --- | --- | --- |
| `/hell start` | `@gamenight host` | Arranca el evento: estado → `RUNNING`, registra la marca de inicio absoluta, pone en marcha el cronómetro de 160 h, inicia la vigilancia del canal y el seguimiento por usuario, y publica el anuncio de comienzo. **Se rechaza** si ya hay uno en marcha o si el canal está vacío (requisito duro). |
| `/hell status` | Todos | Estado, transcurrido, restante, % completado, barra de progreso, población del canal en vivo, hito actual y siguiente, e hitos ya alcanzados. Usado **en el chat de texto del canal** responde en su lugar con un enlace a la tarjeta de estado fijada. |
| `/hell leaderboard` | Todos | Clasificación por Real Timer (tiempo de canal) o por cartera **Gamble Time** (`board:`). En el chat del canal, Real Timer responde con el enlace a la clasificación fijada. |
| `/hell help` | Todos | Qué es el evento, todos los comandos y las reglas en una tarjeta. |
| `/hell user` | Todos | Cuánto ha pasado alguien en el Infierno: tiempo, puesto, porcentaje del evento e hitos reclamados. |
| `/hell mystats` | Todos | Tu propia ficha de estadísticas (tiempo sobrevivido, puesto, recompensas). Útil si tienes los MD cerrados. |
| `/hell milestones` | Todos | Los cinco hitos, sus recompensas, cuándo se alcanzó cada uno y cuántos usuarios eran elegibles. |
| `/hell export` | `@gamenight host` | La clasificación como archivo CSV adjunto, para repartir recompensas fuera de Discord. |
| `/hell difficulty` | Todos / host | Muestra los 5 niveles y el actual; `action: set` (solo host, `0`–`4` o `auto`) lo sobrescribe; `action: announce` (solo host) lo publica en el canal de anuncios. |

## Comprobaciones y diagnóstico

| Comando | Quién | Qué hace |
| --- | --- | --- |
| `/hell alivecheck` | **Solo MD**: operador o `@gamenight host` | Ejecuta un pase de lista de inmediato en vez de esperar al temporizador aleatorio. **Nunca** en un canal del servidor. |
| `/hell doctor` | `@gamenight host` | Autocomprobación: resultados del preflight, estado en vivo, tareas en segundo plano y la configuración (redactada). |
| `/hell logs` | `@gamenight host` | Controla el flujo de log en vivo: `status`, `on`, `off`, `test`, `flush` y la severidad mínima. |
| `/hell security` | `@gamenight host` | **Informe antitrampas**: evasión de comprobaciones de vida, entradas y salidas rápidas del canal, picos de límite de tasa y salud del monitor. Cualquier cosa sospechosa dispara además una alerta automática a los MD del operador. |
| `/hell errors` | Todos | Busca un código de error (por ejemplo `/hell errors HEL-100`) y devuelve su explicación completa: qué significa y qué hacer. |
| `/hell reloadmessages` | `@gamenight host` | Vuelve a leer `Announcements.py` para que los textos editados se apliquen de inmediato. |

## Anuncios y tiempo

| Comando | Quién | Qué hace |
| --- | --- | --- |
| `/hell broadcast` | `@gamenight host` | Publica el mensaje del host como embed de color: `level: info/warning/error/…`, `target: announcements` o `vc`, sin texto plano fuera del embed. Con `target: participants` el mensaje se envía **por MD literalmente (Markdown) a cada concursante** con tiempo registrado (respaldo: el canal actual); los MD cerrados se contabilizan, una conexión muerta detiene la partida y el host recibe un resumen honesto. También `!broadcast <nivel> participants <mensaje>`. |
| `/hell adjtime` | `@gamenight host` | Suma o resta horas del **Real Timer** o del **Gamble Time** de un miembro (`hours` puede ser negativo). |
| `/hell gamble` | Todos | Dificultad 3+: apuesta **Real Timer** (cuota horaria de apuestas rápidas + temporizador de desbordamiento) o **Gamble Time** (sin límites de tasa; perder cuesta 1.5–2× de lo apostado). Las apuestas se ajustan a fichas de 15 minutos y no puedes apostar todo tu tiempo (`gamble_max_bet_hours`). Cada resultado muestra el pago y las estadísticas de sesión; una pérdida de Real Timer añade además un silencio del servidor. |
| `/hell odds` | Todos | La tarjeta de probabilidades de la casa para la dificultad actual: probabilidad de acierto y pago en la ficha de 15 minutos y en la apuesta máxima, la banda de jackpot, el coste de perder por reloj y los límites de tasa (o la pista de desbloqueo mientras las apuestas estén cerradas). También `!odds` o `!gamble odds`. |

## Comandos protegidos

Estos tres exigen **aprobación del operador en dos pasos**, porque son irreversibles o cambian el estado de una partida de 160 horas.

| Comando | Quién | Qué hace |
| --- | --- | --- |
| `/hell stop` | `@gamenight host` | **Dos pasos, aprobado por el operador.** El bot envía un código de un solo uso a los MD del operador; el host ejecuta `/hell approve` con ese código → evento marcado como **CANCELLED** (explícitamente *no* FAILED) y clasificación congelada. |
| `/hell reset` | `@gamenight host` | **Dos pasos, aprobado por el operador.** Mismo flujo de código → todos los datos del evento se borran para una partida nueva. |
| `/hell approve` | `@gamenight host` | Introduce el código de 6 caracteres enviado al operador para confirmar el `/hell stop`, el `/hell reset` o la reanudación de una partida fallida. Los códigos **caducan a los 5 minutos** y funcionan **exactamente una vez**; una petición nueva invalida el código anterior. |

## Pausa y reanudación

| Comando | Quién | Qué hace |
| --- | --- | --- |
| `/hell pause` | `@gamenight host` | **Congelación de emergencia.** Detiene el reloj de 160 h **y** el de cada concursante al instante: no pueden dispararse hitos, ninguna comprobación de vida puede expulsar y la cuenta atrás de gracia también se congela. **Nada puede fallar mientras esté pausado.** Se persiste, así que un reinicio sigue pausado. |
| `/hell resume` | `@gamenight host` | Descongela tras una pausa, continúa una partida fallida (exige MFA del operador vía `/hell approve`) o, tras una mayoría de **Yes** en la votación *keep on Hell?* de las 160 h, arranca **Hell 2**: la misma partida continúa hasta **320 h**, sin hitos después de 160 h y solo una recompensa final secreta. |
| `/hell restart` | **Solo MD del operador** | **Reinicia el proceso del bot.** Sale con código 42 para que Docker, systemd o el lanzador lo vuelvan a levantar. El estado del evento se conserva en SQLite y se recupera automáticamente. |

## Servidor y mensajes directos

**Comandos de servidor.** Se ejecutan con comandos de barra (`/hell <comando>`) **o** con el prefijo `!` directamente en los canales del servidor: `!status`, `!leaderboard`, `!gamble 0.5`, `!hell status`. `!status` y `!leaderboard` usados en el chat de texto del canal responden con los enlaces a las tarjetas fijadas, igual que sus gemelos de barra.

**Comandos por MD.** Los mismos comandos con prefijo `!` también funcionan en MD con el bot: `!status`, `!help`, `!restart`, `!doctor`, `!hell status`. Los comandos con `!` aplican **las mismas comprobaciones de autorización** de host u operador en todos los sitios donde se ejecutan.

`!dump` (operador, solo MD) exporta **la base de datos entera** como un archivo `.sql` restaurable más un resumen legible `.txt`. Se toma en modo de solo lectura, así que el evento en vivo nunca se pausa.

## Cambiar lo que dice el bot

Cada mensaje, título, pie, recompensa, emoji y color vive en un solo archivo en la raíz del proyecto: **`Announcements.py`**. Sin lógica, solo texto.

```python
    {
        "hours": 32,
        "title": "🔥 32 HOURS SURVIVED",
        "blurb": "Welcome to Hell has reached the first milestone.",
        "flavour": "The first gate is behind you. 128 hours to go — the easy part is over.",
        "reward": "@hell (limited)",
        "short_reward": "@hell",
    },
```

Está organizado en secciones numeradas —hitos, arranque, progreso en vivo, periodo de gracia, fallo, cancelación, completado, clasificación, comprobaciones de vida, fichas de estadísticas, respuestas de comandos y colores— y cada bloque lista los `{placeholders}` que acepta.

- **Edita el texto entre comillas**, conserva los `{placeholders}` que quieras y guarda.
- `CMD_STATUS_VC_LINK` y `CMD_LEADERBOARD_VC_LINK` (sección 12) son los enlaces de mensaje que el bot publica para `/hell status` y `/hell leaderboard` **en el chat del canal**: pega ahí los enlaces de tus propios mensajes fijados.
- Ejecuta **`/hell reloadmessages`** (solo host) y el nuevo texto está en vivo: sin reiniciar y sin riesgo para un evento de 160 horas en marcha.
- Si tu edición tiene un error de sintaxis o falta un nombre, el bot **conserva el texto cargado anteriormente** y te dice exactamente qué se rompió (`hell/texts.py`). **Nunca falla por un texto malo.**
- Un `{placeholder}` desconocido degrada a la plantilla cruda y se registra, en vez de matar el anuncio al que pertenece.
