---
description: "Comparación real entre los clientes web, Windows y Android: qué hay en cada uno y qué falta."
updated: "2026-10-18"
---

Wave tiene **tres implementaciones independientes**, no envoltorios WebView ni Electron alrededor de la misma web. El cliente web es el más completo; Windows sigue su estructura con controles nativos de C#/WPF y Android usa Kotlin/Compose.

> [!IMPORTANT]
> Las bibliotecas de cada plataforma son separadas. Nunca se sincronizan ni se migran en silencio: lo que importas en el navegador no aparece en Windows ni en Android.

## Comparación de capacidades

| Capacidad | Web | Windows | Android |
| --- | --- | --- | --- |
| Inicio, biblioteca local y favoritos | Sí | Sí | Básico |
| Búsqueda dedicada | Sí | Búsqueda de canciones | Filtro de biblioteca |
| Álbumes y artistas | Perfiles y carátulas | Vistas nativas de grupo y detalle | Lista básica |
| Mixes diarios navegables y guardados | Etiquetas de género y artista | Etiquetas de género y artista | Todavía no |
| Listas ordenadas | Sí | Crear, editar, miembros y orden | Todavía no |
| Edición de la cola | Arrastrar, botones y teclado | Diálogo nativo; mover y quitar | Progresión básica |
| Posición en pausa restaurada | Sí | Sí | Todavía no |
| Mix automático y Autoplay local | Tiempos por pareja y variedad ponderada | Duración acotada y variedad local | Solo solapamiento manual |
| Letras | LRC mejorado, relleno y búsqueda opcional | LRC por línea, relleno y búsqueda explícita | LRC por línea y búsqueda |
| Ajustes | Seis menús | Seis menús | Página básica |
| Apariencia | Claro, oscuro y sistema; paletas de carátula | Claro, oscuro, texto grande y movimiento | Oscuro |
| Edición de carátulas | Canción, lista y artista | Carátulas de canción | Todavía no |
| Controles del sistema y modo reposo | Según navegador / sí | Todavía no | Sin servicio en primer plano |
| Comprobaciones de build alojadas | Superadas | Superadas + contratos + smoke de WPF | Superadas: unitarias, lint y build debug |

## Navegador y GitHub Pages

Node.js 22.12 o superior, o Node 24:

```sh
npm ci && npm run dev     # desarrollo
npm run build             # producción
```

Para una ruta de repositorio, `WAVE_BASE_PATH=/Wave/ npm run build` y servir bajo `/Wave/`.

El despliegue sin workflow propio se hace en **Settings → Pages → Deploy from a branch**, con **Branch: main** y **Folder: /docs**. El sitio compilado está confirmado en `docs/index.html` y `docs/site-assets/`, y `.nojekyll` desactiva Jekyll.

Hay que tener en cuenta dos cosas del navegador:

- Las bibliotecas son específicas **del origen del sitio y del perfil**. Una URL de preview distinta puede tener una biblioteca distinta.
- Hace falta **HTTPS** para Web Crypto y para la persistencia.

No se necesita backend ni claves de API. Los pasos completos están en [Instalación](/wave/install/).

## Windows

Aplicación nativa real en **C# y WPF** con Windows Media Player y los selectores de archivo estándar del sistema.

```powershell
dotnet build platforms/windows/Wave.Windows -c Release
dotnet run --project platforms/windows/Wave.Windows
dotnet publish platforms/windows/Wave.Windows -c Release -r win-x64 --self-contained false -o artifacts/windows
```

### Dónde guarda las cosas

| Qué | Dónde |
| --- | --- |
| Audio original | `%LOCALAPPDATA%/Wave/audio` |
| Biblioteca, listas, preferencias y estado | Archivos JSON sustituidos de forma atómica |
| Carátulas | Sobrescrituras locales separadas |

Las bibliotecas y preferencias existentes siguen siendo legibles. La antigua preferencia de solapamiento, ya desactivada, se migra sin activar Mix en silencio.

### Cómo es la aplicación

Inicio tiene atajos a las colecciones, mixes diarios y tarjetas de álbum. La búsqueda es su propio destino: título y carátula reproducen, artista y álbum abren su colección, y la información del reproductor compacto abre **Reproduciendo ahora**.

