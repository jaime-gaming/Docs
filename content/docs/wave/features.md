---
description: "El día a día de Wave: biblioteca, mixes diarios, listas, reproducción, letras y ajustes."
updated: "2026-10-18"
---

Esta página recorre lo que se hace con Wave una vez instalada la música. Todos los ejemplos corresponden al cliente web, que es el más completo; las diferencias con Windows y Android están en [Plataformas](/wave/platforms/).

## Añadir música

Dos caminos, ambos explícitos:

- **Añadir música** abre el selector de archivos del sistema y permite selección múltiple.
- **Arrastrar y soltar** sobre la ventana importa lo que sueltes.

El navegador **no puede** escanear en silencio las carpetas de música del dispositivo: siempre hay una acción tuya de por medio.

Durante la importación Wave hace cuatro cosas:

1. **Valida** extensión y tamaño (200 MB por archivo como máximo).
2. **Detecta duplicados** con SHA-256 del archivo completo: dos archivos con los mismos bytes se consideran la misma canción aunque cambien el nombre o las fechas.
3. **Lee los metadatos incrustados** y la carátula.
4. **Guarda** la pista y su Blob de audio en IndexedDB antes de mostrarla.

Cuando un archivo no tiene etiquetas, Wave recurre a una inferencia **conservadora** desde el nombre: separa por guion espaciado en dos partes y, si no encaja, deja artista y álbum como desconocidos. Las etiquetas incrustadas válidas siempre ganan, y la inferencia de artista desde el nombre tiene que coincidir con un título incrustado. Los prefijos explícitos de pista y disco se quitan; los títulos que son números de verdad, no.

## Explorar la biblioteca

Cinco vistas, más el buscador:

| Vista | Qué muestra |
| --- | --- |
| **Canciones** | Lista plana de todo lo importado. |
| **Álbumes** | Agrupaciones con su carátula y perfil propio. |
| **Artistas** | Agrupaciones con foto editable, independiente de las portadas. |
| **Favoritos** | Lo que marques con el corazón. |
| **Listas** | Tus listas de reproducción, con portada y descripción. |

Álbumes y artistas son **grupos derivados**, no entidades guardadas aparte: se calculan desde las pistas.

El buscador cubre título, artista y álbum. El orden puede ser por fecha de importación, título o artista.

## Mixes diarios

Los mixes son selecciones generadas con **tus propias etiquetas** de género y artista, no con un servicio remoto de recomendación.

- Se ven las canciones **antes** de reproducir.
- Se pueden reproducir en orden o barajar.
- Se pueden **guardar como lista**, y entonces quedan como una lista ordinaria que puedes editar.

> [!NOTE]
> Guardar un mix no lo congela frente al futuro: la selección de mañana no sobrescribe la lista que guardaste hoy. Con bibliotecas pequeñas pueden aparecer menos de tres mixes.

## Listas de reproducción

Crear una lista es elegir nombre, portada y descripción. Después:

- **Añadir canciones** desde cualquier vista.
- **Reordenar** con botones o con teclado (arrastrar todavía no está en la cola).
- **Quitar canciones** sin borrar el audio.
- **Renombrar** y **eliminar** la lista.

Eliminar una lista no afecta a ningún archivo de audio: solo desaparece la agrupación y sus referencias.

## Reproducir

Controles disponibles: play, pausa, anterior, siguiente, barra de posición, volumen, aleatorio, repetir una y repetir todo. Wave recuerda el volumen y el último nivel audible, incluso si silencias, recargas y quitas el silencio.

Al elegir una canción se carga en la cola **una instantánea de los identificadores visibles**: es decir, la cola reproduce lo que estabas viendo, en el orden en que lo estabas viendo.

La cola se puede ver y se pueden quitar entradas. Añadir pistas únicas a la cola actual **no** la sustituye. Cuando el navegador lo admite, Wave expone las acciones de Media Session, así que funcionan los controles del sistema y de los auriculares.

Los errores de audio pausan la reproducción y muestran un mensaje accionable, en lugar de fallar en silencio.

### Transiciones automáticas

- **Mix** analiza los tiempos de las parejas de canciones para encadenarlas.
- **Autoplay** local elige la siguiente con variedad ponderada.

En Windows el temporizador es de duración acotada con variedad local; en Android solo hay solapamiento manual.

## Letras

Tres caminos, de más controlado a más automático:

1. **Añadir tu propio texto o LRC** a una canción.
2. **Buscar explícitamente** una coincidencia desde el editor.
3. **Activar la búsqueda automática** en Ajustes (viene desactivada).

El cliente web soporta **LRC mejorado** y relleno de líneas. Las letras guardadas funcionan **sin conexión**.

Las búsquedas reutilizan resultados ya guardados, coordinan las peticiones y respetan los tiempos de reintento del proveedor. Aun así, LRCLIB puede estar temporalmente saturado.

> [!NOTE]
> La búsqueda automática usa la API pública de LRCLIB y envía metadatos de la canción. El proveedor también ve información de la conexión, como la dirección IP. El texto descargado se queda en local. Los detalles completos están en [Privacidad y datos](/wave/privacy/).

## Quedarse en la música

- **Reproduciendo ahora** a pantalla completa, con carátula y letra sincronizada.
- **Reproductor compacto** para seguir navegando mientras suena.
- **Modo reposo**: la sesión restaurada vuelve en pausa, no reproduciendo a traición.

## Ajustes

Seis menús en web y en Windows; una página básica en Android:

| Menú | Qué controla |
| --- | --- |
| **Apariencia** | Tema claro, oscuro o del sistema; paletas derivadas de las carátulas; texto más grande; movimiento reducido. |
| **Reproducción** | Comportamiento de la cola, transiciones y nivel recordado. |
| **Letras** | Búsqueda automática, proveedor y relleno de líneas. |
| **Biblioteca** | Edición de metadatos locales y restauración de originales. |
| **Almacenamiento** | Estimaciones de audio, carátulas y letras; uso y cuota del origen; protección de los archivos guardados. |
| **Acerca de** | Versión, licencias y avisos de terceros. |

### Accesibilidad y comodidad

Los controles del teléfono están pensados para el tacto. Hay atajos de teclado, controles etiquetados y soporte de movimiento reducido. El contraste y los tamaños de texto se pueden ajustar desde Apariencia.

## Editar metadatos sin romper nada

Las ediciones de metadatos y las carátulas personalizadas son **sobrescrituras locales**: Wave no reescribe ni exporta las etiquetas de tus archivos.

- Antes de la primera edición local se guarda `originalMetadata` una sola vez.
- Al restaurar, se elimina esa copia y vuelve lo original.
- Ni editar ni restaurar cambia el Blob de audio persistido.
