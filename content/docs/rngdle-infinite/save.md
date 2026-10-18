---
description: "Dónde se guarda la partida, cómo enlazar otro dispositivo, qué transporte usa el enlace y qué precauciones tiene."
updated: "2026-10-18"
---

## Dónde vive la partida

**Tu partida se guarda en tu navegador**, en `localStorage`. No hay cuenta, ni servidor con tu progreso, ni inicio de sesión: el juego no tiene backend.

Todo el estado (EP, insignias, compañeros, skills, rebirths, prestiges e historial) se serializa en un único blob bajo la clave `PROGRESS_KEY`, gestionado por `src/progress.js`. Ese mismo módulo se ocupa del **formato de guardado y de las migraciones**: cuando una versión nueva añade campos, la partida antigua se actualiza al abrirla en vez de descartarse.

Las consecuencias directas de vivir en el navegador:

| Situación | Qué pasa |
| --- | --- |
| Cambias de navegador | La partida no te sigue: es otro almacenamiento |
| Usas navegación privada | Al cerrar, la partida desaparece |
| Limpias los datos del sitio | Se borra la partida |
| Usas otro dispositivo | Hace falta enlazarlo explícitamente |
| Otra URL del mismo juego | Es otro origen, así que es otra partida |
| Actualizas el juego | La migración conserva lo que tenías |

> [!NOTE]
> Que no haya cuenta tiene una ventaja real: nadie puede leer tu progreso desde un servidor, porque no existe ese servidor. El coste es que **tampoco hay copia en la nube que recuperar** si borras los datos del navegador.

## Enlazar otro dispositivo

Para jugar en otro dispositivo:

1. Abre **Ajustes → Enlace de dispositivo** en el dispositivo que ya tiene la partida.
2. Abre el enlace, o escanea el **código QR**, en el otro dispositivo.

> [!DANGER]
> **Cualquiera que tenga el enlace puede jugar con tu cuenta.** Mantenlo privado: no lo publiques, no lo pegues en un chat público y no lo compartas en una captura donde se vea. A efectos prácticos, el enlace es una contraseña.

## Quién manda cuando hay dos pantallas

El dispositivo que **creó el enlace es el principal** y ocupa la ranura `a`; el que se unió es el secundario y ocupa la `b`.

- El principal **llama** (`dials`); el secundario **escucha**.
- Mientras los dos están conectados, las acciones que se inician en el secundario **se envían al principal para ejecutarse una sola vez**.

Ese reparto es lo que hace que las dos pantallas **nunca se peleen por la misma tirada**: hay un único ejecutor, aunque haya dos interfaces.

```text
secundario (b) ──► acción iniciada aquí
                      │
                      ▼
             principal (a) ──► la ejecuta una vez
                      │
                      ▼
              estado sincronizado ──► ambas pantallas
```

Lo que se deduce del diseño:

- Con el secundario **cerrado** no hay sincronización en curso; al volver a abrirlo se pone al día.
- Las tiradas y las compras se resuelven siempre en el principal, así que no hay conflictos de escritura.
- Si cierras el principal, el enlace deja de ejecutar acciones hasta que vuelva.

## Los dos transportes

El enlace (`src/sync.js`) no usa siempre el mismo camino: elige según dónde esté alojado el juego.

| Alojamiento | Transporte | Por qué |
| --- | --- | --- |
| Desarrollo, o allí donde haya un relay configurado | **Relay** propio | Un almacén solo en memoria o en disco que guarda el último blob de la partida |
| Alojamiento estático (GitHub Pages) | **PeerJS sobre WebRTC** | No hay servidor propio; el broker público **solo hace el handshake** |

> [!IMPORTANT]
> En el transporte WebRTC **la partida nunca pasa por el broker**. El broker presenta a los dos dispositivos y se retira; el blob viaja de dispositivo a dispositivo. Es una decisión de diseño explícita del proyecto y se mantiene así a propósito.

En desarrollo, el propio servidor de Vite sirve el relay en `/__sync/*`, así que no hace falta montar nada aparte para probar el enlace.

### Ritmos y reconexión

El enlace late y se recupera solo:

| Temporizador | Valor | Qué significa |
| --- | --- | --- |
| Heartbeat | 3 s | Cada cuánto se comprueba que el otro sigue ahí |
| Timeout de pong | 12 s | Cuánto se espera la respuesta antes de dar el enlace por caído |
| Backoff de reconexión | 2,5 s → 30 s | Reintentos cada vez más espaciados, con techo |

Además del backoff, **recuperar la red o volver a una pestaña visible reintenta de inmediato**, sin esperar al siguiente ciclo. Es lo que hace que el enlace se reponga solo al volver del modo avión o al cambiar de pestaña.

## Ajustes avanzados

Dos claves de `localStorage` permiten sustituir los extremos del enlace. Son para desarrollo y pruebas; en uso normal no hace falta tocarlas.

| Clave | Para qué sirve |
| --- | --- |
| `rng-infinite-peer-broker` | Sustituir el broker de PeerJS con `{host, port, path, secure}` |
| `rng-infinite-sync-endpoint-v1` | Sustituir la URL del relay (solo desarrollo) |

> [!WARNING]
> Si levantas un servidor `peer` local para las pruebas de WebRTC, usa el **puerto 9000**. El 9123 está bloqueado por Chromium (`ERR_UNSAFE_PORT`) y el enlace fallará sin un mensaje evidente.

## Recomendaciones

1. **Trata el enlace como una contraseña.** Es lo que es a efectos prácticos.
2. **Mantén el dispositivo principal como referencia.** Si algo no cuadra entre pantallas, el principal es el que manda.
3. **Ten cuidado al limpiar datos del navegador**: no hay copia en la nube que recuperar.
4. **Si compartes equipo**, recuerda que la partida queda en el perfil del navegador de esa máquina.
5. **Deja las dos pestañas abiertas** mientras quieras sincronización activa: con una cerrada no hay enlace en curso.
6. **Si el enlace no arranca**, revisa primero la red y la pestaña visible antes que nada más: ambos disparan un reintento inmediato.