Las listas se pueden crear, renombrar, poblar, ordenar y eliminar sin borrar audio. Las ediciones de la cola conservan la grabación activa. Las sesiones restauradas vuelven en pausa. Ajustes separa Apariencia, Reproducción, Letras, Biblioteca, Almacenamiento y Acerca de.

### Qué comprueba CI

CI ejecuta un runner de contratos sin dependencias, compila y publica la aplicación, y lanza un modo smoke aislado de WPF que recorre Inicio, Búsqueda, mixes diarios, listas guardadas, las seis secciones de Ajustes y el diseño estrecho en tema claro. Captura PNG en `wave-windows-ui-smoke`.

> [!WARNING]
> Eso **no** es una matriz de dispositivos físicos ni de códecs y reproducción. La biblioteca de pruebas es temporal y no toca la biblioteca real de nadie.

### Lo que falta en Windows

La lectura de metadatos sigue limitada a **ID3 y WAV**. Todavía no están: extracción automática de carátulas incrustadas, agrupación de búsqueda idéntica a la web, fotos de artista, ordenación de álbumes, LRC con marcas de tiempo, análisis de forma de onda, modo reposo inmersivo e integración con los controles del sistema.

Los códecs del sistema operativo gobiernan la reproducción. **No es paridad completa con la web.**

Los ZIP de prueba están claramente etiquetados como sin firmar. Las licencias y avisos de .NET siguen incluidos; los futuros paquetes autocontenidos tendrán que inventariar su runtime pack exacto. Los detalles de sumas de comprobación, firma y límites de Defender están en `docs/WINDOWS_RELEASE.md` del repositorio.

## Android

Proyecto nativo independiente en **Kotlin y Jetpack Compose**.

| Requisito | Versión |
| --- | --- |
| JDK | 17 |
| SDK y build tools | 36 |
| Gradle | 8.13 |
| Android Studio | Compatible con AGP 8.13 |
| API mínima | 26 |

```sh
gradle -p platforms/android testDebugUnitTest lintDebug assembleDebug
```

Salida: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`, un artefacto de prueba en debug. El runner de CI en Ubuntu proporciona el SDK. Las pruebas cubren los contratos de LRC y de ganancia; las comprobaciones alojadas de unitarias, lint y ensamblado han pasado.

Quedan como puertas pendientes: importación y reproducción en dispositivo real, ciclo de vida seguro ante rotaciones, foco de audio, servicio en primer plano con sesión de medios y firma.

> [!IMPORTANT]
> El selector de documentos copia los bytes originales al almacenamiento privado de la aplicación. **Desinstalar elimina esa copia.** No es un sustituto de tus archivos, y todavía no reemplaza a la edición web.

## Tráfico con el servicio de letras

Los tres clientes mantienen **LRCLIB como único proveedor de letras en línea**.

- **Web** usa una cola compartida de 500 ms, Web Locks del mismo origen cuando están disponibles, compartición de búsquedas concurrentes y cabeceras en lista blanca.
- **Windows** serializa las peticiones por cliente con cancelación acotada y acepta plazos de reintento numéricos cortos y en formato de fecha HTTP.
- **Android** conserva su cola sincronizada y los plazos de reintento de más de un día.

Los dos clientes nativos espacian el inicio de las peticiones en 500 ms. **Ninguna de estas medidas elimina los límites del proveedor ni los límites por IP.** Se han añadido contratos de plazo de reintento nativos, pero la última validación local de la web no certifica un build nativo nuevo.

## Puertas de publicación

Antes de publicar una versión nativa hacen falta cinco cosas:

1. Ejecutar las comprobaciones en la última revisión.
2. Hacer pruebas reales de reproducción, accesibilidad y DPI en el dispositivo de destino.
3. Declarar el alcance reducido del cliente nativo.
4. Revisar los avisos de runtime exactos.
5. Firmar con credenciales guardadas **fuera** del repositorio.

En la fusión aprobada se etiqueta el commit fusionado real como `v0.1.0` y se crea la Release en GitHub. Nunca se incluyen claves de firma ni música personal.
