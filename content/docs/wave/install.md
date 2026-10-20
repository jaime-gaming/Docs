---
title: "Instalación"
icon: "download"
order: 20
blurb: "ponerlo en marcha en cinco minutos."
description: "Requisitos, comandos y primera comprobación para ejecutar Wave en el navegador, en Windows y en Android."
updated: "2026-10-18"
---

Wave se puede usar de tres formas: en el navegador (la más rápida), como aplicación nativa de Windows o como build experimental de Android. Ninguna necesita cuenta, clave de API ni backend.

## En el navegador

### Requisitos

| Herramienta | Versión |
| --- | --- |
| Node.js | 22.12 o superior dentro de Node 22, o Node 24 |
| npm | El que viene con Node.js |
| Git | Una versión reciente mantenida |
| Navegador | Chromium, Firefox o Safari modernos |

No hacen falta JDK, Gradle, Android Studio ni SDK de Android para el cliente web.

### Ponerlo en marcha

```sh
git clone https://github.com/jaime-gaming/Wave.git
cd Wave
npm ci
npm run dev
```

Vite imprime la dirección de desarrollo, normalmente `http://localhost:5173`. El servidor enlaza `0.0.0.0`, así que también sirve en entornos de desarrollo con proxy.

> [!TIP]
> Para probar desde el móvil, abre en el teléfono la dirección alcanzable del servidor, **no** el `localhost` del propio teléfono.

No hay archivo `.env`, ni claves, ni backend que levantar. Los recursos del navegador usan URLs del mismo origen y las letras opcionales consultan la API pública HTTPS de LRCLIB.

### Primera comprobación

1. Abre la dirección que ha impreso Vite.
2. Pulsa **Añadir música**.
3. Selecciona uno o varios archivos de audio.
4. La colección aparece al instante: pulsa una canción para reproducirla.

Formatos importables: **MP3, FLAC, WAV, OGG, M4A, AAC, Opus, AIFF y WebM**, hasta **200 MB por archivo**. La reproducción real depende de los códecs del navegador o del sistema operativo.

### Build de producción

```sh
npm run build      # comprobación estricta de tipos + bundle
npm run preview    # sirve el bundle localmente
```

El resultado se escribe en `dist/`, que Git ignora. Para servirlo bajo una subcarpeta del repositorio:

```sh
WAVE_BASE_PATH=/Wave/ npm run build
```

### Publicar en GitHub Pages

Sin crear ningún workflow propio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, después **Branch: main** y **Folder: /docs**.

El sitio compilado vive en `docs/index.html` y `docs/site-assets/`; el archivo `.nojekyll` desactiva el procesamiento de Jekyll. **No selecciones la raíz del repositorio**: su índice es fuente de Vite, no el sitio de producción.

Después de cualquier cambio en la fuente web o en los recursos públicos:

```sh
npm ci && npm run build:pages
```

y confirma los cambios generados en `docs` junto con la fuente. Ese comando usa URLs relativas (sirve tanto en rutas de repositorio como en dominios propios), sustituye los recursos generados y conserva la documentación en Markdown. CI comprueba que el sitio confirmado coincide con un build nuevo.

## Comandos disponibles

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprobación estricta de tipos y bundle de producción |
| `npm run preview` | Preview local del bundle de producción |
| `npm run lint` | Comprobaciones de ESLint |
| `npm run format` | Formatea fuente y documentación con Prettier |
| `npm run format:check` | Comprueba el formato sin modificar archivos |
| `npm test` | Ejecuta una vez las pruebas unitarias y de componentes |
| `npm run test:watch` | Las mismas pruebas, en modo vigilancia |
| `npm run test:e2e` | Pruebas de navegador con Playwright |
| `npm run build:pages` | Genera el sitio publicable en `docs/` |
| `npm run release:check` | Comprobaciones previas a una publicación |

### Pruebas de navegador

Antes del primer arranque de Playwright hay que instalar Chromium:

```sh
npx playwright install chromium
npm run test:e2e
```

En Linux puede hacer falta además `npx playwright install --with-deps chromium`. La configuración levanta un servidor Vite local automáticamente si no hay ninguno disponible, y `CHROMIUM_EXECUTABLE_PATH` permite apuntar a un Chromium ya instalado en entornos restringidos.

Las pruebas de navegador generan archivos WAV pequeños en memoria: no descargan ni confirman música con derechos.

```sh
npx playwright show-report
```

## En Windows

Requisitos: Windows y el **.NET 10 SDK** para desarrollar. El ZIP de prueba depende del framework, así que para ejecutarlo hace falta el **.NET 10 Windows Desktop Runtime**; no lo incluye y no requiere permisos de administrador.

```powershell
dotnet run --project platforms/windows/Wave.Contracts.Tests -c Release
dotnet build platforms/windows/Wave.Windows -c Release
dotnet run --project platforms/windows/Wave.Windows
dotnet publish platforms/windows/Wave.Windows -c Release -r win-x64 --self-contained false -o artifacts/windows
```

La aplicación nativa usa WPF, Windows Media Player y los selectores de archivo estándar. Los originales se copian a `%LOCALAPPDATA%/Wave/audio`, mientras que biblioteca, listas, preferencias y estado de escucha usan archivos JSON sustituidos de forma atómica.

> [!WARNING]
> Las descargas sin firmar pueden provocar avisos de SmartScreen o del antivirus. Wave usa archivos .NET normales sin empaquetar, se ejecuta sin permisos de administrador e incluye sumas de comprobación, pero **nada de esto garantiza cero falsos positivos ni establece reputación de editor**. No desactives tu protección: desactivarla no es una solución.

## En Android

Requisitos: **JDK 17**, SDK y build tools **36**, **Gradle 8.13** y un Android Studio compatible con **AGP 8.13**. API mínima **26**.

Abre `platforms/android`, deja que el IDE cree la configuración local del SDK y ejecuta:

```sh
gradle -p platforms/android testDebugUnitTest lintDebug assembleDebug
```

El resultado es `platforms/android/app/build/outputs/apk/debug/app-debug.apk`: un artefacto de prueba en modo debug. El runner de CI en Ubuntu ya proporciona el SDK. Las pruebas cubren los contratos de LRC y de ganancia.

La importación con el selector de documentos copia los bytes originales al almacenamiento privado de la aplicación, así que **desinstalar elimina esa copia**: conserva los originales.

## Solución de problemas

| Síntoma | Causa probable y qué hacer |
| --- | --- |
| `npm ci` falla | Versión de Node anterior a 22.12. Actualiza Node y borra `node_modules/`. |
| No se reproduce un archivo | El navegador no tiene ese códec. Prueba en Chromium o convierte el archivo. |
| La colección desaparece | El almacenamiento del navegador se limpió o la sesión era privada. Importa de nuevo desde los originales. |
| Otra URL muestra otra biblioteca | El almacenamiento es por perfil de navegador **y por origen**. Es el comportamiento esperado. |
| Las letras no aparecen | La búsqueda automática está desactivada por defecto: actívala en Ajustes, o importa tu propio LRC. |
