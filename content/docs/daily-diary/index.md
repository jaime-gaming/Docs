---
description: "Qué es Diario, qué lo hace distinto de otras apps de journaling y qué incluye."
updated: "2026-10-18"
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

## Recorrido de la guía

- [Instalación y uso](/daily-diary/install/) — ejecutarlo en local, desplegarlo y el modelo de guardado.
- [Las cinco áreas](/daily-diary/areas/) — Hoy, Rutina, Archivo, Progreso y Pensamientos en detalle.
- [Datos y privacidad](/daily-diary/data/) — las claves de `localStorage`, el formato de una entrada y la copia de seguridad.
- [Estructura y desarrollo](/daily-diary/dev/) — carpetas, módulos y pruebas.
