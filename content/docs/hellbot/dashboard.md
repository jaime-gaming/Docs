---
description: "El dashboard web en vivo de hellbot: WebSocket, respaldo por sondeo, página del operador y publicación estática conectada al bot real."
updated: "2026-10-18"
---

El bot sirve un **dashboard web en vivo** en `WEB_PORT` (8080 por defecto; `0` lo desactiva). Hay dos páginas: la pública `/` y la del operador `/dev`.

## Cómo se conectan los navegadores

Los navegadores se conectan como pueden, en este orden:

| Vía | Qué ofrece |
| --- | --- |
| **WebSocket** (`/ws`) | La instantánea actual **al instante en cuanto conectas** y una nueva cada **5 segundos** |
| **Sondeo** (`/status.json`) | Si los WebSockets están bloqueados (algunos proxies), la página sondea este archivo, que **se sirve en vivo desde el estado actual del bot**, nunca desde el archivo estático obsoleto |
| **Salud** (`/health`) | Informa de los clientes conectados y de la antigüedad de la instantánea |

> [!NOTE]
> La clave del diseño es que `/status.json` no es un archivo en disco que alguien actualice: es una respuesta generada desde el estado en memoria del bot en cada petición. Por eso el respaldo por sondeo muestra los mismos datos que el WebSocket, solo con hasta 5 segundos más de retardo.

## Publicación estática conectada al bot real

Las mismas páginas funcionan **estáticamente en GitHub Pages**, y ahí se conectan al **bot real**. La página descubre la dirección del bot por tres vías:

1. El parámetro **`?server=`** en la URL.
2. El botón **🔌**, cuya dirección se guarda en el navegador.
3. El puntero **`docs/live-server.json`**, que el bot publica cuando `WEB_PUBLIC_URL` está configurado (necesita `GITHUB_PAGES_SYNC` para llegar a GitHub).

**CORS está abierto** en los endpoints del bot para que las lecturas entre orígenes funcionen. Solo si ningún bot en vivo responde, la página cae al `status.json` estático sincronizado.

```text
GitHub Pages (estático)  ──►  ¿hay bot en vivo?
                              ├─ sí  ──► WebSocket / status.json en vivo del bot
                              └─ no  ──► status.json estático sincronizado
```

### Qué hay commiteado en `docs/`

Las dos páginas no se generan en el despliegue: son ficheros del repositorio, y `docs/` es exactamente lo que `hell/pages_sync.py` sube.

