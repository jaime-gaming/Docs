---
description: "Dudas habituales sobre RNGdle Infinite, límites del juego, comportamiento offline y créditos."
updated: "2026-10-18"
---

## Preguntas frecuentes

### ¿Hay límite de tiradas?

**No.** Tira tan a menudo como quieras una vez que terminan la revelación y el enfriamiento. No hay medidor de energía ni límite diario.

### ¿Puedo elegir un número concreto?

**No.** No hay semilla, ni editor, ni valores predefinidos. El juego consiste en reaccionar a lo que sale.

### ¿Un compañero hace que mis tiradas tengan más suerte?

**No.** Los compañeros multiplican el EP que ganas. Tu número y sus insignias siguen siendo los mismos.

### ¿Cuentan las tiradas sin conexión?

**Sí.** Pagan su EP y aparecen en tu historial. La única diferencia es que **las skills solo se cargan mientras estás en línea**.

### ¿Es el RNGdle oficial?

**No.** Es una recreación independiente. Los créditos del original están más abajo.

### ¿Dónde se guarda mi partida?

En el `localStorage` de tu navegador. No hay cuenta ni servidor. Cambiar de navegador, usar navegación privada o limpiar los datos del sitio la borra. Los detalles están en [Partida y sincronización](/rngdle-infinite/save/).

### ¿Puedo jugar en dos dispositivos a la vez?

Sí, con **Ajustes → Enlace de dispositivo**. El dispositivo que crea el enlace es el principal y es el que ejecuta tiradas y compras, así que las dos pantallas no se pelean por la misma tirada. **Cualquiera con el enlace puede jugar con tu cuenta.**

### ¿Las skills cambian qué insignias salen?

**Nunca.** Las skills afectan a lo que ganas o a cuánto esperas, no a cómo se puntúa un número.

### ¿Qué hace falta para el prestige?

Dos cosas a la vez: **media colección** de insignias y **30 millones de EP ganados en el ciclo**.

### ¿Y el rollback?

Aparece **después de tres prestigios** y se puede repetir.

### ¿Cuántos números puedo guardar?

**Tres.** Ese es el tope de marcadores y aparece en el chip **«Bookmarks (n/3)»** de la interfaz. Lo importante no es el tope sino cómo se cobra: **cada número guardado paga los multiplicadores de skills de cartera**, no solo el último.

### ¿Las firmas de compañero ocupan hueco?

**Sí.** Una firma ocupa un hueco del rack como cualquier otro círculo. No van aparte ni son gratis: equipar una firma es gastar un hueco.

### ¿El rollback está bloqueado hasta el tercer prestigio?

Está **oculto, que no es lo mismo que deshabilitado**: antes de los tres prestigios no se muestra. Cuando aparece, **arranca desde 0 EP** (sin bonificación inicial) y **se puede repetir**.

### ¿Trail y Drift cambian mi tirada?

Son **las dos únicas excepciones** a la regla de que los compañeros no tocan la tirada, y lo hacen de una forma acotada: **usan su propia muestra aleatoria**. No modifican tu número ni su puntuación; generan un resultado adicional aparte.

### ¿Los ajustes de presentación afectan a lo que gano?

**Nunca.** No cambian probabilidades, EP, precios ni tiempos. Son cosméticos por definición.

### ¿Mi partida pasa por un servidor al enlazar dispositivos?

**No.** En el alojamiento estático el enlace va por **PeerJS sobre WebRTC** y el broker público **solo hace el handshake**: la partida viaja de dispositivo a dispositivo y nunca pasa por él. Los detalles están en [Partida y sincronización](/rngdle-infinite/save/).

### ¿Puedo modificar el juego o contribuir?

Sí. La guía de [Desarrollo](/rngdle-infinite/dev/) tiene el mapa del repositorio, los comandos y las pruebas. Antes de tocar nada conviene leer sus **reglas que no se negocian**: la tirada honesta, que los compañeros no cambian la tirada, el tope de 3 marcadores y que los ajustes de presentación no tocan la economía.

## Créditos

- **[RNGdle](https://www.rngdle.com/)** de Cam / sparrowpatch — la idea original.
- **[RNGdle Tools](https://rng.cubityfir.st/)** y su catálogo de insignias — la fuente de los datos de puntuación y de rango.
- Ilustraciones de las insignias por **[Twemoji](https://github.com/jdecked/twemoji)**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Tipografías: **Inter** y **Space Mono** (SIL Open Font License). Iconos: **[Lucide](https://lucide.dev/)**.

> [!NOTE]
> RNGdle Infinite es una implementación independiente. No está afiliado, patrocinado ni respaldado por los autores del RNGdle original ni por RNGdle Tools.

## Ejecutarlo en local

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # suite de Playwright (necesita un binario de Chromium)
npm run build   # build de producción
```

`AGENTS.md` en el repositorio tiene el mapa del proyecto y las convenciones para quienes contribuyen y para los agentes de código.

## Informar de un problema

El juego se publica desde el repositorio [`jaime-gaming/RNGdle-Infinite`](https://github.com/jaime-gaming/RNGdle-Infinite). Para un fallo concreto, una issue con estos datos ayuda a reproducirlo:

- Número que salió y qué esperabas que puntuara.
- Compañero y skills activos en ese momento.
- Navegador y dispositivo.
- Si venías de una tirada offline o de un enlace entre dispositivos.
