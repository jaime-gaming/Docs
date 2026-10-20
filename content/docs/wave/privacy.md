---
title: "Privacidad y datos"
icon: "shield"
order: 60
blurb: "qué se guarda, dónde y qué sale del dispositivo."
description: "Qué guarda Wave, dónde lo guarda, qué sale del dispositivo y qué puede hacer que se pierda."
updated: "2026-10-18"
---

Wave no tiene backend, cuentas, analítica ni servicios remotos de audio. Esta página detalla exactamente qué se guarda, dónde, y las dos únicas cosas que pueden salir del dispositivo.

## Qué no existe

- **Sin backend.** No hay servidor de Wave al que se envíe nada.
- **Sin cuentas.** Nadie inicia sesión. No hay identificación de usuario.
- **Sin analítica.** No se miden usos ni se registran eventos.
- **Sin servicios remotos de audio.** El audio nunca se sube.
- **Sin telemetría.** No hay informes de errores automáticos.

## Qué se guarda y dónde

Todo vive en el almacenamiento del navegador, asociado a **un perfil de navegador y a un origen concreto**.

| Qué | Cómo se guarda |
| --- | --- |
| Audio | Una sola copia, a calidad original. Sin recomprimir. |
| Carátulas | JPEG compactos. |
| Letras | Texto crudo una sola vez; las líneas analizadas se reconstruyen al cargar. |
| Biblioteca y favoritos | IndexedDB. |
| Listas, preferencias y estado | IndexedDB, con migración de versión. |
| Sobrescrituras de metadatos | Locales. No se escriben en tus archivos. |

Los archivos importados se confirman en el almacenamiento **inmediatamente**, sin necesidad de reproducirlos ni seleccionarlos.

En Windows la disposición es análoga pero nativa: el audio original va a `%LOCALAPPDATA%/Wave/audio` y la biblioteca, las listas, las preferencias y el estado de escucha usan archivos JSON sustituidos de forma atómica. En Android el selector de documentos copia los bytes originales al almacenamiento privado de la aplicación.

> [!WARNING]
> **Conserva tus archivos originales.** Wave es un reproductor, no un sistema de copias de seguridad. Limpiar los datos del sitio, navegar en privado, los límites de cuota o el desalojo automático del almacenamiento pueden eliminar la colección, las listas y las ediciones.

## Las dos cosas que pueden salir del dispositivo

### 1. Búsqueda automática de letras

Usa la API pública de **LRCLIB** y viene **desactivada**. Se activa explícitamente en Ajustes.

- **Se envían** metadatos de la canción (título, artista, duración).
- **El proveedor también ve** información de la conexión, como la dirección IP.
- **El texto descargado se queda en local.**

Los clientes reutilizan resultados ya guardados, coordinan las peticiones y respetan los plazos de reintento del proveedor. La web usa una cola compartida de 500 ms, Web Locks del mismo origen cuando están disponibles, compartición de búsquedas concurrentes y cabeceras en lista blanca. Ninguna de estas medidas elimina los límites del proveedor ni los límites por IP.

Los LRC importados y las letras guardadas funcionan **sin conexión**.

### 2. Carga inicial de la aplicación

Los recursos del navegador usan URLs del mismo origen. Una vez cargada la aplicación, la reproducción local y las letras guardadas **no necesitan acceso a la red**.

> [!NOTE]
> Una PWA instalable y un arranque fiable sin conexión **todavía no están implementados**. Hoy hace falta red para la primera carga.

## Deduplicación y originales

La deduplicación usa **SHA-256 del archivo completo**: los bytes idénticos se omiten aunque cambien el nombre o las fechas, y los identificadores heredados y las referencias de las listas se preservan.

Los originales **nunca se modifican ni se eliminan**. Quitar una pista elimina solo la copia guardada por Wave y sus referencias en las listas. Borrar una lista no afecta a ningún archivo de audio. Las ediciones de metadatos y las carátulas personalizadas son sobrescrituras locales: Wave no reescribe ni exporta las etiquetas.

## Almacenamiento persistente

El almacenamiento es específico del perfil del navegador y del origen del sitio. Una URL de preview distinta puede tener una biblioteca distinta: es el comportamiento esperado, no un fallo.

**Ajustes → Almacenamiento → Almacenamiento del navegador** informa de:

- Estimaciones de tamaño de audio, carátulas y letras.
- Uso y cuota del origen, cuando el navegador lo admite.

La importación solicita automáticamente almacenamiento persistente. El botón **Proteger archivos guardados** puede volver a solicitarlo. **El navegador puede denegar la protección.**

> [!IMPORTANT]
> El almacenamiento persistente reduce el riesgo de desalojo automático, pero **no** comprime el audio por debajo de su tamaño original **ni** sustituye a una copia de seguridad.

## Conexión segura

Hace falta **HTTPS** para Web Crypto y para la persistencia del almacenamiento. En `localhost` el navegador trata el origen como seguro; en una preview remota sin HTTPS algunas funciones pueden fallar.

## Derechos y alcance

Que el cliente sea público, gratuito y de código abierto describe **la distribución del cliente**, no un permiso para distribuir música, letras ni carátulas. La licencia MIT cubre el código de Wave; lo que reproduzcas con él sigue sujeto a los derechos de sus autores.

No se reclama ningún sitio de Pages desplegado, paquete nativo firmado ni autorización legal sobre contenidos de terceros. Las integraciones con cuentas, Spotify, Deezer y Firebase siguen aplazadas.

## Qué revisar si te preocupa la privacidad

1. **Ajustes → Letras**: confirma que la búsqueda automática está desactivada si no la quieres.
2. **Ajustes → Almacenamiento**: mira el uso del origen y solicita protección si el navegador lo permite.
3. **Tus archivos**: conserva los originales fuera del navegador.
4. **Datos del sitio**: recuerda que limpiarlos borra la colección de Wave.
