---
title: "Uso en la terminal"
icon: "terminal"
order: 30
blurb: "comandos, chat, undo y streaming."
description: "El día a día en la terminal: tareas de un disparo, chat interactivo, undo, streaming y coste."
updated: "2026-10-18"
---

## Tareas de un disparo

`jaigent <prompt>` es la forma corta de `jaigent run <prompt>`: hace una tarea y termina.

```bash
jaigent "¿qué ha cambiado en el último LTS de Node.js? escríbelo en node-lts.md"
jaigent "lee todos los .py de aquí y lista cada comentario TODO"
jaigent "compara las páginas de precios de Vercel y Netlify en pricing.md"
```

Con modificadores:

```bash
jaigent "audita este repo" --workspace ~/projects/api
jaigent "investiga X" --verbose
jaigent "explica este código" -m gpt-4o
jaigent "ejecuta los tests y arregla lo que falle" --allow-shell
```

## Chat interactivo

```bash
jaigent chat
```

Dentro del chat hay comandos con barra:

| Comando | Qué hace |
| --- | --- |
| `/provider groq` | Cambia de backend a mitad de sesión (necesita esa clave) |
| `/compact` | Encoge un hilo largo en un resumen |
| `/memory` | Muestra las notas del proyecto si la memoria está activada |
| `/revert` | Deshace el último cambio de archivos |
| `/diff` | Enseña qué cambió |
| `/checkpoints` | Lista los puntos de restauración |
| `/rewind <id>` | Salta a un punto concreto sin tocar el historial |

## Tabla de comandos

| Comando | Qué hace |
| --- | --- |
| `jaigent init` | Elige proveedor, guarda una clave y la prueba. |
| `jaigent run <prompt>` | Una tarea y sale. |
| `jaigent chat` | Sesión interactiva. |
| `jaigent undo` / `rewind` / `checkpoints` | Revierte cambios de archivos. |
| `jaigent mcp` | Servidor MCP stdio local para clientes de escritorio. |
| `jaigent chatgpt` | Puente MCP remoto con OAuth para ChatGPT Web. |
| `jaigent serve` / `keys` | API compatible con OpenAI y credenciales `jgt-`. |
| `jaigent auth` | Guarda una clave de proveedor (funciona desde cualquier carpeta). |
| `jaigent providers` / `models` / `route` | Backends, catálogo y preview de `auto`/`free`. |
| `jaigent settings` / `config` / `doctor` | Persistir, inspeccionar y diagnosticar. |
| `jaigent skills` / `plugins` / `commands` | Procedimientos, herramientas locales y plantillas con barra. |
| `jaigent schedule` | Ejecuta un prompt con temporizador. |
| `jaigent sessions` | Conversaciones guardadas. |
| `jaigent update` | Actualiza; `--check` solo informa. |
| `jaigent beta` / `feedback` | Canal beta y feedback a los mantenedores. |
| `jaigent tools` | Qué puede llamar el modelo. |
| `jgt` | Alias corto. |

## Deshacer cualquier cosa

Cada llamada que modifica algo se snapshot **antes** del aviso de aprobación, así que un cambio que aprobaste y luego lamentaste es tan reversible como uno que nunca viste.

```console
$ jaigent "ordena los imports de todo el proyecto"
  → edit_file(path='src/app.py')
  → edit_file(path='src/utils.py')

$ jaigent undo
  revert  src/utils.py
✓ reverted 1 file(s) to just now (edit_file src/utils.py)
```

Cada `undo` **consume** el checkpoint que restaura, así que repetirlo retrocede de cambio en cambio. `jaigent rewind <id>` salta a cualquier punto y deja el historial intacto.

Cómo funciona por dentro:

- El almacén está **dirigido por contenido**: los bytes que no cambian se guardan una sola vez.
- Conserva los **últimos 100 checkpoints** y poda los objetos sin referencias.
- **Omite archivos de más de 5 MB.**
- Todo vive en `.jaigent/checkpoints`, dentro del espacio de trabajo.

Se desactiva con `--no-checkpoints`, `JAIGENT_CHECKPOINTS=0` o `jaigent settings set checkpoints false`.

> [!WARNING]
> **No sustituye al control de versiones.** Los checkpoints cubren los archivos que el agente tocó con sus propias herramientas, pero no rastrean los efectos secundarios de `run_command`. Confirma en Git antes de una ejecución grande.

## Streaming y coste

`JAIGENT_STREAM=1` viene activado: la respuesta llega mientras se genera, y los fragmentos se reenvían por el callback `on_text` conforme aparecen. `JAIGENT_SHOW_COST=1` imprime la línea de tokens y coste.

Todo lo que observa el bucle se notifica por callbacks asignables:

| Callback | Cuándo salta | Para qué lo usa el CLI |
| --- | --- | --- |
| `on_tool_start` | Justo antes de ejecutar una herramienta | Nombrar la acción en la línea de estado |
| `on_approval` | Justo antes del aviso de aprobación | Pausar la animación de estado |
| `on_text` | Con cada fragmento de respuesta | Streaming en pantalla |

Una ejecución detenida pronto por el tope de gasto o por el presupuesto de pasos **lo dice**, y dice qué hacer a continuación. Un turno lento se lee como un turno lento, no como un turno colgado: cada reintento y cada cambio de proveedor se anuncia mientras ocurre.

## Preguntar cuando hace falta

Cuando el modelo de verdad no puede continuar —falta una preferencia, el destino es ambiguo— `ask_user` interrumpe con su propio panel: elige con `↑`/`↓` y Enter, pulsa un dígito para saltar o `Esc` para escribir tu propia respuesta. Una vez contestado, el panel se pliega en una sola línea de resumen para que la transcripción quede compacta.

Donde nadie puede responder (`serve`, horarios, tuberías y MCP) el modelo recibe ese aviso y **continúa con su mejor criterio** en vez de bloquearse para siempre.

## Ajustes persistentes

```bash
jaigent settings set model gpt-4o
jaigent settings set budget 0.50
jaigent settings set memory true
jaigent settings set max_steps 20 --project
jaigent settings list
jaigent settings path
```

Precedencia, cada capa gana a la de abajo:

1. Banderas del CLI
2. Entorno y `.env`
3. `./.jaigent/settings.json`
4. `~/.jaigent/settings.json`
5. Valores por defecto integrados

Los valores se **validan antes de escribir**: `settings set provider notreal` se rechaza, así que un ajuste malo no puede romper todos los comandos siguientes.
