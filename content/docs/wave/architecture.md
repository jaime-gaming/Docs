---
title: "Arquitectura"
icon: "boxes"
order: 50
blurb: "capas, flujo de datos y módulos."
description: "Capas, flujo de datos, estructura de carpetas y módulos internos del cliente web de Wave."
updated: "2026-10-18"
---

Esta página describe el cliente web, que es la implementación de referencia. Wave no tiene API HTTP ni backend: los interfaces que se documentan aquí son **internos** y pueden cambiar durante el desarrollo `0.x`.

## Alcance y decisión de plataforma

La primera implementación es una aplicación de navegador en **React y TypeScript**. Ahora la acompañan proyectos independientes de Kotlin/Compose para Android y de C#/WPF para Windows. PixelPlayer sigue siendo una referencia de organización de biblioteca local y de interacciones de reproducción, **no una dependencia de implementación**.

El primer hito es un corte vertical que funcione de punta a punta: importar música local, persistirla, explorarla y buscarla, reproducirla, organizar listas y, opcionalmente, editar metadatos locales. Sin backend ni autenticación. Las letras automáticas opcionales consultan LRCLIB directamente desde el navegador; el audio permanece local.

## Capas y responsabilidades

```text
Interfaz React
    ├── App: vistas de biblioteca, filtros, diálogos, entrada de importación
    └── components: carátulas, controles del reproductor, diálogos accesibles
            │
Hooks de aplicación
    ├── useLibrary: carga, importación, favoritos, borrado, sobrescrituras
    ├── usePlaylists: carga, membresía ordenada, CRUD, errores
    └── usePlayer: ciclo de vida del audio, despacho de cola, Media Session
            │
Dominio                          Datos / adaptadores del navegador
    ├── Modelos Track / Playlist      ├── Repositorio IndexedDB
    ├── búsqueda / formateo           ├── importador de metadatos
    ├── mutaciones puras de listas    ├── validación y recorte de carátulas
    └── reducer puro de la cola       └── HTMLAudioElement
```

Tres reglas sostienen el diseño:

- **La capa de dominio no depende de React ni del almacenamiento.** Son funciones y tipos puros.
- **Los módulos de datos no renderizan interfaz.**
- **Los hooks coordinan los efectos secundarios** y exponen el estado a los componentes.

En este primer hito la navegación entre pantallas y la agrupación viven en `App.tsx`. El enrutado y las pantallas por función se pueden extraer cuando la aplicación crezca.

## Estructura de carpetas

```text
src/
├── components/
│   ├── Artwork.tsx
│   ├── ArtworkPicker.tsx
│   ├── TrackEditor.tsx
│   ├── PlaylistDialog.tsx
│   ├── PlaylistCollection.tsx
│   ├── AnimatedListItem.tsx
│   ├── LibraryContent.tsx
│   ├── Navigation.tsx
│   ├── Modal.tsx
│   └── PlayerBar.tsx
├── data/
│   ├── artwork.ts
│   ├── import.ts
│   └── library.ts
├── domain/
│   ├── playlists.ts
│   ├── player.ts
│   └── types.ts
├── hooks/
│   ├── usePlaylists.ts
│   ├── useLibrary.ts
│   └── usePlayer.ts
├── ui/               # tokens y preferencias de movimiento compartidos
├── test/
├── App.tsx
├── main.tsx
└── styles.css
```

## Flujo de datos

Ocho pasos, desde que eliges un archivo hasta que suena:

1. **Selección explícita.** El usuario elige o suelta archivos. El navegador no puede escanear en silencio las carpetas de música del dispositivo.
2. **Validación.** `useLibrary` comprueba extensión, tamaño e identidad duplicada.
3. **Metadatos.** El importador lee las etiquetas incrustadas en local y, si faltan, recurre a una inferencia conservadora de dos partes por guion espaciado, con artista y álbum desconocidos. Las etiquetas válidas tienen prioridad y la inferencia de artista desde el nombre debe coincidir con un título incrustado. Los prefijos explícitos de pista y disco se eliminan; los títulos numéricos genuinos, no.
4. **Persistencia.** Cada pista y su Blob de audio se guardan en IndexedDB **antes** de entrar en el estado de la interfaz.
5. **Derivación.** La interfaz deriva las pistas visibles desde la búsqueda, la vista, la agrupación y el orden.
6. **Cola.** Al seleccionar una pista se carga en el reducer de la cola una instantánea de los identificadores visibles.
7. **Reproducción.** `usePlayer` resuelve el identificador activo a una pista, crea URLs temporales de Blob y controla el motor decodificador nativo.
8. **Eventos.** Los eventos del navegador actualizan duración y posición o avanzan la cola. Los errores de audio pausan y muestran un mensaje accionable.

