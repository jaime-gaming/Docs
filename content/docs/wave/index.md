---
title: "Visión general"
icon: "compass"
order: 10
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

## Seguir leyendo en el repositorio

Esta guía resume y ordena. El repositorio trae además su propia documentación, bastante más extensa, y conviene saber qué hay y dónde está.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/Wave/blob/main/README.md) | 8 KB | La presentación del proyecto |
| [`docs/ARCHITECTURE.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/ARCHITECTURE.md) | 43 KB | Alcance y decisión de plataforma, capas y responsabilidades, estructura de directorios, flujo de datos, modelos y persistencia, estado de reproducción, integración con el navegador, interfaz y accesibilidad, privacidad y seguridad, pruebas y límites futuros, letras y perfiles, y el motor nativo de Mix |
| [`docs/DESIGN.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/DESIGN.md) | 44 KB | El mismo documento con una sección final más, «Release 0.1.0 refinements» |
| [`docs/API_REFERENCE.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/API_REFERENCE.md) | 34 KB | La referencia de la API interna |
| [`docs/VALIDATION.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/VALIDATION.md) | 34 KB | El registro de validación: web, Android y Windows, publicación y estado legal, y el seguimiento de cada rediseño |
| [`docs/DEVELOPMENT.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/DEVELOPMENT.md) | 31 KB | La guía de desarrollo |
| [`docs/ROADMAP.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/ROADMAP.md) | 11 KB | La hoja de ruta |
| [`docs/PLATFORMS.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/PLATFORMS.md) | 8 KB | Las plataformas en la versión 0.1.0 |
| [`PRIVACY.md`](https://github.com/jaime-gaming/Wave/blob/main/PRIVACY.md) | 6 KB | Privacidad y almacenamiento local |
| [`docs/media/PROMO_PRODUCTION.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/media/PROMO_PRODUCTION.md) | 5 KB | La producción del vídeo de producto de 0.1.0 |
| [`CONTRIBUTING.md`](https://github.com/jaime-gaming/Wave/blob/main/CONTRIBUTING.md) | 5 KB | Cómo contribuir |
| [`docs/RELEASE_NOTES_0.1.0.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/RELEASE_NOTES_0.1.0.md) | 4 KB | Las notas de la versión 0.1.0 |
| [`CODE_OF_CONDUCT.md`](https://github.com/jaime-gaming/Wave/blob/main/CODE_OF_CONDUCT.md) | 3 KB | El código de conducta |
| [`docs/WINDOWS_RELEASE.md`](https://github.com/jaime-gaming/Wave/blob/main/docs/WINDOWS_RELEASE.md) | 3 KB | La preparación de la release de Windows |
| [`THIRD_PARTY_NOTICES.md`](https://github.com/jaime-gaming/Wave/blob/main/THIRD_PARTY_NOTICES.md) | 2 KB | Los avisos de terceros |
| [`CHANGELOG.md`](https://github.com/jaime-gaming/Wave/blob/main/CHANGELOG.md) | 22 KB | El registro de cambios |

> [!IMPORTANT]
> **`ARCHITECTURE.md` y `DESIGN.md` no son dos visiones distintas.** Comparten título y los doce apartados, y el único contenido que los separa son seis líneas al final de `DESIGN.md`: la sección «Release 0.1.0 refinements», que concreta la rejilla tres más dos de los atajos de colección en móvil, la página de mezclas diarias tipo lista con reproducir y aleatorio explícitos, el reinicio del scroll al entrar, objetivos táctiles de al menos 44 px, la jerarquía de la interfaz independiente de Windows con sus seis destinos de ajustes, y la coordinación entre proveedores —sin Web Locks la planificación es local a la pestaña, y si el almacenamiento se deniega el cliente guarda su propio espaciado en memoria sin poder prometer un plazo compartido entre pestañas.
