---
title: "Referencia de tools"
icon: "book"
order: 70
blurb: "tabla de herramientas, variables y modelo de seguridad."
description: "Tabla de herramientas del modelo, variables de entorno, arquitectura interna y modelo de seguridad."
updated: "2026-10-18"
---

Referencia de consulta rápida. Para el contexto de uso, ver [Uso en la terminal](/jaigent/cli/).

## Herramientas

El modelo elige cuáles llamar y en qué orden.

| Herramienta | Para qué sirve |
| --- | --- |
| `web_search` | Buscar en la web: títulos, URLs y fragmentos. |
| `fetch_page` | Descargar una página y reducirla a texto legible. |
| `list_files` | Listar el espacio de trabajo, opcionalmente con glob. |
| `read_file` | Leer un archivo UTF-8 con números de línea; paginado. |
| `write_file` | Crear o sobrescribir un archivo. |
| `edit_file` | Reemplazar un fragmento exacto. |
| `search_files` | Grep por subcadena o regex. |
| `delete_file` | Borrar un archivo o un directorio vacío. |
| `load_skill` | Recuperar el cuerpo de una skill (cuando hay skills). |
| `ask_user` | Hacer una pregunta de aclaración, con selector. |
| `write_todos` | Seguimiento de una tarea multipaso como checklist en vivo. |
| `remember` / `recall` | Memoria del proyecto (solo si `memory` está activada). |
| `run_command` ⚠ | Shell. **Optativo**, ver el modelo de seguridad. |

Las herramientas de archivo **rechazan** `.env`, claves privadas, `*.pem`, `*.key` y cualquier cosa bajo `.git`. `.env.example` sigue siendo legible. Toda ruta pasa por `resolve_in_workspace()`.

## Variables de entorno

Las banderas del CLI sobrescriben las variables.

### Proveedor y modelo

| Variable | Por defecto | Significado |
| --- | --- | --- |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / … | — | Clave del proveedor |
| `JAIGENT_API_KEY` | — | Clave genérica; gana a las específicas de proveedor |
| `JAIGENT_PROVIDER` | `openai` | openai, anthropic, gemini, openrouter, groq, deepseek, mistral, xai, together, ollama |
| `JAIGENT_MODEL` | El del proveedor | Identificador de modelo, o `auto` / `free` |
| `JAIGENT_BASE_URL` | El del proveedor | Raíz de API para gateways compatibles |

### Ejecución

| Variable | Por defecto | Significado |
| --- | --- | --- |
| `JAIGENT_WORKSPACE` | Carpeta actual | Directorio al que se limitan las herramientas de archivo |
| `JAIGENT_MAX_STEPS` | `12` | Presupuesto de llamadas a herramientas por turno |
| `JAIGENT_TEMPERATURE` | `0.2` | Temperatura de muestreo |
| `JAIGENT_MAX_TOKENS` | `2048` | Tokens por turno del asistente |
| `JAIGENT_TIMEOUT` | `60` | Tiempo de espera HTTP en segundos |
| `JAIGENT_APPROVAL` | Según tty | `ask`, `auto` o `dry-run` |
| `JAIGENT_STREAM` | `1` | Emitir la respuesta en streaming |
| `JAIGENT_SHOW_COST` | `1` | Imprimir la línea de tokens y coste |
| `JAIGENT_VERBOSE` | `0` | Trazar las llamadas a herramientas |
| `JAIGENT_SESSION_DIR` | `~/.jaigent/sessions` | Conversaciones guardadas |
| `JAIGENT_PRICES` | — | JSON que sobrescribe la tabla de precios |

### Búsqueda y red

| Variable | Por defecto | Significado |
| --- | --- | --- |
| `JAIGENT_SEARCH_BACKEND` | `duckduckgo` | `duckduckgo` (sin clave) o `tavily` |
| `TAVILY_API_KEY` | — | Necesaria solo para Tavily |
| `JAIGENT_ALLOW_SHELL` | `0` | `1` activa `run_command` |
| `JAIGENT_FAILOVER` | `1` | Reintentar y después cambiar de proveedor |
| `JAIGENT_RETRIES` | `3` | Intentos por proveedor. `1` desactiva el reintento |

### Extensiones y persistencia

