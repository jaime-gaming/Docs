---
description: "Qué hay dentro del archivo único de VOID: las cuatro capas, los catorce audios, las cámaras hechas con canvas, el estado de sesión y el traductor automático."
updated: "2026-10-20"
---

# Las tripas del archivo

El juego entero es un archivo. No es una forma de hablar: `VOID mxks version
(code).html` pesa **1.091.298 bytes**, tiene **20.077 líneas** y **995.640
caracteres**, y dentro van el marcado, los cuatro bloques de estilo y los dos
bloques de script. Esta página cuenta qué hay ahí dentro, leído del propio
archivo y no del README.

Sirve para dos cosas: para saber qué se está ejecutando cuando se juega, y para
no perderse al abrirlo en un editor, que es lo primero que hace cualquiera que
quiere contribuir.

## Las cuatro capas de un solo archivo

No hay build, no hay dependencias y no hay ni un solo `<link>`: el archivo no
pide nada al exterior para funcionar. Lo que hay es esto:

| Medida | Cantidad |
| --- | --- |
| Tamaño y líneas | 1.091.298 bytes · 20.077 líneas · 995.640 caracteres |
| Bloques | 2 `<script>` · 4 `<style>` · 0 `<link>` |
| Código | 303 declaraciones `function` (302 distintas) · 1.367 `const` o `let` |
| Tiempo | 233 `setTimeout` · 19 `setInterval` · 13 `requestAnimationFrame` |
| Comentarios | 715 de línea (`//`) · 27 de bloque (`/* */`) |
| Red | 4 `fetch` · 0 `XMLHttpRequest` |

Las cuatro capas son las de cualquier página —marcado, estilo, script y
recursos—, solo que las tres primeras comparten archivo y la cuarta casi no
existe: hay dos `<img>` y un único vídeo externo, el de la carpeta
`assets [DO NOT TOUCH]`.

Los cuatro `fetch` son todos del traductor automático, que se describe más abajo.
**Ninguna otra parte del juego llama a ningún servidor**: no hay analítica, no hay telemetría y no hay peticiones a
dominios del relato, que aparecen en los documentos internos pero no en el
código.

## Catorce audios y siete vídeos

La capa de medios está declarada entera en el marcado, con su `id` y su volumen
fijado de antemano. Nueve pistas de música, cada una para un contexto:

| Pista | Volumen | Bucle |
| --- | --- | --- |
| `ambientMusic` | 0.3 | sí |
| `officeMusic` | 0.25 | sí |
| `loginMusic` | 0.25 | sí |
| `desktopMusic` | 0.2 | sí |
| `glitchMusic` | 0.25 | no |
| `mailMusic` | 0.2 | no |
| `callMusic` | 0.2 | no |
| `windowOpenMusic` | 0.15 | no |
| `windowCloseMusic` | 0.15 | no |

Y cinco efectos sin volumen declarado, que heredan el del elemento: `sfxClick`,
`sfxHover`, `sfxDoor`, `sfxAlarm` y `sfxGlitch`. Ninguno lleva `src` en el
marcado: la fuente se asigna en tiempo de ejecución, igual que el vídeo de la
intro, que declara `data-asset-name="VOIDMXKSnight_shift.mp4"` y se resuelve
más abajo.

Los siete `<video>` son la intro y **seis cámaras de vigilancia**, `cam1` a
`cam6`, todas con `autoplay loop muted playsinline`. Van silenciadas de salida
porque el sonido de las cámaras no es una pista: es otra cosa.

## Las cámaras son canvas, no vídeo

Aquí está el truco mejor escondido del archivo. Las cámaras no reproducen vídeo
grabado: **se dibujan**. Hay siete llamadas a `createElement('canvas')` con sus
siete `getContext`, y los comentarios del propio código lo dicen:

- Dos lienzos de **320×240** para las feeds de CCTV, con el comentario «Crear
  canvas en lugar de video real (sin necesidad de internet)».
- Dos lienzos fuera de pantalla de **640×480** para generar una feed temporal con
  `MediaStream`, y una variante para la **cámara 4 con interferencia extrema**.
- Dos superposiciones de 320×240 que se colocan encima de un `<video>` ya
  existente, solo si no hay una previa, y que se animan con `animateCCTV`.
- Una captura del vídeo a pantalla completa, que toma las medidas reales del
  elemento (`video.videoWidth`) en vez de unas fijas.

Las rejillas, el ruido y las siluetas que se ven al jugar están trazados ahí,
línea a línea, en cada fotograma. Es la razón de que la identidad visual del
juego —la simulación CRT de alto contraste— no dependa de ningún archivo de
imagen: se genera mientras se mira.

## Ocho rutas para encontrar el mp4

El único recurso externo es el vídeo de la intro, y el archivo no da por hecho
dónde está. Construye una lista de candidatas y las prueba en orden:

```text
VOIDMXKSnight_shift.mp4
./VOIDMXKSnight_shift.mp4
./assets [DO NOT TOUCH]/VOIDMXKSnight_shift.mp4
assets [DO NOT TOUCH]/VOIDMXKSnight_shift.mp4
../assets [DO NOT TOUCH]/VOIDMXKSnight_shift.mp4
../assets/VOIDMXKSnight_shift.mp4
../../assets/VOIDMXKSnight_shift.mp4
../../../assets/VOIDMXKSnight_shift.mp4
```

Cada una se resuelve con `new URL(ruta, window.location.href)` dentro de un
`try/catch`, y cuando una responde el elemento queda marcado con
`data-asset-resolved="1"` para no volver a intentarlo. El nombre sale de
`data-asset-name`, así que se puede sustituir el vídeo sin tocar el código.

