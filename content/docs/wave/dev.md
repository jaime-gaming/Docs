---
title: "Desarrollo"
icon: "code"
order: 70
blurb: "requisitos, comandos, pruebas de navegador y los diez fallos típicos."
description: "Cómo se desarrolla Wave: requisitos, comandos, pruebas de navegador, depuración, los diez fallos típicos y las cinco listas de comprobación de QA."
updated: "2026-10-19"
---

El repositorio trae su propia guía de desarrollo, [`docs/DEVELOPMENT.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/DEVELOPMENT.md), con 31 KB y 302 líneas. Esta página la recoge ordenada: lo que hace falta para tocar el código web y, sobre todo, los casos que la guía deja escritos porque alguien ya se tropezó con ellos.

> [!NOTE]
> Todo esto es del **cliente web**. Las implementaciones nativas de Android (Kotlin/Compose) y Windows (C#/WPF) son proyectos independientes con sus propias herramientas; la matriz de builds y estado está en [Plataformas](/wave/platforms/).

## Requisitos

| Herramienta | Qué se pide |
| --- | --- |
| Node.js | 22.12+ dentro de Node 22, o Node 24 |
| npm | El que viene con Node.js |
| Git | Una versión reciente con soporte |
| Navegador | Chromium, Firefox o Safari modernos |
| Editor | Cualquiera con soporte de TypeScript |

**No hacen falta** JDK, Gradle, Android Studio ni un SDK de Android para el cliente web. Sí para el proyecto Android independiente.

## Puesta en marcha

```bash
git clone https://github.com/jaime-gaming/Wave.git
cd Wave
npm ci
npm run dev
```

Vite imprime la URL de desarrollo, normalmente `http://localhost:5173`. Dos detalles de configuración que no son accidentales:

- El servidor se ata a **`0.0.0.0`**, no a `127.0.0.1`, para que también sirva dentro de un entorno de desarrollo proxy.
- La lista de hosts permitidos acepta los hosts de previsualización **`.e2b.app`**. Otros hosts de confianza se añaden explícitamente; la guía es tajante en que **no se desactiva la validación de host globalmente**.

No hace falta `.env`, clave de API, cuenta ni backend aparte. Los recursos que ve el navegador usan URLs del mismo origen y las letras opcionales usan la API HTTPS pública de LRCLIB. **No se escribe a mano el `localhost` de otro servicio dentro del código cliente.**

## Los comandos

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprobación estricta de tipos y bundle de producción |
| `npm run preview` | Previsualización local del bundle de producción |
| `npm run lint` | Comprobaciones de ESLint |
| `npm run format` | Formatea código y documentación con Prettier |
| `npm run format:check` | Comprueba el formato sin tocar ficheros |
| `npm test` | Pruebas unitarias y de componentes, una pasada |
| `npm run test:watch` | Lo mismo, en modo vigilancia |
| `npm run test:e2e` | Pruebas de navegador con Playwright |

La salida del build va a `dist/` y Git la ignora. **No se commitean** `node_modules/`, binarios de navegador, informes de pruebas, colecciones de audio ni artefactos generados. `package-lock.json` **sí** está commiteado, para que la instalación de dependencias sea reproducible.

## Pruebas de navegador

Antes de la primera pasada con Playwright hay que instalar Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

En Linux puede hacer falta además `npx playwright install --with-deps chromium`. La configuración de Playwright **arranca un servidor Vite local automáticamente**, salvo que ya haya uno disponible. En entornos restringidos, `CHROMIUM_EXECUTABLE_PATH` puede apuntar a un binario de Chromium compatible ya instalado.

Las pruebas de navegador **generan ficheros WAV pequeños en memoria**: no descargan ni commitean música con derechos.

```bash
npx playwright show-report
```

> [!WARNING]
> Un fallo por navegador ausente no es una prueba superada. Si Playwright no encuentra Chromium, se instala o se apunta `CHROMIUM_EXECUTABLE_PATH`; no se da el resultado por bueno.

## Desarrollar con música local

El recorrido que la guía propone para comprobar que nada se ha roto:

1. Elige **Add your music**, o arrastra ficheros sobre la aplicación.
2. Espera la notificación de importación.
3. Selecciona una pista para reproducirla.
4. Busca por título, artista o álbum; prueba las pestañas de agrupación y los favoritos.
5. Recarga y confirma que la biblioteca sigue ahí.
6. Crea una lista, añade dos canciones, usa las opciones de canción para subir una y recarga para verificar el orden guardado.
7. Activa **Settings → Library editing**, edita metadatos, elige una portada local JPEG/PNG/WebP y guarda. Recarga y después restaura la información original.
8. Desactiva la edición y verifica que los valores guardados permanecen pero los controles desaparecen.
9. Desactiva las animaciones y prueba por separado la preferencia de movimiento reducido del sistema.
10. Quita una pista y verifica que las referencias en las listas desaparecen mientras el fichero original queda intacto. Borra una lista y verifica que la música de la biblioteca permanece.

### Casos manuales que merecen la pena

La guía enumera los que de verdad han dado problemas:

- Ficheros con etiquetas y sin ellas, nombres en Unicode y carátulas ausentes.
- Importaciones duplicadas y copias renombradas.
- Medios corruptos y ficheros con códecs no soportados.
- Ficheros vacíos, ficheros que no son audio y ficheros de más de 200 MB.
- Almacenamiento del navegador desactivado o lleno.
- Quitar la entrada actual, la primera, la última y la única de la cola.
- Reproductor a pantalla completa en **320/390/768/1024/1440 px**, incluidas paletas de carátula opacas claras y oscuras, ajuste sin desplazamiento en pantallas bajas, foco de la cola y vuelta al botón de Home o de la barra que inició todo.
- Contadores y acciones de Home, dimensiones de la portada en las tarjetas, y propiedad de álbumes por artista **con álbumes homónimos de artistas distintos**.
- Importación y reproducción de WAV nativo de 24 bits, etiquetas de detalle de la fuente y preservación del Blob byte a byte.
- Persistencia del volumen, silenciar/recarga/quitar silencio, y restaurar el orden elegido después del aleatorio.
- Repetición desactivada en la última pista, repetir una, repetir todas y aleatorio.
- Navegación solo con teclado y ventanas estrechas.
- Recargar tras cambiar favoritos; cambiar de origen o de perfil de navegador.
- Tema oscuro, claro, del sistema, movimiento reducido y el interruptor de animaciones.
- Migración de la base de datos desde la versión 1 con audio y favoritos existentes.
- Creación de listas desde las opciones de canción, pertenencia duplicada, reordenación y borrado de música referenciada.
- Carátulas inválidas o demasiado grandes, cancelar ediciones, varias ediciones y restauración del original.
- Cambios de favorito y de metadatos **mientras suena**: el tiempo transcurrido no debe reiniciarse.

> [!IMPORTANT]
> La biblioteca de desarrollo pertenece al origen de desarrollo. Alternar entre `localhost` y una URL de previsualización **no comparte la misma colección**: son dos orígenes y, por tanto, dos IndexedDB distintos.

## Depuración

Con las herramientas del navegador:

| Panel | Qué se mira |
| --- | --- |
| **Consola** | Fallos en runtime y qué APIs del navegador están disponibles |
| **Application / Storage** | El IndexedDB `wave-library` con los almacenes `tracks`, `playlists`, `artists` y `albumOrders` (**esquema v3**), y en `localStorage` las claves `wave-theme`, `wave-editor-enabled`, `wave-animations-enabled`, `wave-volume`, `wave-last-audible-volume`, `wave-crossfade`, `wave-mix-enabled`, `wave-auto-lyrics` y `wave-playback-session-v1` |
| **Red** | Confirmar que importar y reproducir música **no sube ficheros** |
| **Rendimiento** | Capacidad de respuesta al importar y transiciones de audio |
| **Accesibilidad** | Nombres de los controles, orden de foco y contraste |

> [!CAUTION]
> No se registra en producción el contenido de audio ni nombres de fichero locales sensibles. Inspeccionar consola y almacenamiento puede exponer metadatos de tu colección personal: **redáctalo antes de compartir un informe de error**.

## Solución de problemas

Los diez que la guía documenta por nombre.

### Las dependencias no se instalan

Comprueba la versión de Node.js y el acceso al registro de paquetes. Usa `npm ci` con el lockfile commiteado. **No borres ni regeneres el lockfile solo para tapar un error de instalación.**

### La biblioteca no abre o las importaciones se paran

IndexedDB puede estar desactivado, restringido en modo privado o sin espacio. Activa el almacenamiento del sitio o libera espacio. Los ficheros commiteados antes de una importación fallida siguen guardados. **Borrar los datos del sitio de Wave reinicia la colección, los favoritos, las listas y las ediciones locales**: conserva antes los ficheros originales.

### Faltan los controles de edición

Activa **Settings → Library editing**. Nombrar listas y añadir miembros funciona sin ello; la edición de canciones y las carátulas o descripciones propias de lista están detrás de ese ajuste. Desactivarlo **conserva los valores guardados**: no restaura los originales automáticamente.

### Una imagen propia se rechaza

Elige un JPEG, PNG o WebP legible de **5 MB o menos y 40 millones de píxeles decodificados como máximo**. SVG y URLs remotas no se admiten. El selector muestra un error recuperable y conserva la portada existente. Las imágenes aceptadas se recortan y redimensionan a cuadrado **en el navegador**: los ficheros originales de imagen y de audio nunca se reescriben.

### Las animaciones no van

El interruptor de animaciones viene activado por defecto, pero **la preferencia de movimiento reducido del sistema tiene prioridad**. Prueba las dos preferencias. Y no: no se esquiva el movimiento reducido para que una captura o una prueba pase.

### Una pista se importa pero no suena

Reconocer la extensión y parsear los metadatos **no implica que el códec esté soportado**. Prueba con un WAV o MP3 conocido y bueno y comprueba los formatos que admite el navegador. El audio no soportado o dañado produce un mensaje, en vez de tratarse en silencio como reproducible.

### Calidad de audio y detalle de la fuente

Wave reproduce el Blob almacenado original con la decodificación nativa del navegador: **no añade transcodificación, ecualización ni normalización**. El fundido cruzado opcional usa dos elementos nativos con rampas de volumen de potencia igualada, y viene desactivado por defecto. Las importaciones nuevas conservan los metadatos de códec, frecuencia de muestreo y profundidad de bits cuando se informan; los registros antiguos pueden mostrar solo el formato del nombre de fichero. El volumen por defecto es el 100 %, y se persisten tanto el nivel elegido como el anterior a silenciar. El enrutado al dispositivo, el remuestreo del navegador o del sistema, el hardware, la calidad de la grabación y el soporte de códec siguen determinando la salida. **No se afirma audio bit-perfect ni restauración de información ya perdida en un fichero con pérdida.**

### La reproducción no arranca sola

Los navegadores restringen la reproducción automática. La reproducción se inicia con una interacción del usuario. Una promesa de reproducción rechazada pausa la interfaz y pide otro intento.

### Una previsualización rechaza su host

Mantén el servidor atado a `0.0.0.0` e incluye el dominio del proxy de confianza en la lista permitida de Vite. Si más adelante se añade un backend, **se proxea por el mismo origen** en lugar de pedir al navegador un `localhost` propio.

### Las pruebas no encuentran navegador

Instala Chromium de Playwright o ajusta `CHROMIUM_EXECUTABLE_PATH`.

## Despliegue en producción

```bash
npm ci
npm run lint
npm test
npm run build
```

Se sirve `dist/` desde un host estático con HTTPS. No hacen falta endpoints de backend ni secretos. Pon cabeceras de caché apropiadas para los assets con hash y **evita cachear `index.html` indefinidamente**. `vite preview` es para verificación local, no un servidor de producción.

> [!WARNING]
> Todavía **no hay service worker ni manifiesto PWA**. Una vez cargada, las pistas importadas suenan en local, pero un arranque en frío completamente offline no está garantizado.

## Regresiones de persistencia y movimiento

Son las reglas que la guía marca porque romperlas no se ve a simple vista:

- Las migraciones van condicionadas a `oldVersion`, y se prueban con bases de datos de la versión 1 y de la 2 **antes** de cambiar el esquema. **Nunca se recrea `tracks` solo para añadir un almacén nuevo.**
- Borrar una pista de la biblioteca y podar las listas va **en una sola transacción**.
- Las escrituras de favoritos y de metadatos deben leer el registro más reciente: no se sustituye un registro con props obsoletas de un componente.
- Al fusionar metadatos se preserva el Blob en memoria, para que el efecto de audio no recargue su fuente.
- Se usa `src/ui/motion.ts` en vez de inventar duraciones de animación en cada componente.
- Las salidas animadas retienen el DOM temporalmente: las aserciones de texto y etiquetas se acotan a la superficie activa, o se espera a la eliminación real. Los controles que salen deben quedar inertes.
- La restauración de foco del modal nativo ocurre **después** de `dialog.close()`. El abridor del reproductor compacto se suministra explícitamente porque expandir el reproductor deja inerte su pie. Las pruebas de navegador ejercitan ese camino de foco.
- En las pruebas de persistencia se espera al estado visible commiteado antes de recargar: un clic inicia una escritura asíncrona en la base de datos y recargar de inmediato puede interrumpirla.
- Los fixtures de navegador y las imágenes generadas van en salida de pruebas ignorada, **nunca en la biblioteca de producción**.

## Mantenimiento de dependencias y documentación

`npm outdated` y `npm audit`, revisar los cambios y correr la suite completa de comprobaciones después de actualizar. No se aplican a ciegas actualizaciones que rompan.

La documentación se mantiene **en inglés** y se actualizan las firmas de la API, el comportamiento, las limitaciones y el estado de la hoja de ruta conforme cambia la implementación. Las expectativas de revisión y licencia están en [`CONTRIBUTING.md`](https://github.com/jaime-gaming/Wave/blob/main/CONTRIBUTING.md).

## Las cinco listas de comprobación de QA

La guía cierra con cinco baterías de comprobación. No son teoría: son lo que se ejecuta antes de dar por buena una versión.

### Letras, fundido cruzado y reordenación

Cubrir marcas de tiempo límite de LRC, fracciones, desplazamientos y marcas repetidas; etiquetas de milisegundos incrustadas frente a marcas de trama MPEG; letras presentes, ausentes o sin sincronizar; recarga, salto y pausa y progresión nativa. Los imports sobredimensionados o inválidos se rechazan **sin sustituir las letras guardadas**. El guardado y borrado manual de fotos se valida en la galería, en Home y en el perfil, y la carátula del álbum de la canción debe permanecer independiente.

Las pruebas de navegador del fundido cruzado instrumentan **constructores nativos reales de `Audio`**: dos elementos simultáneamente sin pausar, ganancias complementarias no nulas, la identidad entrante antes de que termine la saliente, y la pausa deteniendo ambos. Las pruebas del motor cubren además rechazo y cancelación, aislamiento de eventos salientes, silencio, limpieza de la URL de la fuente y cambios de cola protegidos. Repetir una, repetición con una sola entrada, salto manual, seek, borrado y restricciones en segundo plano o móvil se prueban por separado: **una promesa de `play` simulada no es prueba de solapamiento real**.

La reordenación de álbumes y listas completos se hace con asas de puntero, botones y teclado, validando persistencia independiente tras recarga, navegación filtrada, conservación de la cola actual, ajuste a 320 px y cambios concurrentes en la colección. **Los órdenes de álbum nunca deben incluir el álbum homónimo de otro artista.**

### Letras automáticas y almacenamiento inmediato

Playwright **intercepta LRCLIB con respuestas de contrato realistas**, así que la suite no depende de que el proveedor esté disponible. Se verifican coincidencias sincronizadas y planas, título/artista/duración erróneos, respaldo de álbum ante 404, instrumentación frente a errores, límites de tamaño de respuesta, tiempos de espera y abortos, TTL de caché, precedencia de letras locales o incrustadas, metadatos obsoletos y rechazo de pistas borradas. La desconexión de la función se prueba a través de recargas, reintentos deliberados, atribución del proveedor, desplazamientos rápidos y letras guardadas sin otra petición.

> [!NOTE]
> Aun así sigue haciendo falta una prueba de humo en un navegador de producción contra LRCLIB real, para validar la disponibilidad actual de CORS y del servicio: **un fixture no es prueba de cobertura del proveedor**.

En almacenamiento inmediato: importar un fichero etiquetado sin reproducirlo, recargar y comparar los hashes del Blob guardado con el original. Importar una copia de bytes renombrada y con otra fecha y comprobar que hay **un solo registro** de pista y de audio. Mantener estables los identificadores heredados y las listas al registrar perezosamente un hash de contenido. Comprobar el fallo de escritura en almacenamiento sin corromper importaciones anteriores correctas, los casos de permiso concedido, denegado y no soportado, el audio en calidad original, la salida de portada compacta y los registros de letras sin procesar. El uso de almacenamiento que informa el navegador puede diferir de las estimaciones de la biblioteca.

El QA del fundido cruzado comprueba además solapamiento de portada solo por opacidad y ausencia de medidores o carteles de transición, ganancias de potencia igualada en el cuarto de recorrido, limpieza al completarse o cancelarse, la suma de las ganancias al cuadrado, el silencio y el comportamiento con movimiento reducido del sistema. Los movimientos nuevos de tarjeta, letra y navegación deben respetar **las dos** preferencias de movimiento.

### Relleno de texto y maquetación compacta

Probar inicio, punto medio y final del relleno de línea, desplazamientos positivos y negativos, duración nativa final, duración desconocida, texto plano, preservación de Unicode y espacios, texto ajustado, reinicio al hacer seek y estabilidad en pausa. Se comprueban **los degradados recortados por glifo de verdad** y se afirma que no hay barra de progreso de letra. El LRC mejorado usa las marcas de palabra suministradas; el LRC ordinario sigue el tiempo de línea, **no fabrica tiempos de palabra**. Con movimiento reducido se mantiene su respuesta temporal y se desactiva el movimiento espacial o decorativo.

> [!IMPORTANT]
> Las pruebas de teclado tras cerrar un editor deben esperar a que el elemento `dialog` nativo **se desenganche de verdad**, no solo a que desaparezca su rol de accesibilidad: un diálogo inerte que está saliendo sigue sosteniendo la capa modal nativa y puede impedir que el foco llegue al reproductor a pantalla completa.

Se validan la geometría del reproductor plegado a 64 px, la apertura explícita a pantalla completa y la devolución del foco, los controles de colección y de mezcla diaria de Home sin duplicar la sesión, la navegación lateral en escritorio, los temas claro y oscuro y **la ausencia de desbordamiento del documento en 320/390/768/1024/1440 px**, manteniendo intactas la música guardada y la semántica existente de cola y reproducción.

### Actualización en tres plataformas

Home es la página web inicial y **Settings ya es una página completa, no un diálogo**. Letras se abre en una sección plegable cada vez que Now Playing se expande o cambia la canción. Se elimina el texto redundante de estado de fuente y de reproducción. La marca W curva original sustituye a las barras de forma de onda genéricas. Las letras automáticas en línea son opcionales y vienen desactivadas, mientras que la búsqueda manual de una canción sigue disponible. Las peticiones exactas y de búsqueda validan artista, título y duración, identifican al cliente y respetan los tiempos de espera del proveedor: **su disponibilidad no se puede garantizar**. El fundido cruzado usa el tiempo del medio entrante y ganancias de potencia igualada, no el tiempo de pared transcurrido. La limpieza de duplicados fusiona solo registros confirmados como idénticos byte a byte y preserva las referencias; los grupos con el mismo nombre se revisan de forma no destructiva.

Existen implementaciones nativas separadas para Android (Kotlin/Compose) y Windows (C#/WPF); las afirmaciones anteriores de alcance solo web aplican a la arquitectura web, no al proyecto entero. La compilación nativa alojada ya pasa, y Windows ejecuta además comprobaciones de contrato y de humo de maquetación WPF. La reproducción en dispositivo físico y la paridad web completa siguen siendo puertas separadas.

### Escenario de escucha y restauración

Comprobar los límites de la ventana **y la visibilidad y las zonas de pulsación reales de la letra**, no solo el desbordamiento oculto, en 1440×900, 1024×768, 768×700, 390×844, 320×568 y 844×390. Cubrir LRC mejorado, letras planas o ausentes y metadatos o líneas largos. Validar inicio, mitad y fin de palabra, marcas repetidas, desplazamientos, tiempos de palabra mal formados, líneas de tiempo del proveedor que exceden la duración de la grabación y reconciliación de la caché de duración decodificada.

Restaurar una posición nativa distinta de cero tras recargar y con hidratación retardada de IndexedDB, manteniendo intactos cola, orden, aleatorio y repetición y sin reproducción automática. Probar referencias borradas, eliminación de la pista seleccionada, `localStorage` inválido o bloqueado y guardados del ciclo de vida.

## Dónde seguir

- [Arquitectura](/wave/architecture/) — las capas y el flujo de datos que estas reglas protegen.
- [Privacidad y datos](/wave/privacy/) — qué se guarda y qué no sale del dispositivo.
- [Plataformas](/wave/platforms/) — el estado de las tres implementaciones.