| Variable | Por defecto | Significado |
| --- | --- | --- |
| `JAIGENT_SKILLS` | `1` | Cargar skills y ofrecer `load_skill` |
| `JAIGENT_PLUGINS` | `1` | Cargar plugins locales |
| `JAIGENT_CHECKPOINTS` | `1` | Snapshot de archivos antes de cambiarlos |
| `JAIGENT_BUDGET` | `0` | Tope duro en USD por ejecución. `0` lo desactiva |
| `JAIGENT_MEMORY` | `0` | `1` persiste notas en `.jaigent/memory.md` |
| `JAIGENT_AUTO_COMPACT` | `0` | `1` pliega turnos viejos del chat |
| `JAIGENT_MCP_WRITE` | `0` | `1` expone herramientas de escritura en el MCP stdio local |
| `JAIGENT_HOME` | `~/.jaigent` | Ajustes, skills, horarios y `secrets.env` |
| `JAIGENT_SCHEDULE_FILE` | `$JAIGENT_HOME/schedules.json` | Almacén de tareas programadas |
| `JAIGENT_KEYS_FILE` | `$JAIGENT_HOME/keys.json` | Claves del gateway |
| `JAIGENT_NO_UPDATE_CHECK` | — | `1` no comprueba releases nunca |
| `JAIGENT_BETA` | `0` | `1` trae actualizaciones de la rama `beta` |

Las variables del puente de ChatGPT (`JAIGENT_PLUGIN_*`) están en [MCP y tu propia API](/jaigent/mcp/).

## Arquitectura interna

En una frase: **un bucle de agente pide a un proveedor texto o llamadas a herramientas, ejecuta esas llamadas dentro de un sandbox y repite hasta que el modelo responde**, con cada mutación snapshotada, aprobada y reversible.

### El bucle (`agent.py`)

`Agent.run(prompt)` es el producto entero, en una función:

1. **Ruta.** `model="auto"` elige un modelo para este prompt; `model="free"` puede cambiar también de proveedor. Los modelos sin enrutado se saltan este paso.
2. **Construye los mensajes**: prompt del sistema, historial y prompt del usuario.
3. **Llama al proveedor.** La respuesta es texto plano (terminado) o llamadas a herramientas (continuar). Los fragmentos de streaming se reenvían por `on_text` conforme llegan.
4. **Ejecuta cada llamada** con `_execute`: snapshot → comprobación de aprobación → ejecución → añadir el resultado para el modelo.
5. **Repite** hasta que el modelo responde sin llamadas a herramientas, o hasta que se agota el presupuesto de pasos (`max_steps`, 12 por defecto). Entonces se hace **una última llamada sin herramientas**, forzando una respuesta.

### Capas

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| CLI | `cli.py` | Argumentos, terminal y callbacks de estado |
| Agente | `agent.py` | El bucle: ruta, mensajes, ejecución, presupuesto |
| Enrutado | `router.py` | Heurística de `auto` y `free`, sin llamada a LLM |
| Proveedores | `llm/` | Adaptadores por proveedor y `FailoverProvider` |
| Herramientas | `tools/` | Archivos, web, shell, `ask_user` y plugins |
| Registro | `ToolRegistry` | Una sola lista compartida por CLI, MCP y gateway |
| MCP local | `mcp.py` | Expone el registro por stdio |
| Puente ChatGPT | `chatgpt.py` | MCP remoto con OAuth, reutilizando registro y gateway |
| Gateway | `serve` | `/v1/chat/completions` y `/v1/models` |

Un solo `Agent`, un solo registro de herramientas y una sola implementación de aprobación y checkpoints.

## Modelo de seguridad

Los valores por defecto son deliberadamente conservadores.

**Sistema de archivos.** Toda ruta se resuelve y se comprueba contra el espacio de trabajo. Se rechazan los recorridos hacia arriba, las rutas absolutas y los enlaces simbólicos que escapan. Las lecturas se limitan a **1 MB**.

**Shell.** No existe salvo con `--allow-shell` o `JAIGENT_ALLOW_SHELL=1`. Está limitado en tiempo y tiene lista de bloqueo (`rm -rf /`, `sudo`, `format c:`, …).

> [!DANGER]
> Un modelo que puede ejecutar shell **puede esquivar un filtro de cadenas**. Trata la bandera como «confío en este modelo con esta carpeta», no como una protección.

**Undo.** Todo cambio de archivo se snapshot antes. Ver [Uso en la terminal](/jaigent/cli/).

**Red.** `fetch_page` rechaza loopback, enlace local, rangos privados y metadatos de nube (`169.254.169.254`). Los nombres de host se resuelven y **cada redirección se vuelve a comprobar**. Las páginas descargadas siguen siendo entrada no confiable: no combines `--allow-shell` con sitios en los que no confíes.

**Secretos.** Las claves vienen del entorno, de `jaigent auth` / `~/.jaigent/secrets.env` o de un `.env` ignorado por Git, y **nunca se imprimen completas**. Las herramientas de archivo rechazan `.env`, claves privadas y archivos similares aunque estén dentro del espacio de trabajo.

### Recomendación de uso

Ejecuta en una carpeta dedicada, mantenla bajo control de versiones y empieza con `--verbose`.