| Fichero | Tamaño | Qué es |
| --- | --- | --- |
| [`docs/index.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/index.html) | 60 KB | El dashboard público, titulado *Welcome to Hell — Live Dashboard* |
| [`docs/dev.html`](https://github.com/jaime-gaming/hellbot/blob/main/docs/dev.html) | 31 KB | El del operador, *Welcome to Hell — Dev & Operator Dashboard*; enlaza de vuelta a `index.html` |
| [`docs/status.json`](https://github.com/jaime-gaming/hellbot/blob/main/docs/status.json) | 3,5 KB | La instantánea estática de respaldo |
| [`docs/ARCHITECTURE.md`](https://github.com/jaime-gaming/hellbot/blob/main/docs/ARCHITECTURE.md) | 11 KB | Las notas de arquitectura |
| [`docs/_config.yml`](https://github.com/jaime-gaming/hellbot/blob/main/docs/_config.yml) | 418 B | Título y descripción del sitio |
| [`docs/.nojekyll`](https://github.com/jaime-gaming/hellbot/blob/main/docs/.nojekyll) | 0 B | Que Pages sirva los ficheros tal cual |

El `.nojekyll` vacío es el que manda: mientras esté ahí, Pages sirve los ficheros sin procesarlos, así que el `theme: jekyll-theme-cayman` del `_config.yml` **no llega a aplicarse nunca**. De esa configuración solo cuentan de verdad el título y la descripción.

> [!NOTE]
> La propia descripción del `_config.yml` declara el alcance del dashboard: muestra errores, avisos, límites de peticiones y salud del monitor, **sin datos de participantes ni tokens**.

> [!WARNING]
> El comentario del `_config.yml` dice que `index.html` y `status.json` se despliegan con `.github/workflows/gh-pages.yml`, pero **ese workflow no existe**: el repositorio no tiene carpeta `.github/`. Lo que publica `docs/` es el propio bot en runtime, vía `hell/pages_sync.py` y `GITHUB_PAGES_SYNC`.

### Ver el dashboard sin conectar a Discord

[`tools/demo_web.py`](https://github.com/jaime-gaming/hellbot/blob/main/tools/demo_web.py) (2 KB) levanta **la pila de producción exacta** —el servidor `hell.web` más `HellBot._push_web_snapshot`— contra un evento en memoria con concursantes falsos. Es la forma de comprobar el dashboard en un navegador sin tocar Discord.

## Variables relacionadas

| Variable | Por defecto | Qué hace |
| --- | --- | --- |
| `WEB_PORT` | `8080` | Puerto del dashboard. `0` lo desactiva. |
| `WEB_PUBLIC_URL` | — | Origen HTTPS público del bot, usado para publicar el puntero `live-server.json` |
| `GITHUB_PAGES_SYNC` | — | Permite al bot alcanzar GitHub para publicar el puntero |

> [!WARNING]
> Si el puerto 8080 ya está en uso, el log dice `Web dashboard NOT started: port 8080 is already in use`. Como el dashboard enlaza `WEB_PORT` dentro del contenedor y docker-compose publica *el mismo* valor, se cambia en un solo sitio: `WEB_PORT=8090` en `.env` y otra vez `docker compose up -d`.

## Flujo de log en vivo por MD

Aparte del dashboard, todo lo que el bot registra se refleja en los MD del operador en tiempo real, agrupado en bloques de código:

```text
23:57:12 • [monitor]    ➕ Alice joined the VC (3 valid human(s) inside)
23:57:14 • [monitor]    ➖ Bob left the VC (2 valid human(s) inside)
23:57:20 • [monitor]    Kicked @clanker Clank3r (555) from the VC
23:57:31 • [alivecheck] Alive check a1b2c3 started for 4 user(s); deadline in 300s
23:58:02 ⚠️ [engine]     VC is EMPTY — grace period of 15s started
23:58:17 ⚠️ [engine]     Event FAILED — VC empty since …, grace expired at …
23:58:19 ❌ [bot]        Unhandled exception in on_message
                        Traceback (most recent call last): …
```

- El destinatario es `LOG_DM_USER_ID` (por defecto **984083829767675965**, Jaime Gaming).
- **Una sola tubería**: los mismos registros van a `logs/hellbot.log`, a la pestaña Log del lanzador y al MD, así que nada puede ser visible en un sitio y faltar en otro.
- **Seguro ante límites de tasa**: las líneas se almacenan en búfer y se vacían cada `LOG_DM_FLUSH_SECONDS` (3 s), con tres mensajes como máximo por vaciado; las inundaciones se resumen como `… N line(s) dropped` en vez de saturar.
- **Campana de alarma**: cuando algo va seriamente mal —una línea en `LOG_DM_PING_LEVEL` (`ERROR` por defecto) o peor, o cualquier límite de tasa de Discord— el operador recibe un MD que **le hace ping**, con las líneas ofensivas en un bloque de código. Los pings se limitan a uno cada `LOG_DM_PING_COOLDOWN_SECONDS` (5 minutos por defecto), así que una tormenta de errores zumba una vez, no una por línea. El flujo agrupado normal sigue sin menciones.
- **Autoprotegido**: se excluyen los registros del propio flujo y se suprimen los registros HTTP y de gateway de discord.py mientras el flujo está publicando (sin bucles de retroalimentación). Los avisos de límite de tasa del funcionamiento normal **sí** llegan al flujo y disparan el ping. Si los MD del operador están cerrados, el flujo se desactiva solo y lo dice en el log de archivo.
- Se engancha **antes** de que el gateway se conecte, así que los problemas de arranque (token malo, intent que falta, preflight fallido) se entregan en cuanto el canal de MD se abre.
- `/hell logs` lo conmuta en vivo, cambia la severidad o envía una línea de prueba.

## Mensaje de progreso en el canal

Un solo embed, creado una vez y **editado** cada `PROGRESS_INTERVAL` segundos (20 por defecto). Su identificador se persiste, así que se sigue editando tras un reinicio; si alguien lo borra, se recrea.

Muestra estado, `73h 24m / 160h 00m`, porcentaje, una barra `█████████░░░░░░░░░░░`, población en vivo, hito actual, próximo hito con cuenta atrás en vivo y tiempo restante. Los renders idénticos se omiten y, una vez termina el evento, el estado final se escribe una vez y el bucle deja de editar.

## Fichas de estadísticas al terminar

Cuando la partida termina —completada, fallida o cancelada— cada concursante recibe su propia ficha por MD:

```text
WELCOME TO HELL

128:42:15 SURVIVED

YOU WERE... TOP 3
out of 41 contestant(s)

YOU WON 2 REWARDS
• 32h — @hell (limited)
• 64h — Limited-time Verity in Find the Verities
```

El Top 3 final de una partida completada recibe los cinco hitos más `@cool people :D` listados.

La entrega es **reanudable**: cada intento se escribe en `dm_log`, así que un reinicio nunca manda mensajes duplicados. Va a un ritmo de un MD por segundo y los usuarios con MD cerrados se informan en el resumen del canal; pueden ejecutar `/hell mystats` para ver la misma ficha.
