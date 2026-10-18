---
description: "Las cinco áreas de Diario: Hoy, Rutina, Archivo, Progreso y Pensamientos, y los Ajustes."
updated: "2026-10-18"
---

## Hoy

Ánimo, sueño, dedicación, notas, etiquetas, energía, estrés y gratitud.

> [!NOTE]
> **Las notas son opcionales.** Si solo apuntas el ánimo o una cifra, se guarda eso y nada más: el cuaderno no escribe texto por su cuenta.

Las tendencias y los resúmenes usan **reglas locales**. El resumen del día se genera con plantillas `if/else` y frases fijas, sin ningún modelo.

Subrutas: ninguna — es la página principal.

## Rutina

Hábitos, rachas, constancia de **35 días**, contadores y tareas para mañana.

Lo que marcas queda como **cambio pendiente del día**: nada se pierde al cambiar de página, y entra en el cuaderno cuando guardas ese día.

| Subruta | Qué muestra |
| --- | --- |
| `/rutina` | El tablero de hábitos del día |
| `/rutina/semana` | La semana de un vistazo |
| `/rutina/contadores` | Las cifras propias con unidad, meta e icono |
| `/rutina/rachas` | Las rachas y la rejilla de constancia |

### Contadores propios

Se crean en *Ajustes → Contenido* con **unidad, meta e icono**. Máximos: **12 contadores** y **8 partes** de escritura.

El contador del agua usa como meta tu `waterGoal` del perfil; los demás llevan su meta propia. Un contador se queda sin definir si le quitas el título, y las entradas **nunca se rompen** por un número raro en un contador propio: se ignora la cifra.

Hay ocho rótulos de partida (`COUNTERS` en `src/data/constants.js`) y ocho presets de escritura (`PART_PRESETS`). Añadir uno nuevo es, literalmente, un botón en *Ajustes → Contenido*.

## Pensamientos

Un espacio **independiente**, no el tema del cuaderno.

> [!IMPORTANT]
> Las botellas **no muestran ni permiten abrir el texto mientras están a la deriva**: solo se leen al volver. La fecha de regreso **no aparece en pantalla**.

Es la mecánica central del área: soltar un pensamiento y no poder releerlo hasta que vuelva. El parte del día en que la tiraste es una **función determinista de la fecha**, así que viaja dentro de la botella y no necesita red.

| Subruta | Qué muestra |
| --- | --- |
| `/pensamientos` | El mar |
| `/pensamientos/pendientes` | Las botellas a la deriva |
| `/pensamientos/guardados` | Las que volvieron y anclaste |
| `/pensamientos/archivados` | El resto |

El `status` de una botella pasa de `drifting` a `returned` (la marea viva la devolvió) o a `lost` (se hundió) **al abrir el cuaderno**.

## Archivo

Historial y calendario.

- **Historial** — tarjetas con búsqueda y filtro por estado; ver, editar y eliminar con confirmación.
- **Calendario** — los días registrados se marcan con **el color de su estado de ánimo**.

| Subruta | Qué muestra |
| --- | --- |
| `/archivo` | El historial con búsqueda y filtros |
| `/archivo/calendario` | El calendario por colores de ánimo |

## Progreso

Estadísticas y resúmenes.

- **Gráfico SVG adaptable** con escalas explícitas para ánimo y sueño, huecos cuando faltan días y meta de sueño.
- **Cobertura real**: sin contar días futuros. Media y mediana. Ignora las métricas opcionales no registradas y evita duplicar días.
- **Tendencias** que comparan **medianas** y exigen más datos antes de sugerir asociaciones. **Nunca causalidad.**
- **Tu semana / Resumen del mes** — promedios, totales, mejores y peores días, rachas y un texto automático por plantillas.

| Subruta | Qué muestra |
| --- | --- |
| `/progreso` | Las estadísticas generales |
| `/progreso/semana` | Tu semana |
| `/progreso/mes` | El resumen del mes |

> [!NOTE]
> Las tendencias comparan medianas en vez de medias para que un día extremo no invente una pauta, y exigen más datos antes de sugerir nada. Es una decisión deliberada: un cuaderno que te dice que duermes peor porque estudias más está inventando una causalidad que no puede conocer.

## Ajustes

Perfil, apariencia, contenido y datos. Permite elegir temas, añadir campos y crear contadores con unidad, meta e icono.

| Subruta | Qué controla |
| --- | --- |
| `/ajustes` | Perfil y generales |
| `/ajustes/apariencia` | Temas y movimiento |
| `/ajustes/contenido` | Partes de escritura y contadores propios |
| `/ajustes/datos` | Exportar, importar, descargar copia, borrar todo y días a medias |

### Movimiento

Transiciones entre páginas y animaciones de tarjetas. Respeta **`prefers-reduced-motion`** y la opción de reducir animaciones en Ajustes.

### Móvil

Cabecera compacta, acceso a Ajustes y navegación inferior con espacio para las **áreas seguras del dispositivo**.
