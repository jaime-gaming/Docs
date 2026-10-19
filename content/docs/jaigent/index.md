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

## Seguir leyendo en el repositorio

Esta guía resume y ordena. El repositorio trae además su propia documentación, y hay un par de archivos que conviene no confundir con funcionalidad existente.

| Documento | Tamaño | Qué es |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/jAIgent/blob/main/README.md) | 59 KB | La presentación del proyecto, muy completa |
| [`CHANGELOG.md`](https://github.com/jaime-gaming/jAIgent/blob/main/CHANGELOG.md) | 66 KB | El registro de cambios, versión a versión |
| [`AGENTS.md`](https://github.com/jaime-gaming/jAIgent/blob/main/AGENTS.md) | 15 KB | El contexto para agentes de código que trabajen sobre el repositorio |
| [`SECURITY.md`](https://github.com/jaime-gaming/jAIgent/blob/main/SECURITY.md) | 12 KB | La política de seguridad |
| [`docs/web-ui-proposal.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/web-ui-proposal.md) | 11 KB | **Una propuesta**, no una función: una interfaz web local |
| [`docs/architecture.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/architecture.md) | 9 KB | La arquitectura |
| [`docs/terminal-ui.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/terminal-ui.md) | 8 KB | La interfaz de terminal |
| [`docs/ci-and-releases.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/ci-and-releases.md) | 7 KB | La integración continua y las releases |
| [`docs/workflow-repair-v0.5.1.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/workflow-repair-v0.5.1.md) | 4 KB | Las reparaciones de flujo de la versión 0.5.1 |
| [`CONTRIBUTING.md`](https://github.com/jaime-gaming/jAIgent/blob/main/CONTRIBUTING.md) | 4 KB | Cómo contribuir |
| [`LICENSE.md`](https://github.com/jaime-gaming/jAIgent/blob/main/LICENSE.md) | 4 KB | El acuerdo de licencia |
| [`integrations/chatgpt/skills/jaigent/SKILL.md`](https://github.com/jaime-gaming/jAIgent/blob/main/integrations/chatgpt/skills/jaigent/SKILL.md) | 2 KB | La skill de la integración con ChatGPT |
| [`src/jaigent/data/skills/spend-cap.md`](https://github.com/jaime-gaming/jAIgent/blob/main/src/jaigent/data/skills/spend-cap.md) | 1 KB | La skill integrada de tope de gasto |
| [`src/jaigent/data/skills/compact.md`](https://github.com/jaime-gaming/jAIgent/blob/main/src/jaigent/data/skills/compact.md) | 1 KB | La skill integrada de compactado |
| [`.github/pull_request_template.md`](https://github.com/jaime-gaming/jAIgent/blob/main/.github/pull_request_template.md) | 1 KB | La plantilla de pull request |

### Dos avisos antes de leerlos

> [!WARNING]
> **`docs/web-ui-proposal.md` es solo una propuesta: no hay ninguna interfaz web implementada.** El propio documento lo dice en su primera línea y recuerda que sigue en la lista de «discutir primero en una issue» de `AGENTS.md` y `CONTRIBUTING.md`. Es material de planificación, no una especificación aprobada.

Las dos skills integradas son **instrucciones, no mecanismos**. Cada una declara en su cabecera cuándo debe cargarse y qué hay que hacer, y el trabajo mecánico lo hace otra parte:

| Skill | Cuándo se carga | Quién hace el trabajo de verdad |
| --- | --- | --- |
| `compact` | Cuando la conversación se alarga o el usuario dice «compact» | `/compact` en el chat, o `auto_compact` en ajustes. La skill solo dice **qué merece la pena conservar** |
| `spend-cap` | Cuando el usuario menciona coste, presupuesto o gasto | El tope duro lo aplica jAIgent cuando `JAIGENT_BUDGET` (o `jaigent settings set budget 0.50`) es mayor que cero. La skill es la parte blanda: gastar menos **antes** de que la ejecución se corte |

La skill de ChatGPT, por su parte, asume un **endpoint MCP remoto por HTTP protegido con OAuth**: no hace que un servidor stdio local sea alcanzable desde ChatGPT Web.

## Recorrido de la guía

- [Instalación y claves](/jaigent/install/) — binario, PyPI o fuente, y cómo conseguir una clave.
- [Uso en la terminal](/jaigent/cli/) — comandos, chat, undo y streaming.
- [Modelos y proveedores](/jaigent/models/) — `auto`, `free` y conmutación por fallo.
- [MCP y tu propia API](/jaigent/mcp/) — conectar ChatGPT Web, Claude Desktop y tus apps.
- [Skills, plugins y horarios](/jaigent/extend/) — ampliarlo con archivos locales.
- [Referencia de tools](/jaigent/reference/) — tabla de herramientas, variables y modelo de seguridad.
- [Seguridad](/jaigent/security/) — qué defiende, qué no defiende a propósito y cómo informar de una vulnerabilidad.
