---
description: "Cómo está construido el juego, mapa del repositorio, comandos, reglas de diseño innegociables y pruebas con Playwright."
updated: "2026-10-18"
---

## Qué es técnicamente

RNGdle Infinite es un juego de navegador hecho con **React + Vite**. No tiene backend: todo ocurre en el cliente y la partida se guarda en `localStorage`.

Dos decisiones de arquitectura mandan sobre el resto:

- **El RNG y el scoring viven en un Web Worker** (`src/roll.worker.js`). Mantenerlos fuera del hilo de interfaz es lo que permite tiradas largas y cálculos de insignias sin congelar la pantalla.
- **La fuente de aleatoriedad es propia** (`src/random.js`). No se sustituye por `Math.random` para las tiradas: la honestidad del número es una regla del proyecto, no un detalle de implementación.

> [!IMPORTANT]
> El juego es una **recreación independiente** de RNGdle. Los datos de puntuación y de rangos provienen de RNGdle Tools, y las ilustraciones de las insignias son de Twemoji (CC BY 4.0). Las fuentes son Inter y Space Mono (SIL Open Font License) y los iconos son de Lucide.

## Mapa del repositorio

| Ruta | Qué vive ahí |
| --- | --- |
| `src/main.jsx` | El shell de la aplicación: rutas, conexión de la pantalla de tirada y arranque del enlace de dispositivo |
| `src/roll.worker.js` | Tirada y puntuación en un worker |
| `src/random.js` | La fuente de aleatoriedad |
| `src/badges.js`, `src/infinite-badges.js` | Definiciones de insignias, familias y valores de EP |
| `src/pets.js` | Compañeros: precios, bonificaciones y skills |
| `src/rack.js`, `src/draw-plan.js` | El rack de skills y cómo las skills de sorteo planifican sus extracciones |
| `src/rebirth.js` | Escalera de rebirth, prestige y Rollback |
| `src/progress.js` | Formato de guardado, migraciones y la clave `PROGRESS_KEY` |
| `src/sync.js` | Enlace de dispositivo (relay o PeerJS/WebRTC), heartbeat y reconexiones |
| `src/components/` | Componentes compartidos de interfaz e iconos del juego |
| `src/data/` | Datos de juego preparados; su `README.md` documenta la procedencia y la fuente fijada |
| `tests/` | Especificaciones de Playwright; `tests/helpers/` tiene la siembra y los helpers de reloj |
| `tools/` | Scripts de Node: relay, publicación en Pages, preparación de datos, capturas y auditorías |
| `vite.config.js` | Servidor de desarrollo; sirve el relay de sincronización en `/__sync/*` |
| `docs/` | Sitio construido para GitHub Pages. **Generado: no se edita a mano** |
| `media/` | Capturas del README, generadas desde el juego en marcha por `tools/screenshots.mjs` |

## Comandos

```sh
npm install
npm run dev              # servidor en 0.0.0.0:5173, relay incluido
npm test                 # suite completa de Playwright (arranca npm run dev sola)
npx playwright test tests/roll.spec.js   # una sola especificación
npm run build            # build de producción en dist/
npm run pages:publish    # regenera docs/ (tras cambios que se publican)
npm run test:pages       # comprobaciones sobre el docs/ ya commiteado
npm run audit:economy    # auditoría de precios y distribución de tiradas
npm run format           # prettier sobre src, tests, configs de raíz y README
```

### Chromium en entornos restringidos

La descarga de Chromium que hace Playwright suele estar bloqueada en sandboxes. Si ya tienes un binario de Chromium, exporta `CHROMIUM_PATH=/ruta/a/chromium` antes de ejecutar las pruebas. Algunos entornos necesitan además `--no-sandbox`, que `playwright.config.js` ya pasa cuando `CHROMIUM_PATH` está definido.

## Reglas que no se negocian

Son decisiones de diseño tomadas por quien mantiene el proyecto. **No se cambian como efecto secundario de otro trabajo.**

- **Tirada honesta.** Una skill puede cambiar cuántos números se extraen o cuál se conserva, pero **nunca** la tabla de puntuación, el valor de las insignias ni el rango de un número. Los multiplicadores de cartera solo multiplican EP ya bancario.
- **Los compañeros nunca cambian la tirada.** Multiplican el EP que llega a la cartera. **Trail y Drift son las únicas excepciones**, y usan su propia muestra aleatoria.
- **Rollback** permanece oculto hasta tener tres prestiges. Está **oculto, no deshabilitado**. Arranca desde 0 EP (sin bonificación inicial) y se puede repetir.
- **Los marcadores están limitados a 3.** El README, el chip «Bookmarks (n/3)» y las pruebas afirman ese techo.
- **Las firmas de compañero** ocupan un hueco del rack, como cualquier otro círculo.
- **Logos.** La marca nueva del RNG sobre ∞ es **solo** para el favicon y el icono de la aplicación móvil. El logo del juego es el original, anterior a RNGdle Infinite.
- **Números almacenados.** Cada número guardado de una tirada paga los multiplicadores de skills de cartera, no solo el último.
- **Los ajustes de presentación** nunca cambian probabilidades, EP, precios ni tiempos.
- **Sin conexión.** Las tiradas offline pagan EP y entran en el historial. **La carga de skills es solo con conexión.**

> [!WARNING]
> Si una petición parece chocar con una de estas reglas, el procedimiento es **parar y preguntar** en vez de suponer. Es la convención explícita del repositorio.

## Pruebas

La suite es de Playwright y arranca sola el servidor de desarrollo. Algunas especificaciones son lentas **a propósito**, porque prueban los tempos reales del juego: la revelación de 45 segundos y el enfriamiento de 60.

Notas que ahorran tiempo:

- `tests/helpers/progress.js` siembra la partida. Úsalo en vez de escribir `localStorage` a mano para `PROGRESS_KEY`.
- Una página que lee `?sync=` lo hace en un efecto **después del montaje**. Espera a que el enlace esté guardado antes de navegar, o la unión compite con la navegación.
- `tests/device-link-webrtc.spec.js` necesita la dependencia de desarrollo `peer`. Debe seguir en `devDependencies`.
- Las especificaciones sensibles a tiempos (`roll`, `auto-originals`) pueden dar falsos fallos con mucha carga paralela. **Reejecútalas solas** antes de dar por buena una regresión.
- Para flujos largos, ajusta `test.setTimeout` en vez de acortar los temporizadores del juego.

## Publicación

GitHub Pages sirve `docs/` desde la rama `main`, con la ruta base `/RNGdle-Infinite/`.

El flujo tras un cambio que se publica:

1. Ejecutar `npm run pages:publish`, que reconstruye `docs/`.
2. Commitear el `docs/` regenerado.

> [!CAUTION]
> `docs/` es **contenido generado**. Editarlo a mano se pierde en la siguiente publicación, y commitear un `docs/` sin regenerar deja la versión pública desincronizada del código.

## Datos y economía

`src/data/` contiene los datos de juego ya preparados, y su propio `README.md` documenta la procedencia y la fuente fijada: las puntuaciones y los rangos vienen del catálogo de insignias de RNGdle Tools.

`npm run audit:economy` revisa dos cosas que conviene auditar juntas porque se influyen: los **precios** de la tienda y la **distribución de las tiradas**. Si cambias una insignia, un compañero o un precio, es el comando que dice si la economía sigue teniendo sentido.