Esto matiza lo de que no se pueda mover nada: el HTML aguanta que la carpeta
esté al lado, un nivel por encima o hasta tres niveles por encima, y aguanta que
se llame `assets`. Lo que no aguanta es que el vídeo cambie de nombre, porque
las ocho candidatas terminan en `VOIDMXKSnight_shift.mp4`.

## El estado vive en la sesión

No hay partida guardada. El archivo usa `sessionStorage` para cinco cosas y
`localStorage` para una sola, y la diferencia es deliberada:

| Clave | Dónde | Para qué |
| --- | --- | --- |
| `disclaimerShown` | sesión | Que el aviso de salud salga una vez por sesión |
| `interview_completed_this_session` | sesión | Marcar que la entrevista ya se completó |
| `void_external_flags` | sesión | Banderas de estado del relato |
| `void_ngplus_level` | sesión | El nivel de Nueva Partida+ |
| `void_show_amnesia_now` | sesión | Disparar el mensaje de amnesia una sola vez |
| `voidTranslations` | **localStorage** | La caché de traducciones |

`checkForNewGamePlus()` lo comenta sin rodeos: «localStorage deshabilitado - no
hay persistencia entre sesiones / Pero sessionStorage permite recordar dentro de
la misma sesión». Al detectar un nivel guardado lo incrementa, marca
`isNewGamePlus` y lo registra en consola como `[NG+]`.

El mensaje de amnesia depende de dos condiciones a la vez: estar en Nueva
Partida+ y que `void_show_amnesia_now` valga `'true'`, que es lo que deja escrito
el tramo que acaba de completar la entrevista. Se lee, **se borra** y se muestra
a los 500 ms, así que no puede salir dos veces.

> [!NOTE]
> La consecuencia práctica es que cerrar la pestaña reinicia el progreso y el
> nivel de Nueva Partida+. No es un fallo que haya que arreglar: es cómo está
> escrito, con la persistencia desactivada a propósito. Lo único que sobrevive a
> la pestaña es la caché de traducciones.

## El traductor automático

El juego está escrito en español y **se traduce solo al inglés mientras se
juega**. El bloque se llama `AutoTranslator` y su cabecera lo resume: traduce el
contenido en español usando Google Translate como principal y otras APIs como
respaldo, con las traducciones en caché para no repetir el trabajo.

| Orden | API | Dirección | Tope por petición |
| --- | --- | --- | --- |
| 1 | `GoogleTranslate` | `translate.googleapis.com/translate_a/single` | 5.000 caracteres |
| 2 | `MyMemory` | `api.mymemory.translated.net/get` | 500 caracteres |
| 3 | `LibreTranslate` | `translate.argosopentech.com/translate` | 3.000 caracteres |

El texto se parte en trozos de hasta **4.500 caracteres** (`maxChunkSize`) y
entre petición y petición se esperan **200 ms** para no chocar con los límites de
tasa. Cada API declara su propio método: las dos primeras hacen `GET` con
parámetros y la tercera `POST` con `{ q, source: 'es', … }`, que es donde queda
escrito que el idioma de origen es el español.

Cuando una falla entra en `failedAPIs`, un `Set` que la descarta para el resto de
la sesión, y se pasa a la siguiente. Mientras tanto se informa del avance con
`lastStage`, `lastCurrent`, `lastTotal`, `lastPercentage` y `lastItem`, y hay un
indicador de esquina (`cornerProgressEnabled`) con su propio temporizador de
desaparecido.

> [!TIP]
> Antes de llamar a ninguna API se intenta un cuarto `fetch`, a
> `void-translations-en.json` junto al HTML y con `cache: 'no-store'`. Ese
> archivo **no está en el repositorio**, y no hace falta: es la vía para
> sustituir la traducción automática por una hecha a mano. Si existe y se puede
> leer, se usa entero; si no, se lanza `'JSON file not found'` y el traductor
> sigue su camino.

> [!WARNING]
> Con la traducción automática activa, fragmentos del texto del juego salen del
> navegador hacia tres servicios de terceros. Es el único tráfico externo de todo
> el archivo, pero conviene saberlo: no es un juego sin conexión cuando se juega
> en inglés, y la caché en `localStorage` hace que la segunda vez ya no salga
> nada.

## Lo que explica de los avisos

Varias cosas que están en [Avisos y preguntas](/void/faq/) dejan de ser
misteriosas vistas desde aquí. Que la versión en inglés no esté terminada es
coherente con que sea una traducción automática en tiempo de ejecución, con sus
tres APIs y sus límites por petición. Que el aviso de salud salga cada vez que se
abre el juego en una pestaña nueva es `disclaimerShown` en `sessionStorage`. Y
que la simulación CRT pueda causar visión fantasma no depende de un recurso que
se pueda quitar: se dibuja en cada fotograma.

Para jugarlo tal como viene, el camino está en
[Instalación y juego](/void/install/); para el relato que hay encima de todo
esto, en [El mundo de VOID Corp](/void/world/).

## Contribuir a partir de aquí

El archivo que hay que abrir es
[`VOID mxks version (code).html`](https://github.com/jaime-gaming/VOID/blob/main/VOID%20mxks%20version/VOID%20mxks%20version%20%28code%29.html),
y se edita con un editor que aguante un millón de caracteres en un solo archivo.
Dos consejos que salen de leerlo:

- Los 715 comentarios de línea están en los dos idiomas y explican intención, no
  sintaxis: «Cámara 4 con interferencia extrema» dice más que el código que
  viene detrás. Buscar por ellos es la forma más rápida de orientarse.
- Casi todo el tiempo del juego son los 233 `setTimeout`. Al tocar uno conviene
  buscar su pareja de cancelación, porque en un archivo sin módulos un retardo
  huérfano sigue disparándose después de cambiar de escena.
