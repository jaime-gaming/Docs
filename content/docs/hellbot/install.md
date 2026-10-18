---
description: "Arrancar hellbot en Windows sin consola, desde consola en cualquier sistema o con Docker, y la lista de permisos de Discord."
updated: "2026-10-18"
---

## Windows: doble clic, sin consola

1. Descarga o clona la carpeta del proyecto.
2. Doble clic en **`run_bot.bat`** (o `run_bot_silent.vbs` si no quieres que aparezca ni la ventana de instalación). La primera ejecución crea un entorno virtual e instala las dependencias automáticamente.
3. Se abre el **panel de control**. Rellena la pestaña Settings → **Save settings** → **Start bot**.

¿Prefieres un solo archivo para pasárselo a otra persona? Ejecuta **`build_exe.bat`** una vez y obtienes `dist\WelcomeToHellBot.exe`: sin Python en la máquina destino, sin ventana de consola, y conserva `.env`, `data\` y `logs\` a su lado.

Para depurar con la salida visible está **`run_bot_console.bat`**.

## Cualquier sistema: consola

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # token, identificadores de canales y de roles
python bot.py
```

## Docker

```bash
cp .env.example .env      # rellénalo
docker compose up -d      # el estado vive en el volumen hell-data
```

Hay una unidad de systemd en `deploy/hellbot.service`.

### Qué hace la imagen

El `Dockerfile` parte de `python:3.12-slim` y toma cuatro decisiones que conviene conocer antes de operar el bot en un contenedor:

| Decisión | Detalle | Por qué importa |
| --- | --- | --- |
| **Estado en un volumen** | `VOLUME /data`, con `DATABASE_PATH=/data/hell.sqlite3` | Los reinicios **y las reconstrucciones de la imagen** no pierden el cronómetro, la clasificación ni el historial de hitos |
| **Usuario sin privilegios** | `hellbot`, uid 10001, dueño de `/data` y `/app` | El bot no corre como root |
| **Healthcheck real** | cada 60 s, timeout 10 s, arranque 90 s, 3 reintentos | Ejecuta `tools/healthcheck.py --max-lag 120`: si hay un evento en marcha y la última observación del canal es más antigua que eso, el contenedor se marca no sano y se reinicia |
| **Solo lo que se usa en runtime** | copia `hell/`, `tools/healthcheck.py`, `docs/`, `Announcements.py` y `bot.py` | `Announcements.py` es obligatorio: el bot lee ahí todos sus textos y no arranca sin él |

El `.dockerignore` deja fuera del contexto de build `.git/`, los entornos virtuales y las cachés, y —lo importante— **todo lo que es estado o secreto**: `.env`, `data/`, `logs/` y los `*.sqlite3` con sus `-wal` y `-shm`. Nunca se hornea una base de datos ni unas credenciales dentro de la imagen.

> [!TIP]
> El healthcheck mira el **archivo de estado, no el proceso**. Un bot vivo pero con el bucle de monitorización atascado es peor que uno caído, porque el evento sigue corriendo mientras nadie observa el canal. Ese es exactamente el fallo que el healthcheck está diseñado para detectar.

El comando de arranque es `python bot.py`, que es el punto de entrada de cinco líneas que llama a `hell.bot.main`.

> [!WARNING]
> **Puerto 8080 ya en uso** (`Web dashboard NOT started: port 8080 is already in use`): el dashboard enlaza `WEB_PORT` (8080 por defecto) dentro del contenedor y docker-compose publica *el mismo* valor, así que se cambia en un solo sitio: `WEB_PORT=8090` en `.env` y otra vez `docker compose up -d`.
>
> Si el log dice que el puerto está en uso pero no hay nada más corriendo, busca una **segunda instancia del bot** (`docker ps | grep hell` o `ps aux | grep bot`): solo puede haber un proceso por `.env`. Dos instancias acreditan tiempo doble y se pelean por cada comando `/hell`. Como red de seguridad el bot se niega a arrancar una segunda instancia contra la misma base de datos (un `flock` sobre `<data dir>/hellbot.lock`), así que una copia duplicada sale de inmediato con un error claro en vez de causar estragos.

## El panel de control

`launcher_main.py` —lo que arrancan el `.bat` y el `.exe`— es una pequeña aplicación de escritorio en Tk:

| Pestaña | Qué ofrece |
| --- | --- |
| **Dashboard** | Estado del bot, estado del evento, población del canal en vivo, próximo hito, barra de progreso de las 160 h y el resultado de las comprobaciones de configuración del lado de Discord. |
| **Log** | Las mismas líneas que van a `logs/hellbot.log`, en color y en vivo, con un botón para abrir la carpeta. |
| **Settings** | Cada valor de `.env` con ayuda en línea, el token enmascarado tras un interruptor de *mostrar*, validación antes de guardar y escritura atómica para que un fallo no pueda corromper el archivo. |

El bot corre en su propio bucle asyncio en un hilo en segundo plano, así que la ventana nunca se congela; cerrarla pide confirmación y apaga el bot limpiamente. Los errores (token malo, intent que falta, sin red) aparecen como ventanas emergentes y en el Dashboard, en vez de desaparecer en una consola que nadie mira.

## Lista de configuración en Discord