## Modelo de datos

Definido en `src/domain/types.ts`:

```ts
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileName: string;
  size: number;
  addedAt: number;
  favorite: boolean;
  blob: Blob;
  artwork?: string;
  audioInfo?: AudioInfo;
  contentHash?: string;
  lyricsLookup?: LyricsLookup;
  lyrics?: Lyrics;
  trackNumber?: number;
  discNumber?: number;
  originalMetadata?: TrackMetadata;
  editedAt?: number;
}

interface AudioInfo {
  codec?: string;
  sampleRate?: number;   // Hz
  bitsPerSample?: number;
  bitrate?: number;      // bits por segundo
  lossless?: boolean;
}

type RepeatMode = 'off' | 'all' | 'one';
type LibraryView = 'songs' | 'albums' | 'artists' | 'favorites' | 'playlists';
```

Convenciones de los campos:

| Campo | Unidad y significado |
| --- | --- |
| `duration` | Segundos. Cero significa desconocida. |
| `size` | Bytes. |
| `addedAt` | Marca de tiempo Unix en milisegundos. |
| `artwork` | Data URL de una imagen generada en local. Opcional. |
| `blob` | El archivo de audio persistido. |
| `audioInfo` | Metadatos opcionales de la fuente importada. **No** describe ni garantiza la calidad de salida del dispositivo. |
| `originalMetadata` | Se captura una sola vez antes de la primera edición local y se elimina al restaurar. |
| `editedAt` | Milisegundos desde el epoch Unix. |

Álbumes y artistas son **grupos derivados**, no entidades almacenadas de forma independiente. Ni editar ni restaurar cambia el Blob de audio persistido.

> [!NOTE]
> Los ejemplos anteriores en Kotlin para `MediaPlayerController`, `MusicLibrary`, listas y gestores de ajustes eran propuestas, no APIs funcionales. Su comportamiento relevante está representado ahora por los módulos TypeScript anteriores; lo que no está implementado sigue en la hoja de ruta del repositorio.

## Decisiones que se notan al usarlo

**Deduplicación por hash del archivo completo.** SHA-256 sobre los bytes, no sobre el nombre. Dos archivos idénticos con nombres o fechas distintos no ocupan dos veces, y los identificadores heredados y las referencias de las listas se preservan.

**El audio se conserva una sola vez y a calidad original.** No se recomprime. Las carátulas sí son JPEG compactos y las letras persisten el texto crudo una vez, reconstruyendo las líneas analizadas al cargar.

**Sobrescrituras, no reescrituras.** Las ediciones de metadatos y las carátulas personalizadas viven como sobrescrituras locales. Wave no toca las etiquetas de tus archivos ni las exporta.

**Migración con poda atómica.** La migración de biblioteca a versión 1 elimina de forma atómica las referencias de listas borradas, sin dejar punteros colgando.

## Pruebas y calidad

| Herramienta | Qué cubre |
| --- | --- |
| Vitest | Pruebas unitarias y de componentes |
| Testing Library | Interacción real con los componentes |
| Playwright | Integración en navegador |
| fake-indexeddb | IndexedDB en memoria para las pruebas |
| ESLint + Prettier | Estilo y errores comunes |
| `tsc -b` | Comprobación estricta de tipos en el build |

Las pruebas de navegador generan archivos WAV pequeños en memoria; no descargan ni confirman música con derechos.

## Hoja de ruta técnica

El hito 1 (reproductor web local) está implementado. Antes de declararlo estable quedan cuatro validaciones: reproducción e importación en Firefox, Safari, Chromium y navegadores móviles actuales; perfilado de la importación de colecciones grandes y del uso de memoria; revisión de interacción por teclado, lectores de pantalla, contraste y áreas táctiles; y comportamiento real en segundo plano con interrupciones y teclas multimedia.

Del hito 2 están hechas las listas personalizadas, las sobrescrituras de metadatos con restauración, el reemplazo de carátulas, las fotos de artista, la reordenación por botones y teclado, la migración de biblioteca y el recuerdo del volumen. Quedan pendientes la reordenación de la cola arrastrando, la copia de seguridad, la información de cuota, la importación en un worker, la importación de carpetas y la PWA instalable.
