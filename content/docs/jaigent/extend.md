---
title: "Skills, plugins y horarios"
icon: "puzzle"
order: 60
blurb: "ampliarlo con archivos locales."
description: "Ampliar jAIgent con archivos locales: skills en Markdown, plugins en Python, comandos propios y horarios."
updated: "2026-10-18"
---

Las cuatro formas de ampliar jAIgent son archivos locales que puedes confirmar en Git. Ninguna descarga nada de la red.

| Mecanismo | Qué es | ¿Ejecuta código? |
| --- | --- | --- |
| **Skills** | Procedimientos en Markdown | No: es texto de prompt |
| **Plugins** | Python local que registra herramientas | **Sí** |
| **Comandos** | Plantillas de prompt con barra | No |
| **Horarios** | Un prompt con temporizador | Ejecuta el agente |

## Skills

Una skill es un procedimiento guardado: Markdown que escribes una vez y el agente reutiliza. **Solo la descripción de una línea entra en el prompt del sistema.** El cuerpo se recupera con `load_skill` cuando el modelo decide que es relevante, así que una biblioteca grande casi no cuesta contexto.

```bash
jaigent skills new changelog -d "Escribe un changelog de release desde el historial de git"
jaigent skills list
jaigent skills show changelog
```

Eso crea `.jaigent/skills/changelog.md`:

```markdown
---
name: changelog
description: Escribe un changelog de release desde el historial de git.
---

Lee el git log desde la última etiqueta, agrupa los commits por tipo y
escribe el resultado en CHANGELOG.md siguiendo Keep a Changelog.
```

Vienen **dos skills integradas**: `spend-cap` (mantenerse barato antes del tope duro) y `compact` (qué conservar cuando el chat es largo). No se pueden eliminar con `jaigent skills remove`.

| Ubicación | Ámbito |
| --- | --- |
| `./.jaigent/skills` | Proyecto. Confírmalas en Git. |
| `~/.jaigent/skills` | Usuario, con `--user`. |

Una skill de proyecto **sombrea** a una de usuario con el mismo nombre. Cargar una skill nunca ejecuta código.

## Plugins

Un plugin es Python local que registra herramientas adicionales. A diferencia de las skills, los plugins **sí son código**: solo se cargan los archivos que tú pongas en `.jaigent/plugins` (proyecto) o `~/.jaigent/plugins` (personal), **nunca nada de la red**. `register()` recibe ajustes redactados: `api_key` siempre es `None`.

```bash
jaigent plugins new wordcount
jaigent plugins list
jaigent plugins remove wordcount
```

El archivo de arranque:

```python
from jaigent.tools import Tool


def register(registry, settings) -> None:
    def word_count(path: str) -> str:
        from pathlib import Path

        target = Path(settings.workspace) / path
        return f"{len(target.read_text().split())} words"

    registry.register(
        Tool(
            name="word_count",
            description="Count words in a workspace file.",
            parameters={
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
            func=word_count,
            read_only=True,
        )
    )
```

Las herramientas de plugin son `read_only=False` **por defecto**. Pon `read_only=True` solo cuando el plugin tenga garantía de no modificar archivos ni estado: así sigue disponible bajo `jaigent serve --read-only` y anuncia un hint MCP de solo lectura preciso.

> [!WARNING]
> `read_only` es **una declaración, no un sandbox**. Un plugin puede hacer lo que quiera dentro del proceso.

Un plugin roto **se omite** para que no tumbe una ejecución. Se desactivan todos con `JAIGENT_PLUGINS=0`.

## Comandos propios

Una plantilla de prompt en Markdown se convierte en `/review` dentro del chat y en `jaigent /review` en la shell.

```bash
jaigent commands new review -d "Revisa el árbol de trabajo" \
  --template 'Ejecuta git diff y después revisa $ARGUMENTS: primero corrección, luego estilo.'
```

`$ARGUMENTS` se sustituye por lo que escribas detrás del comando.

## Horarios

Ejecutar un prompt con temporizador. La aprobación se fuerza a `auto` porque no hay nadie delante para contestar.

```bash
jaigent schedule add "revisa mis repos en busca de CI fallando y escribe status.md" --every 2h
jaigent schedule add "resume los commits de hoy" --every "daily at 18:00"
jaigent schedule list
jaigent schedule run              # lo que toque: seguro para cron
jaigent schedule run --watch
jaigent schedule pause task-1
jaigent schedule show task-1
```

Intervalos admitidos: `30m`, `every 2h`, `hourly`, `daily`, `daily at 09:00` y `weekly`. Cada tarea recuerda su espacio de trabajo y su modelo, y registra el último resultado.

Con cron:

```cron
*/15 * * * * cd ~/project && jaigent schedule run >> ~/.jaigent/cron.log 2>&1
```

El almacén de tareas vive en `JAIGENT_SCHEDULE_FILE`, por defecto `$JAIGENT_HOME/schedules.json`.

## Añadir tu propia herramienta

Dos caminos según lo que necesites:

**Sin escribir Python** — crea una skill que describa el procedimiento paso a paso usando las herramientas que ya existen (`web_search`, `fetch_page`, `read_file`, `write_file`, `edit_file`, `search_files`).

**Con Python** — crea un plugin como el de arriba y regístralo en el `ToolRegistry`. La herramienta aparece entonces en `jaigent tools`, en el MCP local y en el gateway, porque los tres comparten el mismo registro.

> [!TIP]
> Toda ruta pasa por `resolve_in_workspace()`. Si tu herramienta toca archivos, usa `settings.workspace` como raíz y no aceptes rutas absolutas del modelo: el sandbox las rechazaría igualmente.
