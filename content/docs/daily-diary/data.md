---
description: "Las claves de localStorage, el formato exacto de una entrada, las listas personalizables y la privacidad."
updated: "2026-10-18"
---

## Las claves del almacenamiento

Todo vive en `localStorage`. Cinco claves, cada una con su versión en el nombre:

| Clave | Qué guarda |
| --- | --- |
| `diario.entries.v1` | Las entradas guardadas: el cuaderno |
| `diario.drafts.v1` | Los borradores de texto mientras escribes |
| `diario.pendiente-dia.v1` | Los cambios de un día que aún no está en el cuaderno |
| `diario.setup.v1` | Tus listas personalizables: `counters` y `parts` |
| `diario.thoughts.v1` | Las botellas del mar |

## Una entrada

Cada entrada se guarda como JSON en `diario.entries.v1`:

```json
{
  "id": "…",
  "date": "2026-09-30",
  "dayNumber": 27,
  "mood": 4,
  "sleepHours": 7.5,
  "studyHours": 2,
  "energy": 3,
  "stress": 2,
  "bestOfDay": "…",
  "differentToday": "…",
  "generalDay": "…",
  "tomorrow": "…",
  "wordOfDay": "…",
  "capsule": "…",
  "gratitude": ["…", "…", "…"],
  "goals": ["…"],
  "tags": ["…"],
  "counters": { "water": 6, "ejercicio": 30, "p-31": 2 },
  "parts": { "p-12": "lo que escribiste en tu propia parte del día" },
  "habits": { "h-3": true, "h-7": false },
  "createdAt": "…",
  "updatedAt": "…"
}
```

El **número de día** se calcula automáticamente desde la fecha de la primera entrada.

> [!IMPORTANT]
> Lo que no está en esa lista **no se guarda**: `validateEntry` limpia y rechaza lo que no conoce. Es una defensa deliberada contra datos corruptos o inesperados.

## Los borradores

Los textos a medias viven aparte, en `diario.drafts.v1`:

```json
{ "entrada:2026-10-04": { "data": { "generalDay": "lo que estaba escribiendo…" }, "savedAt": "…" } }
```

Un borrador solo se recupera si es **más reciente** que lo ya guardado, así que nunca te devuelve texto viejo ni duplica nada.

## Los cambios pendientes

Los cambios que aún no son una entrada viven en `diario.pendiente-dia.v1`, como un parche por día:

```json
{
  "2026-10-04": {
    "patch": { "habits": { "h-3": true }, "counters": { "water": 6 }, "tomorrow": "Repasar tema" },
    "savedAt": "…"
  }
}
```

El parche se funde con la entrada guardada para pintar el día completo, y se escribe en el cuaderno al pulsar «Guardar día». **Un valor vacío también es un cambio**: borrar un texto, poner un contador a cero o desmarcar un hábito se guardan igual que cualquier otra cosa. En la copia JSON viaja como `pendingDays`.

## Las listas que puedes cambiar tú

En `diario.setup.v1` viven dos arrays que definen qué se pinta cada día. `counters` son las cifras de la Rutina y `parts`, las partes de la entrada:

```json
{
  "counters": [
    { "key": "p-31", "label": "Flexiones", "unit": "repeticiones", "min": 0, "max": 200, "step": 10, "goal": 50, "icon": "flame" }
  ],
  "parts": [
    { "key": "p-12", "label": "Cabeza", "hint": "lo que no te deja pensar en otra cosa", "type": "text" },
    { "key": "p-8",  "label": "Mañana", "hint": "", "type": "line" }
  ]
}
```

- `type` es `text` (párrafo en la página de hoy) o `line` (una línea, como la palabra del día).
- `key` la genera el propio cuaderno (`p-<n>`), y es la misma que verás en `entry.parts` y `entry.counters`. Por eso **quitar una parte o un contador no borra nada**: solo deja de pintarse, y lo ya escrito y las cifras apuntadas siguen en cada día por si vuelves a ponerla.
- **Máximos: 8 partes y 12 contadores.**
- Hay ocho rótulos de partida (`COUNTERS` en `src/data/constants.js`) y ocho presets de escritura (`PART_PRESETS`).

## Las botellas

Los pensamientos viajan en `diario.thoughts.v1`:

```json
{
  "id": "…",
  "text": "Un pensamiento suelto",
  "castAt": "2026-10-04",
  "mood": 3,
  "sea": "breeze",
  "returns": true,
  "driftDays": 18,
  "arriveOn": "2026-10-22",
  "lostOn": null,
  "speed": 21,
  "current": "la corriente fría",
  "glass": "amber",
  "status": "drifting",
  "returnedAt": null,
  "reply": "",
  "weather": "wind",
  "wind": "poniente",
  "windSpeed": 19,
  "seen": false
}
```

| Campo | Qué significa |
| --- | --- |
| `status` | `drifting`, `returned` (la marea viva la devolvió) o `lost` (se hundió), decidido **al abrir el cuaderno** |
| `reply` / `kept` | Tu respuesta y si la anclaste |
| `weather`, `wind`, `windSpeed`, `push` | La firma del día en que la soltaste: explican por qué tardó lo que tardó, y nada más |
| `seen` | Si ya la leíste al volver |

**Nunca sale del dispositivo.**

## Privacidad

Todo ocurre en tu dispositivo: **no hay servidores, seguimiento, anuncios, fuentes remotas ni inteligencia artificial de ningún tipo**. Los textos nunca se analizan con modelos; solo se muestran tal cual los escribiste.

El mar tampoco es magia: las botellas no viajan a ningún sitio. Si vuelven o no se decide con una **función determinista** (`src/utils/ocean.js`) a partir del texto, la fecha y el mar elegido, y el resultado se guarda en tu `localStorage`. Nadie más puede leerlas, y tus pensamientos no se pierden si cambias de dispositivo: **viajan dentro de tu copia de seguridad**.

### Tu copia de seguridad

Desde *Ajustes → Datos*:

- **Exportar JSON** — la copia completa, incluidas las botellas y los días pendientes.
- **Importar JSON** — restaurarla en otro navegador o dispositivo.
- **Descargar copia** — el archivo a disco.
- **Borrar todo** — con confirmación.
- **Días a medias** — terminarlos o descartarlos.

> [!WARNING]
> Como todo vive en `localStorage`, limpiar los datos del sitio o navegar en privado borra el cuaderno. La única protección real es **exportar la copia** de vez en cuando.
