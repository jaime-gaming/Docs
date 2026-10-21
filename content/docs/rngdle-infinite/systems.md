---
title: "Sistemas y progresión"
icon: "sparkles"
order: 30
blurb: "compañeros, skills, tareas, rebirth, prestige y rollback."
description: "Compañeros, rack de skills, tareas e insignias, rebirth, prestige y rollback: cómo progresa RNGdle Infinite y qué no puede cambiar nada."
updated: "2026-10-18"
---

Seis sistemas sostienen la progresión. Los tres primeros se usan desde el minuto uno; los tres últimos son reinicios que se desbloquean al avanzar.

Antes de entrar en ellos, la regla que los atraviesa a todos: **la tirada es honesta**. Nada de lo que compres puede cambiar la tabla de puntuación, el valor de una insignia ni el rango de un número. Lo que se compra multiplica lo que ganas o acorta lo que esperas.

## Compañeros

**Trece amigos** que multiplican el EP que ganas.

- Se lleva **uno a la vez**.
- Algunos se **encuentran gratis** mientras tiras: no hace falta comprarlos todos.
- Cambiar de compañero es inmediato y no pierde progreso.
- Sus precios, bonificaciones y skills están definidos en `src/pets.js`.

> [!WARNING]
> **Un compañero no hace que tus tiradas tengan más suerte.** Multiplica el EP que ganas, pero tu número y sus insignias siguen siendo exactamente los mismos. Es un multiplicador de ganancias, no de probabilidad.

### Las dos excepciones: Trail y Drift

**Trail y Drift son los únicos compañeros que se salen de la regla anterior**, y lo hacen de una forma muy concreta: **usan su propia muestra aleatoria**. Es decir, no alteran tu número ni su puntuación; generan un resultado adicional aparte, con su propio sorteo.

La distinción importa si estás auditando la economía o escribiendo una prueba: cualquier otro compañero que empezara a tocar la tirada sería un defecto, no una característica.

## Skills

Efectos que se **cargan** y se **disparan en tu próxima tirada**. Entre ellos:

- **EP doble** en la tirada en la que se activan.
- **Tiradas extra**.
- **Sin enfriamiento**.

Dos reglas importantes:

1. **Las skills nunca cambian cómo se puntúa un número.** Afectan a lo que ganas o a cuánto esperas, no a qué insignias tiene tu número. Una skill puede cambiar *cuántos* números se extraen o *cuál* se conserva, y ahí se acaba su alcance.
2. **Solo se cargan mientras estás en línea.** Las tiradas offline pagan su EP y quedan en el historial, pero no cargan skills.

### El rack

Las skills se colocan en un **rack** de huecos, gestionado por `src/rack.js`. Las skills de sorteo planifican sus extracciones a través de `src/draw-plan.js`, que es donde se decide cómo se reparten cuando una tirada implica varios números.

> [!NOTE]
> **Las firmas de compañero ocupan un hueco del rack**, como cualquier otro círculo. No son gratuitas ni van aparte: si equipas una firma, estás gastando un hueco que podrías dedicar a otra skill.

### Números almacenados y multiplicadores

Cuando una tirada guarda varios números, **cada número guardado paga los multiplicadores de skills de cartera, no solo el último**. Es fácil asumirlo al revés, y la diferencia se nota mucho en tiradas con extracciones extra.

Los multiplicadores de cartera, por su parte, **solo multiplican EP ya bancario**: nunca se aplican sobre la puntuación cruda de un número para alterar su rango.

## Marcadores

Los **marcadores están limitados a 3**. Ese techo aparece en tres sitios a la vez y los tres deben coincidir: el README, el chip **«Bookmarks (n/3)»** de la interfaz y las pruebas automáticas.

Si en algún momento vieras un chip marcando otro máximo, sería un defecto: el 3 es una decisión cerrada, no un ajuste pendiente.

## Tareas e insignias

Dos colecciones paralelas:

| Colección | Qué es | Para qué sirve |
| --- | --- | --- |
| **Insignias** | Cada patrón distinto que ha salido en alguno de tus números | Rellenar la colección, que es requisito del prestige |
| **Tareas** | Objetivos concretos que perseguir | Dar dirección a la partida entre reinicio y reinicio |

Las insignias se definen en `src/badges.js` y `src/infinite-badges.js`, con sus familias y sus valores de EP. Cada patrón que tiene tu número —parejas, escaleras, sietes de la suerte y demás— es una insignia, y cada una suma EP.

Completar **media colección** es uno de los dos requisitos del prestige.

## Rebirth

**Empezar de nuevo con una bonificación permanente.**

Es el primer reinicio disponible y el más barato: se pierde el progreso del ciclo a cambio de un multiplicador que se conserva para siempre. Es la forma de desatascar la partida cuando las mejoras del ciclo ya no rinden. La escalera de rebirth vive en `src/rebirth.js`, junto al prestige y al Rollback.

## Prestige

**Un reinicio mayor.** Hace falta cumplir dos condiciones a la vez:

1. Tener **media colección** de insignias.
2. Haber ganado **30 millones de EP en el ciclo**.

El prestige reinicia más cosas que el rebirth y da a cambio una bonificación mayor. Es el escalón central de la progresión larga.

## Rollback

Aparece **después de tres prestigios**, y **se puede repetir**.

Dos matices que se malinterpretan a menudo:

- **Está oculto, no deshabilitado.** Antes del tercer prestigio no se muestra; no es un botón visible pero bloqueado.
- **Arranca desde 0 EP**, sin bonificación inicial. No es un reinicio con ventaja: es un reinicio limpio que puedes volver a hacer.

Es el sistema más avanzado del juego y el que cierra el ciclo largo: una vez desbloqueado, forma parte de la rutina de reinicios en vez de ser una meta única.

## Lo que nunca cambia nada

Hay ajustes que existen para que la partida se sienta mejor sin tocar el juego en sí. Conviene tenerlos separados de lo anterior:

> [!IMPORTANT]
> **Los ajustes de presentación nunca cambian probabilidades, EP, precios ni tiempos.** Son cosméticos por definición. Si uno de ellos alterara la economía, dejaría de ser un ajuste de presentación.

Junto a eso, los **logos** tampoco son intercambiables: la marca nueva del RNG sobre ∞ es solo para el favicon y el icono de la aplicación móvil, y el logo del juego sigue siendo el original, anterior a RNGdle Infinite.

## Cómo encajan

```text
tirar ──► EP ──► mejoras (velocidad)      ┐
              ├─ compañeros (multiplicador)├── ciclo actual
              └─ skills (próxima tirada)   ┘
                       │
              insignias + tareas ──► colección
                       │
                 media colección + 30M EP del ciclo
                       │
                   ┌───┴────┐
               rebirth   prestige ──► ×3 ──► rollback (repetible, desde 0 EP)
```

La lectura práctica: **la velocidad de tirada y los compañeros se pagan solos dentro del ciclo**, mientras que **la colección de insignias es lo que realmente hace avanzar la partida a largo plazo**, porque es el requisito que abre los reinicios mayores.
