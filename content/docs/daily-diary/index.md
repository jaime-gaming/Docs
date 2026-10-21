---
title: "Visión general"
icon: "compass"
order: 10
description: "Qué es Diario, qué lo hace distinto de otras apps de journaling y qué incluye."
updated: "2026-10-21"
---

**Diario** es un cuaderno personal, minimalista y **100 % local**. Sin backend, sin cuentas, sin IA y sin APIs externas: los resúmenes, las estadísticas y las tendencias se calculan en tu navegador con JavaScript, reglas y plantillas de texto.

> [!TIP]
> **[Abrir Diario](https://jaime-gaming.github.io/daily-diary/)** — funciona en escritorio y en móvil, y sin conexión después de la primera carga.

## La idea

La navegación se organiza alrededor de cuatro áreas —**Hoy**, **Rutina**, **Archivo** y **Progreso**— y **Pensamientos** es un espacio opcional, no el tema de todo el cuaderno.

Esa decisión de diseño importa: muchas apps de journaling te empujan a escribir texto cada día. Diario permite **apuntar solo el ánimo o una cifra y guardar**, sin escribir nada. Las notas son opcionales y el cuaderno **no escribe texto por su cuenta**.

## Qué incluye

| Área | Qué hace |
| --- | --- |
| **Hoy** | Ánimo, sueño, dedicación, notas, etiquetas, energía, estrés y gratitud |
| **Rutina** | Hábitos, rachas, constancia de 35 días, contadores y tareas para mañana |
| **Archivo** | Historial con búsqueda y filtro, y calendario con el color del ánimo de cada día |
| **Progreso** | Estadísticas, tu semana y resumen del mes |
| **Pensamientos** | Botellas que se tiran al mar y solo se leen al volver |
| **Ajustes** | Perfil, apariencia, contenido y datos |

Además:

- **Rutas reales** con Atrás y Adelante funcionando, y páginas estáticas generadas en el build.
- **Guardado local sin sorpresas**: un día solo entra en el cuaderno cuando pulsas **«Guardar día»**.
- **Resumen del día** generado con plantillas `if/else` y frases fijas, **sin ningún modelo**.
- **Estadísticas** con gráfico SVG adaptable, escalas explícitas, huecos cuando faltan días y meta de sueño.
- **Móvil** con cabecera compacta y navegación inferior que respeta las áreas seguras del dispositivo.
- **Movimiento** con transiciones entre páginas y animaciones de tarjetas, que respeta `prefers-reduced-motion` y la opción de reducir animaciones en Ajustes.
- **Privacidad y datos**: exportar e importar JSON, descargar copia y borrar todo, con confirmación.

## Lo que no hace

> [!IMPORTANT]
> - **No hay autoguardado de entradas.** Mientras escribes, cada tecla queda en un borrador local, pero el día no entra en el cuaderno hasta que lo guardas tú.
> - **No se analiza tu texto con modelos.** Los resúmenes son plantillas y reglas.
> - **No hay servidores, seguimiento, anuncios ni fuentes remotas.** Nada sale del dispositivo.
> - **El mar no es magia.** Las botellas no viajan a ningún sitio: si vuelven o no se decide con una función determinista a partir del texto, la fecha y el mar elegido.

## Cómo está hecho

```text
JavaScript · Vite · localStorage · Service Worker
Sin dependencias de backend ni de IA
Pruebas de las funciones puras y de pintado (npm test)
```

El build de producción va a `docs/`, que es lo que sirve GitHub Pages. Con `base: './'` y enlaces relativos, funciona tanto en `usuario.github.io/daily-diary/` como en un dominio propio.

## Licencia

El repositorio no declara licencia: no hay fichero `LICENSE` en la raíz ni ninguna mención en el `README.md`. Cuando un proyecto no dice nada, lo que se aplica por defecto es **todos los derechos reservados**: se puede leer, ejecutar, estudiar y adaptar para uso propio, pero no redistribuirlo ni reutilizarlo en otro proyecto sin permiso.

Lo de terceros sí está licenciado: el diario empaqueta en `docs/assets/` las tipografías Fraunces, IBM Plex Mono y Space Grotesk, las tres bajo la SIL Open Font License, aunque el repositorio no incluya el texto de la licencia junto a los archivos.

Si quieres publicar tu propia versión del diario o reutilizar una parte, escríbeme a [jaimegamingpro@gmail.com](mailto:jaimegamingpro@gmail.com) y lo dejamos por escrito.

## Seguir leyendo en el repositorio

Esta guía resume y ordena. Esto es lo que hay en el repositorio, con sus tamaños reales, por si quieres ir a la fuente.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`src/main.js`](https://github.com/jaime-gaming/daily-diary/blob/main/src/main.js) | 179 KB | La aplicación entera: arranque, enrutado, estado y vistas. Es el fichero más grande del repositorio con diferencia |
| [`src/data/constants.js`](https://github.com/jaime-gaming/daily-diary/blob/main/src/data/constants.js) | 25 KB | Las listas de las que bebe el contenido diario: palabras, consejos, temas, hábitos sugeridos, citas, rituales y tonos |
| [`README.md`](https://github.com/jaime-gaming/daily-diary/blob/main/README.md) | 13 KB | La presentación, el diagrama de estructura y las convenciones |
| [`vite.config.js`](https://github.com/jaime-gaming/daily-diary/blob/main/vite.config.js) | 2 KB | El build y el servidor de desarrollo |
| [`index.html`](https://github.com/jaime-gaming/daily-diary/blob/main/index.html) | 957 B | El punto de entrada |
| [`package.json`](https://github.com/jaime-gaming/daily-diary/blob/main/package.json) | 498 B | Los scripts y las dependencias |
| [`render.yaml`](https://github.com/jaime-gaming/daily-diary/blob/main/render.yaml) | 299 B | El despliegue en Render |

> [!NOTE]
> No hay carpeta `docs/`: el README es toda la documentación del proyecto. Los módulos que su diagrama de estructura no lista están descritos en [Estructura y desarrollo](/daily-diary/dev/).
