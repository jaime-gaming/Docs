---
title: "Desarrollo"
icon: "code"
order: 90
blurb: "el entorno, cómo está organizado el código, el servidor de simulación y los workflows."
description: "Desarrollo de jAIgent: el entorno, cómo está organizado el código, cómo probarlo sin gastar tokens y el estado real de los workflows y las releases."
updated: "2026-10-19"
---

Página para quien va a tocar el código. El repositorio trae material de sobra para ello —[`docs/architecture.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/architecture.md), [`CONTRIBUTING.md`](https://github.com/jaime-gaming/jAIgent/blob/main/CONTRIBUTING.md) y un [`AGENTS.md`](https://github.com/jaime-gaming/jAIgent/blob/main/AGENTS.md) de 15 KB con las convenciones completas— y esto recoge lo que hace falta saber antes de empezar.

## El entorno de desarrollo

```bash
pip install -e ".[dev]"
pytest
ruff check . && ruff format .
mypy
bandit -r src/jaigent -ll
pip-audit
```

> [!TIP]
> **La suite es offline.** No necesita red, ni tokens, ni una clave de API configurada. Quien llega nuevo al código debe empezar por `docs/architecture.md`, que recorre el conjunto en una sola página, y seguir por `agent.py`.

## Cómo está organizado el código

| Ruta | Qué es |
| --- | --- |
| `src/jaigent/agent.py` | El bucle de llamadas a herramientas. 21 KB |
| `src/jaigent/cli.py` | La interfaz de terminal. **163 KB, el fichero más grande del proyecto con diferencia** |
| `src/jaigent/chatgpt.py` | El puente HTTP entrante protegido por OAuth hacia el gateway existente. 46 KB |
| `src/jaigent/mcp.py` | El núcleo JSON-RPC de MCP y el transporte stdio |
| `src/jaigent/config.py` | La configuración |
| `src/jaigent/memory.py` | Las notas opcionales del proyecto |
| `src/jaigent/plugins.py` | Los plugins de herramientas locales |
| `src/jaigent/branding.py` | El wordmark naranja de jAI |
| `src/jaigent/data/skills/` | Los dos skills integrados: tope de gasto y compactado |
| `src/jaigent/llm/` | Los adaptadores de proveedor |
| `src/jaigent/tools/` | Espacio aislado, ficheros, web y shell |

Son **45 módulos `.py`** bajo `src/jaigent/` y **55 ficheros de pruebas** en `tests/`. Las pruebas más grandes dicen dónde está el riesgo: `test_cli_interactive.py` (62 KB), `test_updater.py` (55 KB) y `test_regressions.py` (37 KB).

## Probarlo sin gastar tokens

`examples/mock_llm_server.py` (5,9 KB) es un servidor diminuto compatible con OpenAI pensado exactamente para eso. **Ignora la inteligencia del modelo y reproduce un plan fijo**: listar el espacio de trabajo, escribir un resumen y responder. Admite peticiones con y sin streaming, así que ejercita los mismos caminos de código que un proveedor real.

```bash
python examples/mock_llm_server.py            # escucha en :8000
```

Y en otra terminal:

```bash
JAIGENT_BASE_URL=http://localhost:8000/v1 \
JAIGENT_API_KEY=not-a-real-key \
jaigent "summarise notes.md into summary.md" --verbose
```

> [!NOTE]
> La clave `not-a-real-key` no es un descuido: el servidor de simulación no la valida. Sirve para comprobar el flujo completo —aprobaciones, checkpoints, streaming, herramientas— sin que cueste dinero.

`examples/basic_usage.py` (4,8 KB) es la otra cara: cómo usar jAIgent **desde Python**, con una clave real de por medio.

## Los workflows y las releases

Lo que hay alrededor de la integración continua:

| Fichero | Tamaño | Qué es |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](https://github.com/jaime-gaming/jAIgent/blob/main/.github/workflows/ci.yml) | — | La suite en varias plataformas |
| [`.github/workflows/release.yml`](https://github.com/jaime-gaming/jAIgent/blob/main/.github/workflows/release.yml) | — | Construcción de binarios y publicación |
| [`docs/ci-and-releases.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/ci-and-releases.md) | 7 KB | Los jobs de CI, cómo cortar una release, publicar en PyPI y republicar una etiqueta |
| [`tests/test_workflows.py`](https://github.com/jaime-gaming/jAIgent/blob/main/tests/test_workflows.py) | 22 KB | Pruebas de regresión **de los propios workflows** |
| [`scripts/activate-ci.sh`](https://github.com/jaime-gaming/jAIgent/blob/main/scripts/activate-ci.sh) | 7 KB | Coloca los workflows donde GitHub los lee y mantiene honestas sus rutas |
| [`packaging/workflow-fixes-v0.5.1.patch`](https://github.com/jaime-gaming/jAIgent/blob/main/packaging/workflow-fixes-v0.5.1.patch) | 3 KB | El parche con las reparaciones, para aplicarlo a mano |
| [`docs/workflow-repair-v0.5.1.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/workflow-repair-v0.5.1.md) | 4,5 KB | El registro de por qué hicieron falta |

En `packaging/` están además los dos instaladores (`install.sh` e `install.ps1`), la receta de PyInstaller (`jaigent.spec`), un lanzador (`launcher.py`), el generador de iconos (`make_icon.py`) y las imágenes de las que derivan.

### Por qué existe `activate-ci.sh`

GitHub **rechaza cualquier push que cree o edite un fichero bajo `.github/workflows/`** si el token no lleva el ámbito `workflows`. La cuenta de automatización que escribe esos ficheros no lo tiene, así que no podía empujar sus propias correcciones. El script existe para ejecutarlo desde una máquina propia, con credenciales propias, que sí tienen ese ámbito. Es seguro ejecutarlo varias veces: **solo hace commit cuando algo cambió de verdad**.

### Las tres reparaciones, y su estado actual

`docs/workflow-repair-v0.5.1.md` arranca diciendo que `main` trae workflows que fallan en todas las plataformas. **Eso era cierto cuando se escribió; hoy las tres reparaciones están aplicadas en `main`.** Merece la pena saber cuáles fueron, porque las tres son trampas del runner de Windows y no del código:

1. **`ci.yml`, «Smoke test the CLI», fallaba en los dos runners de Windows.** El paso decía `doctor || true`. El shell por defecto en Windows es `pwsh`, y el runner **antepone** `$ErrorActionPreference = 'stop'` a cada paso de pwsh. `doctor` sale con 1 si no hay clave de API, pwsh intentaba entonces ejecutar `true` —que en Windows no es un comando— y el paso abortaba. **Solución aplicada:** el paso va fijado a `shell: bash`, con un comentario que explica por qué.
2. **`release.yml`, «Smoke test the binary (windows)», salía con 1 teniendo un `jaigent.exe` bueno.** El runner **añade al final** `if ((Test-Path -LiteralPath variable:\LASTEXITCODE)) { exit $LASTEXITCODE }` a cada paso de pwsh, y el último comando nativo del paso era `doctor`, que sale con 1 **por diseño**. El paso publicaba ese 1 como propio y el binario se descartaba. **Solución aplicada:** `$PSNativeCommandUseErrorActionPreference = $false` al principio y `exit 0` al final; los `throw` siguen fallando ante problemas reales.
3. **`release.yml`, el job `macos-x64` nunca salía de la cola.** `macos-13` se retiró el 4 de diciembre de 2025 y los jobs sobre imágenes retiradas **se quedan en cola para siempre**. **Solución aplicada:** `macos-15-intel`, el sucesor x86_64 designado por GitHub.

> [!IMPORTANT]
> El documento se lee como un registro, no como una lista de tareas pendientes. Cada reparación tiene su prueba de regresión en `tests/test_workflows.py`.

## Dónde seguir

- [Seguridad](/jaigent/security/) — el modelo de amenazas y las versiones con soporte.
- [Referencia de tools](/jaigent/reference/) — la API de Python y cómo añadir una herramienta propia.
- [Skills, plugins y horarios](/jaigent/extend/) — las cuatro formas de ampliarlo con ficheros locales.