**1. Developer Portal → Bot → Privileged Gateway Intents**: activa **Server Members Intent** y **Message Content Intent**. El segundo es obligatorio para que el bot pueda leer las respuestas de las comprobaciones de vida: sin él **nadie podrá responder nunca a un pase de lista**.

**2. Invita al bot con estos permisos:**

| Permiso | Por qué |
| --- | --- |
| View Channel + Connect en el canal objetivo | Para ver quién está dentro |
| **Move Members** | Para desconectar a los usuarios `@clanker` |
| Send Messages / Embed Links / Read Message History en el canal de anuncios | Anuncios y edición del mensaje de progreso |
| **Mention @everyone** | Pings de hito, arranque, fallo y completado |
| Manage Messages *(opcional)* | Permite al bot fijar el mensaje de progreso en vivo |

El bot verifica todo esto al arrancar (`hell/health.py`) y te dice exactamente qué falta, en el log y en el Dashboard del lanzador.

## Variables de configuración

### Obligatorias

| Variable | Significado |
| --- | --- |
| `DISCORD_TOKEN` | Token del bot |
| `GUILD_ID` | Identificador del servidor (los comandos de barra se sincronizan al instante con este servidor) |
| `VOICE_CHANNEL_ID` | El canal de Hell (por defecto `1539756705997652079`) |
| `ANNOUNCE_CHANNEL_ID` | Canal de texto para anuncios y el mensaje de progreso en vivo |
| `GAMENIGHT_HOST_ROLE_ID` | `@gamenight host`: el único rol que puede arrancar, parar y reiniciar |
| `CLANKER_ROLE_ID` | `@clanker`: se desconectan automáticamente y nunca ganan tiempo de clasificación |

### Opcionales

| Variable | Por defecto | Significado |
| --- | --- | --- |
| `HELL_ROLE_ID`, `HELLIST_ROLE_ID`, `HELL_MASTER_ROLE_ID`, `COOL_PEOPLE_ROLE_ID` | — | Solo se usan para renderizar menciones reales de rol en los mensajes de recompensa |
| `DATABASE_PATH` | `data/hell.sqlite3` | Ruta de la base de datos |
| `MONITOR_INTERVAL` / `PROGRESS_INTERVAL` | `1` s / `20` s | Frecuencia del monitor y del mensaje de progreso |
| `STARTUP_GRACE_SECONDS` | `15` | Las lecturas del canal justo tras arrancar se observan pero no pueden hacer fallar el evento (guarda de caché fría) |
| `EMPTY_VC_GRACE_SECONDS` | `15` | Cuánto puede estar vacío el canal antes de que la partida falle |
| `SEND_FINAL_DMS` / `DM_DELAY_SECONDS` | `true` / `1` | Fichas de estadísticas al terminar |
| `LOG_DM_ENABLED` | `true` | Flujo de log en vivo |
| `LOG_DM_USER_ID` | `984083829767675965` | Quién lo recibe |
| `LOG_DM_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING` o `ERROR` |
| `LOG_DM_FLUSH_SECONDS` | `3` | Intervalo de agrupamiento |
| `LOG_DM_PING_LEVEL` | `ERROR` | Las líneas de esta severidad o peor, más cualquier límite de tasa de Discord, hacen ping al operador por MD |
| `LOG_DM_PING_COOLDOWN_SECONDS` | `300` | Segundos mínimos entre pings de alerta |
| `MAX_TICK_CREDIT_SECONDS` | `5` | Tope de acreditación por comprobación, para que una caída nunca se acredite en silencio |
| `DOWNTIME_CREDIT_SECONDS` | `300` | Una caída de hasta esta duración se devuelve a quien estaba en el canal antes **y** después |
| `HEARTBEAT_MINUTES` | `15` | Línea de prueba de vida en el log |
| `ALIVE_CHECK_ENABLED` | `true` | Activar las comprobaciones de vida |
| `ALIVE_CHECK_MIN_HOURS` / `ALIVE_CHECK_MAX_HOURS` | `1` / `6` | La ventana aleatoria |
| `ALIVE_CHECK_TIMEOUT_MINUTES` | `5` | Tiempo para responder |
| `ALIVE_CHECK_STRICT` | `false` | `true` acepta solo la cadena exacta `Yes` |
| `ALIVE_CHECK_CHANNEL_ID` | — | Dónde se publica el pase de lista; vacío = **el propio chat de texto del canal** |
| `LOG_LEVEL` | `INFO` | Nivel de log |
| `WEB_PORT` | `8080` | Puerto del dashboard; `0` lo desactiva |

> [!IMPORTANT]
> **El requisito del canal de voz no es configurable.** `/hell start` se niega a arrancar el evento mientras el canal objetivo no tenga ningún humano válido: un arranque con el canal vacío es imposible, diga lo que diga el `.env`. Es una regla dura, no un interruptor.

> [!WARNING]
> **Los booleanos se analizan de forma estricta.** Se aceptan `true`/`yes`/`on`/`1` y `false`/`no`/`off`/`0`. Cualquier otra cosa —por ejemplo una errata como `ture` o `flase`— **hace fallar el arranque** con un error claro, en vez de desactivar en silencio la función que se quería encender.

## Desarrollo

```bash
./tools/check.sh        # lint + tipos + pruebas
python tools/simulate.py  # simulación offline, sin Discord
```

La suite cubre motor, persistencia, casos límite de Discord, GUI y despliegue, con ruff y mypy limpios y un 88 % de cobertura.
