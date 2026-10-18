---
description: "Dónde se guarda la partida, cómo enlazar otro dispositivo y qué precauciones tiene el enlace."
updated: "2026-10-18"
---

## Dónde vive la partida

**Tu partida se guarda en tu navegador**, en `localStorage`. No hay cuenta, ni servidor con tu progreso, ni inicio de sesión.

Las consecuencias directas de eso:

| Situación | Qué pasa |
| --- | --- |
| Cambias de navegador | La partida no te sigue: es otro almacenamiento |
| Usas navegación privada | Al cerrar, la partida desaparece |
| Limpias los datos del sitio | Se borra la partida |
| Usas otro dispositivo | Hace falta enlazarlo explícitamente |
| Otra URL del mismo juego | Es otro origen, así que es otra partida |

## Enlazar otro dispositivo

Para jugar en otro dispositivo:

1. Abre **Ajustes → Enlace de dispositivo** en el dispositivo que ya tiene la partida.
2. Abre el enlace, o escanea el **código QR**, en el otro dispositivo.

> [!DANGER]
> **Cualquiera que tenga el enlace puede jugar con tu cuenta.** Mantenlo privado: no lo publiques, no lo pegues en un chat público y no lo compartas en una captura donde se vea.

## Cómo funciona la sincronización

Una vez que dos dispositivos están enlazados **y ambos están abiertos**, se mantienen sincronizados.

El dispositivo que **creó el enlace es el principal**: es el que ejecuta las tiradas y las compras. Así las dos pantallas **nunca se pelean por la misma tirada**.

```text
dispositivo principal ──► ejecuta tiradas y compras
        │
        └──► sincroniza con ──► dispositivo secundario (abierto)
```

Lo que se deduce de ese diseño:

- Con el secundario **cerrado** no hay sincronización en curso; al volver a abrirlo se pone al día.
- Las tiradas y las compras se resuelven en el principal, así que no hay conflictos de escritura entre las dos pantallas.
- El enlace no sube tu partida a ningún servidor: es una conexión directa entre los dos dispositivos.

## Recomendaciones

1. **Trata el enlace como una contraseña.** Es lo que es a efectos prácticos.
2. **Mantén el dispositivo principal como referencia.** Si algo no cuadra entre pantallas, el principal es el que manda.
3. **Ten cuidado al limpiar datos del navegador**: no hay copia en la nube que recuperar.
4. **Si compartes equipo**, recuerda que la partida queda en el perfil del navegador de esa máquina.
