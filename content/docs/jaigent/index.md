---
description: "Qué es jAIgent, en qué se diferencia de otros agentes y cómo encajan sus piezas."
updated: "2026-10-18"
---

**jAIgent** es un agente de IA de línea de comandos con una idea clara: **un binario, diez proveedores y las mismas herramientas en todas partes**. Terminal, ChatGPT Web por MCP remoto, Claude Desktop por stdio local y cualquier aplicación que hable el SDK de OpenAI.

> [!NOTE]
> Esta fuente prepara la versión **0.5.7**; **0.5.6** sigue siendo la última publicada hasta que se libere la siguiente. El historial completo está en `CHANGELOG.md` del repositorio.

## Por qué existe

| Si ya tienes… | jAIgent es el sitio que… |
| --- | --- |
| Claude Code, Cursor o Aider | Busca en la web en vivo y escribe un archivo que puedes deshacer |
| ChatGPT Web o Claude Desktop | Sirve las mismas herramientas por MCP remoto con OAuth o por stdio local, nunca shell |
| Una app con el SDK de OpenAI | `jaigent serve`: una URL, claves `jgt-` cifradas, herramientas incluidas |
| Ollama local o la capa gratuita de Groq | `--model free` para que un saludo no cueste un refactor |
| Varias claves de API | Conmutación por fallo: un 429 en OpenAI continúa en Anthropic y luego en Ollama |

## Lo que de verdad es distinto

**Deshacer es el producto.** Cada escritura se snapshot **antes** del aviso de aprobación. `jaigent undo`, `rewind <id>` y `/revert` existen porque otros agentes te preguntan antes, pero jAIgent además te deja cambiar de opinión después.

**Web y archivos en el mismo bucle.** `web_search` → `fetch_page` → `write_file`. No es un envoltorio de chat ni un codificador limitado a un repositorio.

**Enlaza en vez de sustituir.** MCP remoto con OAuth para ChatGPT Web, MCP stdio local para clientes de escritorio, `serve` para todo lo que hable OpenAI, y skills, plugins y comandos como archivos locales que puedes confirmar en Git.

**Diez proveedores, o ninguno.** OpenAI, Anthropic, Gemini, DeepSeek, Grok, Groq, Mistral, OpenRouter, Together y Ollama. `--model auto` dimensiona el trabajo; `--model free` elige un modelo sin coste al que de verdad puedas llegar.

**Tope de gasto duro.** `jaigent settings set budget 0.50` detiene la ejecución. Skills integradas `spend-cap` y `compact`; `/compact` en el chat; memoria solo si la activas.

**Conservador por defecto.** Sandbox de espacio de trabajo, sin shell salvo que pases `--allow-shell`, archivos de secretos rechazados y sin telemetría. Un solo binario si no quieres Python.

**Lo bastante pequeño para leerse.** El bucle del agente es **una función**. Sin framework.

## Funciones por versión

| Función | Qué hace | Desde |
| --- | --- | --- |
| Bucle del agente | Plan → herramientas → respuesta, con presupuesto de pasos | 0.1.0 |
| Búsqueda y descarga web | DuckDuckGo (sin clave) o Tavily; páginas reducidas a texto | 0.1.0 |
| Herramientas de archivo | Listar, leer, escribir, editar, buscar y borrar dentro del sandbox | 0.1.0 |
| Aprobaciones | `ask`, `auto` y `dry-run` según terminal | 0.2.0 |
| Checkpoints y undo | Snapshot antes de cada cambio y restauración paso a paso | 0.3.0 |
| Enrutado de modelos | `auto` y `free` con heurística local, sin llamada extra | 0.3.0 |
| Conmutación por fallo | Reintento con backoff y salto al siguiente proveedor con clave | 0.3.0 |
| MCP stdio local | El registro de herramientas expuesto a clientes de escritorio | 0.4.0 |
| Gateway OpenAI | `jaigent serve` en `/v1/chat/completions` y `/v1/models` | 0.4.0 |
| Skills y plugins | Procedimientos en Markdown y herramientas en Python local | 0.4.0 |
| Puente ChatGPT Web | MCP remoto por HTTP con OAuth 2.1 | 0.5.0 |
| Horarios | Ejecutar un prompt con temporizador | 0.5.0 |

## Cómo encaja todo

```text
                    CLI (cli.py)       MCP stdio (mcp.py)       gateway (serve)
                       │                    │                        │
                       └──────────────┬─────┴────────────────────────┘
                                      │    Agent (agent.py)
                                      │  ┌─────────────────────────────┐
                                      │  │ route → proveedor → tools…  │
                                      │  └────────┬─────────────┬──────┘
                                      │           │             │
                             FailoverProvider   ToolRegistry
                                      │           │
                         adaptadores llm/     tools/ (archivos, web,
                         (openai, etc.)       shell, ask, plugins)

              ChatGPT Web → chatgpt.py (MCP OAuth) ──┬── registro de herramientas existente
                                                     └── API /v1 del gateway → Agent
```

Un solo `Agent`, un solo registro de herramientas y una sola implementación de aprobación y checkpoints. El CLI y el gateway compatible con OpenAI conducen el mismo bucle; el MCP local expone el registro; el puente entrante de ChatGPT compone ese mismo registro para llamadas directas y delega los turnos completos de agente o sesión a través del gateway existente. **No crea un segundo agente ni duplica la lógica de las herramientas.**

Los detalles están en [Arquitectura y seguridad](/jaigent/reference/).

## Empezar en cuatro comandos

```bash
jaigent init                          # elige proveedor, pega una clave, pruébala
jaigent "resume README.md en overview.md"
jaigent undo                          # devuelve overview.md si no te gusta
jaigent chat                          # y sigue de forma interactiva
```

`jgt` es un alias más corto del mismo comando.

## Recorrido de la guía

- [Instalación y claves](/jaigent/install/) — binario, PyPI o fuente, y cómo conseguir una clave.
- [Uso en la terminal](/jaigent/cli/) — comandos, chat, undo y streaming.
- [Modelos y proveedores](/jaigent/models/) — `auto`, `free` y conmutación por fallo.
- [MCP y tu propia API](/jaigent/mcp/) — conectar ChatGPT Web, Claude Desktop y tus apps.
- [Skills, plugins y horarios](/jaigent/extend/) — ampliarlo con archivos locales.
- [Referencia de tools](/jaigent/reference/) — tabla de herramientas, variables y modelo de seguridad.
