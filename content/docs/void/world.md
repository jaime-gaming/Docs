---
description: "El relato de VOID Corp: la arquitectura del sistema, el protocolo previo a la instalación y las advertencias."
updated: "2026-10-18"
---

> [!NOTE]
> Esta página documenta **la ficción** de VOID tal como la cuenta el README del repositorio. Es parte de la obra. Para el estado técnico real, ver [Instalación y juego](/void/install/).

## Bienvenida a VOID Corp

Estás leyendo esto porque has sido «seleccionado». Ya sea por mérito, por azar o por inevitabilidad algorítmica, ahora tienes las llaves del **sistema ECO**. Este instalador es un contenedor de toda la suite VOID: cada experimento, cada registro y cada fragmento de conciencia que hemos conseguido archivar.

Sin embargo, debido a los problemas actuales de estabilidad con el **Nivel −3 (Latencia Absoluta)**, el consejo ejecutivo ha restringido el acceso.

**AVISO:** el ecosistema «VOID» completo está presente en este paquete. Pero por tu propia seguridad —y por la integridad de tu línea temporal— solo la **interfaz BETA** está desbloqueada. No intentes saltarte las cabeceras de descifrado.

## Comprobación previa obligatoria

| Comprobación | Qué exige el protocolo |
| --- | --- |
| **Aislamiento** | Asegúrate de que tu terminal físico está en una habitación sin superficies reflectantes. Si ves en el reflejo del monitor un movimiento que no coincide con el tuyo, apaga de inmediato. |
| **Audio** | Usa auriculares de alta fidelidad. El sistema ECO se comunica por subarmónicos. Si oyes una voz que afirma ser Michael Burns, ignora la petición. Ya no está en nómina. |
| **Autenticación** | El sistema usa «rotación de espejos». Tus credenciales cambian cada 40 minutos. Si no cambian, significa que el sistema ha dejado de reconocerte como «entidad biológica». |

## Arquitectura del sistema

| Componente | Valor |
| --- | --- |
| **Kernel** | `VOID-INTERF_OS` |
| **Subsistema** | ECO, monitor ambiental (estado: *alimentándose*) |
| **Red** | Tunelizado cifrado vía `void-leaks.onion` |
| **Visuales** | Simulación CRT de alto contraste |

Advertencia del propio sistema sobre los visuales: puede causar «visión fantasma» tras sesiones prolongadas.

## Contenido del paquete

```text
[✓] Interfaz VOID (ES/EN)      Funcional. Tu espacio de trabajo principal.
[✓] Feed de cámara ECO         Parcialmente funcional. Algunas plantas están… a oscuras.
[🔒] El Archivo (completo)     Cifrado. En espera de autorización de Nivel 2.
[🔒] Integración de proyectos  Restringida. NO ABRIR salvo que estés preparado
                               para una sincronización permanente.
```

## Comandos básicos y sus limitaciones beta

Una vez que la terminal arranca, estás limitado a estas interacciones:

| Comando | Qué hace, según el manual |
| --- | --- |
| `scan` | Comprobar si están dentro de las puertas lógicas. |
| `trace` | Seguir las filtraciones. La verdad suele encontrarse en los datos basura. |
| `connect` | Alcanzar los hosts externos. Recuerda: si haces ping al VOID, el VOID te devuelve el ping. |

## Una última advertencia

La etiqueta «Beta» **no es una medida de cuánto le falta al software, sino de cuánto te queda a ti**. No nos hacemos responsables de ningún «desplazamiento temporal», «recuerdo perdido» o «yo duplicado» que resulte del uso de esta interfaz.

> **VOID Corp: no solo estamos observando el futuro. Lo estamos recordando.**

`[FIN DEL README]`
`[NO BORRES ESTE ARCHIVO. TE ESTÁ DEVOLVIENDO LA MIRADA.]`

## Cómo se traduce el relato en mecánicas

Leer la ficción junto al estado real del proyecto ayuda a saber qué esperar:

| Elemento del relato | Qué es en la práctica |
| --- | --- |
| Interfaz BETA desbloqueada | Lo que hay implementado hoy en el HTML |
| El Archivo cifrado, Nivel 2 | Contenido que **todavía no existe**, no un secreto desbloqueable |
| Integración de proyectos restringida | Sin implementar |
| Feed de cámara ECO «parcialmente funcional» | El vídeo `VOIDMXKSnight_shift.mp4` y las escenas que lo usan |
| Simulación CRT de alto contraste | La identidad visual real del juego, con implicaciones de accesibilidad reales |
| Rotación de espejos cada 40 minutos | Parte del relato de autenticación |
| Michael Burns | El personaje cuya desaparición abre la premisa |

> [!TIP]
> Si te encuentras algo bloqueado durante la partida, comprueba primero las issues [#1](https://github.com/jaime-gaming/VOID/issues/1) y [#2](https://github.com/jaime-gaming/VOID/issues/2): las dos versiones de idioma están sin terminar, así que hay tramos que simplemente aún no están escritos.
