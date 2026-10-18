---
description: "Qué es Wave, qué problema resuelve y en qué estado se encuentra la versión 0.1.0."
updated: "2026-10-18"
---

Wave es un reproductor de música **local-first**: trae tus propios archivos de audio y Wave los organiza, los busca y los reproduce sin subirlos a ningún servidor. No hay cuenta, ni suscripción, ni backend, ni analítica.

> [!NOTE]
> Versión **0.1.0**, publicada el **17 de octubre de 2026**. Es la primera versión funcional completa del cliente web, acompañada de clientes nativos independientes para Windows y Android.

## El problema que resuelve

Los reproductores en streaming no sirven para la música que ya posees: archivos ripados de CD, descargas de Bandcamp, grabaciones propias o colecciones heredadas. Las alternativas locales suelen ser aplicaciones de escritorio pesadas, o bien proyectos que exigen crear una cuenta y subir tu biblioteca a la nube de un tercero.

Wave ocupa el punto intermedio:

- **Funciona en el navegador**, sin instalar nada en la mayoría de los casos.
- **Los archivos no salen del dispositivo.** Se guardan en el almacenamiento del propio navegador.
- **No hay nada que configurar**: se abre, se añade música y se reproduce.

## Qué permite hacer

| Área | Qué incluye |
| --- | --- |
| **Biblioteca** | Canciones, álbumes, artistas y favoritos; búsqueda por título, artista y álbum; orden por fecha de importación, título o artista. |
| **Mixes diarios** | Selecciones generadas con tus propias etiquetas de género y artista. Se ven antes de reproducir, se pueden barajar y se pueden guardar como lista editable. |
| **Listas** | Crear, renombrar, añadir y quitar canciones, reordenar con botones o teclado, elegir portada y descripción, y eliminar sin tocar el audio. |
| **Reproducción** | Play, pausa, anterior, siguiente, barra de posición, volumen, aleatorio, repetir una y repetir todo. Cola editable y controles del sistema cuando el navegador los admite. |
| **Letras** | LRC mejorado, relleno de líneas y búsqueda opcional en LRCLIB. Las letras guardadas funcionan sin conexión. |
| **Apariencia** | Tema claro, oscuro o del sistema; paletas derivadas de las portadas; texto más grande y movimiento reducido. |

## Las tres implementaciones

Wave no es una web envuelta tres veces. Son tres clientes independientes que comparten el modelo de datos y la intención de diseño:

- **Web** — React 19, TypeScript y Vite. Es el cliente más completo y el que marca el ritmo del resto.
- **Windows** — C# y WPF con Windows Media Player. Una aplicación nativa real, no un WebView.
- **Android** — Kotlin y Jetpack Compose, con API mínima 26. Es experimental y tiene menos funciones.

Las bibliotecas de cada plataforma son **separadas**: nunca se sincronizan ni se migran en silencio. Ver la comparación completa en [Plataformas](/wave/platforms/).

## Stack técnico

```text
Web       React 19 · TypeScript · Vite · IndexedDB (idb)
          music-metadata · motion · lucide-react · Nunito Sans
Windows   C# · WPF · .NET 10 · Windows Media Player
Android   Kotlin · Jetpack Compose · Gradle 8.13 · JDK 17 · API 26+
Pruebas   Vitest · Testing Library · Playwright · fake-indexeddb
Calidad   ESLint · Prettier · tsc -b estricto
```

## Estado y límites conocidos

Lo que **sí** está implementado en el cliente web:

- Importación por selector de archivos y por arrastrar y soltar, con progreso, validación y detección de duplicados.
- Metadatos y carátulas incrustados, con inferencia conservadora desde el nombre de archivo cuando no hay etiquetas.
- Persistencia en IndexedDB de archivos y favoritos, con migración de biblioteca a versión 1.
- Edición local de metadatos con restauración del original.
- Suite de pruebas unitarias, de componentes y de navegador.

Lo que **todavía no** está:

- PWA instalable y arranque fiable sin conexión.
- Reordenación de la cola arrastrando.
- Copia de seguridad y restauración de la biblioteca.
- Importación de carpetas con permiso explícito.
- Firma de código en los instaladores nativos: los ZIP de Windows y los APK de Android son artefactos de prueba **sin firmar**.

> [!WARNING]
> Wave es un reproductor, no un sistema de copias de seguridad. El almacenamiento del navegador puede borrarse al limpiar los datos del sitio, al navegar en privado o por desalojo automático. **Conserva siempre tus archivos originales.**

## Licencia y referencias

Wave se publica bajo licencia **MIT**. Las dependencias conservan sus propias licencias.

[PixelPlayer](https://github.com/PixelPlayerHQ/PixelPlayer) es la referencia de organización de biblioteca local y de interacción del reproductor, pero Wave es una implementación independiente: no incluye código, carátulas ni marca de PixelPlayer. Tampoco está afiliado, patrocinado ni respaldado por PixelPlayer o Spotify AB.

## Dónde seguir

- [Instalación](/wave/install/) — ponerlo en marcha en cinco minutos.
- [Funciones y uso](/wave/features/) — el día a día del reproductor.
- [Plataformas](/wave/platforms/) — qué hay en web, Windows y Android.
- [Arquitectura](/wave/architecture/) — capas, flujo de datos y módulos.
- [Privacidad y datos](/wave/privacy/) — qué se guarda, dónde y qué sale del dispositivo.
