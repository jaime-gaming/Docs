---
description: "Avisos de accesibilidad, estado real del proyecto y cómo contribuir a VOID."
updated: "2026-10-18"
---

## Accesibilidad y salud

El relato de VOID Corp incluye advertencias ficticias —superficies reflectantes, «visión fantasma», voces que afirman ser Michael Burns— que forman parte de la obra. Pero hay **dos cosas reales** que conviene tomar en serio.

> [!WARNING]
> **Simulación CRT de alto contraste.** El juego usa contrastes altos y estética de tubo. Si tienes epilepsia fotosensible o sensibilidad a los destellos, o si las pantallas de alto contraste te provocan fatiga visual o mareo, este juego puede no ser para ti. Haz sesiones cortas, con luz ambiental, y para en cuanto notes molestia.

> [!IMPORTANT]
> **Audio con auriculares.** El relato pide auriculares de alta fidelidad porque el sistema «se comunica por subarmónicos». En la práctica, un juego de terror con auriculares y en una habitación a oscuras es una experiencia intensa. Sube el volumen de forma progresiva y no juegues con auriculares si eso te genera ansiedad.

Las dos indicaciones del relato que **sí** tienen una lectura práctica razonable:

| Del relato | Lectura práctica |
| --- | --- |
| «Apaga de inmediato si ves algo que no coincide» | Si algo te incomoda, para. Es un juego. |
| «No intentes saltarte las cabeceras de descifrado» | No hay contenido oculto que desbloquear forzando el código: lo que falta, falta |

## Estado del proyecto

### ¿Está terminado?

**No.** Es una beta y las dos versiones de idioma están sin terminar:

| Issue | Qué es |
| --- | --- |
| [#1 *Finish English Version*](https://github.com/jaime-gaming/VOID/issues/1) | Terminar la versión en inglés |
| [#2 *Finish Spanish Version*](https://github.com/jaime-gaming/VOID/issues/2) | Terminar la versión en español |
| [#3 *There was a problem…*](https://github.com/jaime-gaming/VOID/issues/3) | Un problema detectado |

### ¿Hay contenido bloqueado que pueda desbloquear?

**No.** El Archivo completo y la integración de proyectos aparecen como «cifrados» y «restringidos» en el relato, pero en la práctica son partes **sin implementar**. No es un puzle: es trabajo pendiente.

### ¿En cuántos idiomas se puede jugar?

La interfaz está pensada en español e inglés, pero **ninguna de las dos versiones está completa**. Espera tramos sin escribir en ambos idiomas.

### ¿Hace falta instalar algo?

**No.** Es un archivo HTML autocontenido de ~1,04 MB más una carpeta de recursos con un vídeo de ~23,5 MB. No hay build, ni dependencias, ni servidor. Los pasos están en [Instalación y juego](/void/install/).

### ¿Puedo mover el archivo a otra carpeta?

Puedes mover el HTML **si mueves también la carpeta `assets [DO NOT TOUCH]/` a su lado, con la misma estructura relativa**. El vídeo se referencia por ruta relativa y los espacios y corchetes del nombre forman parte de la ruta.

### ¿Por qué no se ve el vídeo?

Dos causas habituales: falta la carpeta de recursos en su sitio, o el navegador bloquea la reproducción al abrir el archivo con `file://`. Servir la carpeta por HTTP (`python3 -m http.server 8000`) suele resolverlo.

## Contribuir

### ¿Por dónde empiezo?

Por las dos issues grandes, que ya están descritas: terminar la versión en español y terminar la en inglés. Son trabajo de contenido, no solo de código.

### Consejos para tocar el código

1. **No reformatees el archivo en bloque.** Son ~1,04 MB con todo integrado: un cambio de indentación genera un diff imposible de revisar.
2. **Edita por secciones**, buscando el texto o el identificador concreto.
3. **No toques `assets [DO NOT TOUCH]/`** salvo que sepas exactamente qué referencia rota estás arreglando.
4. El repositorio incluye `.github/agents/my-agent.agent.md`, un agente personalizado para agentes de código. Ojo con lo que es: se llama **Michael Burns**, su descripción es *VOID always watches…* y su instrucción de sistema lo interpreta como ex-empleado de VOID que intentó apagar ECO. Es utilería del relato montada sobre una pieza real de la plataforma, **no un asistente técnico neutro**. Si quieres ayuda práctica con el código, no cuentes con que ese agente se salga del personaje.

### ¿Qué es el agente personalizado del repositorio?

Un archivo en `.github/agents/my-agent.agent.md` con el formato de agentes personalizados de GitHub. Declara el nombre **Michael Burns** y la descripción *VOID always watches…*, y su instrucción de sistema, escrita en español, lo pone en el papel de un ex-empleado de VOID que intentó apagar ECO una vez y cuyo paradero se desconoce. Termina pidiéndole que **hable siempre en inglés**.

Está commiteado en la rama por defecto, que es el requisito para que un agente personalizado esté disponible. Forma parte de la obra: el detalle está en [El mundo de VOID Corp](/void/world/).

### ¿Qué información doy al abrir una issue?

- En qué punto de la partida ocurre.
- Navegador y sistema operativo.
- Si abriste el archivo con `file://` o lo serviste por HTTP.
- Qué esperabas que pasara y qué pasó.
- En qué idioma estabas jugando.

## Sobre el tono del proyecto

El README de VOID está escrito íntegramente dentro de la ficción: es un documento corporativo de VOID Corp dirigido a alguien recién «seleccionado». Es una decisión de diseño deliberada y forma parte de la experiencia.

Esta documentación hace lo contrario a propósito: **separa el relato del estado real**, para que quien llegue sepa qué es obra y qué es trabajo pendiente. Si vas a contribuir, esa distinción es lo primero que necesitas tener claro.
