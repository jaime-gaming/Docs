---
description: "Estructura de carpetas, módulos y pruebas de Diario."
updated: "2026-10-18"
---

## Estructura

```text
src/
├── components/
│   ├── ui.js             # piezas de interfaz (calendario, gráfico SVG, iconos…)
│   ├── ocean.js          # el mar: agua, botellas que flotan, ficha y modal
│   └── habits.js         # rutina: tablero de hábitos, rejilla de constancia, contadores
├── data/constants.js     # estados de ánimo, etiquetas y las piezas que se pueden personalizar
├── utils/
│   ├── dates.js          # fechas, número de día, semanas, meses, calendario
│   ├── routes.js         # rutas, subpáginas, URL y base del sitio
│   ├── stats.js          # métricas, mediana, cobertura, rachas y tendencias
│   ├── ocean.js          # mareas, clima, sorteo del viaje y estado de cada botella
│   ├── drafts.js         # los borradores: que nada se quede a medias
│   ├── pendingDay.js     # los cambios de un día que aún no están en el cuaderno
│   └── storage.js        # validar, guardar, cargar, borrar, exportar, importar
├── styles/
│   ├── main.css          # identidad de papel, portada, diario, rutina, archivo, progreso
│   ├── sea.css           # el mar y sus animaciones (agua, orilla, botellas, chapuzón)
│   └── motion.css        # sistema de movimiento, barra lateral y transiciones de vista
└── main.js               # navegación (Hoy · Archivo · Rutina · Progreso · Pensamientos · Ajustes) y las vistas
public/                   # icono, manifest y service worker offline
tests/                    # pruebas de las funciones puras y de pintado (npm test)
```

## La separación que sostiene el proyecto

La frontera importante está entre `utils/` y `components/`:

| Capa | Qué es | Por qué importa |
| --- | --- | --- |
| `utils/` | **Funciones puras**: fechas, estadísticas, mareas, borradores, almacenamiento | Se pueden probar sin navegador ni DOM |
| `components/` | **Pintado**: interfaz, mar, hábitos | Se prueban comprobando qué pintan |
| `data/constants.js` | Las piezas personalizables | Un solo sitio donde viven ánimos, etiquetas y presets |
| `styles/` | Tres hojas separadas por tema | `main.css` identidad, `sea.css` el mar, `motion.css` movimiento |

Los tres módulos de `utils/` que resuelven los problemas propios de este proyecto:

- **`drafts.js`** — que nada se quede a medias. Gestiona `diario.drafts.v1` y la regla de que un borrador solo se recupera si es más reciente que lo guardado.
- **`pendingDay.js`** — los cambios de un día que aún no están en el cuaderno. Gestiona el parche de `diario.pendiente-dia.v1` y su fusión con la entrada guardada.
- **`stats.js`** — métricas, mediana, cobertura, rachas y tendencias. Aquí vive la decisión de comparar medianas y exigir más datos antes de sugerir asociaciones.

Y el que hace posible que el mar no necesite red:

- **`ocean.js`** — mareas, clima, sorteo del viaje y estado de cada botella, todo como **función determinista** del texto, la fecha y el mar elegido.

## Validación defensiva

`storage.js` no solo guarda y carga: **valida**. `validateEntry` limpia y rechaza lo que no conoce, así que una entrada con campos inesperados no puede corromper el cuaderno ni romper el pintado.

Lo mismo ocurre con los contadores propios: un número raro en un contador se **ignora** en vez de romper la entrada. Y quitar una parte o un contador no borra nada: solo deja de pintarse, y lo ya escrito sigue en cada día por si vuelves a ponerla.

## Rutas

`routes.js` gestiona rutas, subpáginas, URL y la base del sitio. El build genera una página estática por cada ruta, así que los enlaces directos funcionan en hosting estático y Atrás y Adelante funcionan de verdad.

La base relativa (`base: './'` en Vite) es lo que permite que el mismo build funcione en `usuario.github.io/daily-diary/` y en un dominio propio sin recompilar.

## Movimiento

`motion.css` contiene el sistema de movimiento completo: barra lateral y transiciones de vista. Respeta dos cosas a la vez:

1. **`prefers-reduced-motion`** del sistema operativo.
2. **La opción de reducir animaciones** en Ajustes.

## Pruebas

```bash
npm test
```

La suite cubre dos cosas distintas:

| Qué | Cómo |
| --- | --- |
| **Funciones puras** | Fechas, número de día, semanas, meses, mediana, cobertura, rachas, tendencias, mareas, sorteo del viaje, borradores, parches y validación de almacenamiento |
| **Pintado** | Que las vistas pintan lo que deben con unos datos dados |

## Build y despliegue

```bash
npm run dev      # http://localhost:5173
npm run build    # genera docs/ (el build de producción)
npm run preview  # sirve el build localmente
```

`docs/` incluye `.nojekyll` para que GitHub Pages sirva los assets tal cual. El despliegue completo está en [Instalación y uso](/daily-diary/install/).

## Convenciones que conviene mantener

- **Nada de red.** Ninguna fuente remota, ninguna API, ningún modelo. Si una función necesita algo de fuera, está rompiendo la promesa del proyecto.
- **Determinismo donde haya suerte.** El mar se decide con una función determinista guardada en `localStorage`, no con aleatoriedad que cambie al recargar.
- **Versionar las claves.** Cada clave lleva `.v1` en el nombre para poder migrar sin romper cuadernos existentes.
- **Las notas son opcionales.** Ninguna vista debe exigir texto para guardar un día.
