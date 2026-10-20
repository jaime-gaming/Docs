---
title: "Skills, plugins & schedules"
icon: "puzzle"
order: 60
blurb: "extending it with local files."
description: "Extending jAIgent with local files: Markdown skills, Python plugins, custom commands and schedules."
updated: "2026-10-18"
---

The four ways to extend jAIgent are local files you can commit to Git. None of them downloads anything from the network.

| Mechanism | What it is | Does it run code? |
| --- | --- | --- |
| **Skills** | Markdown procedures | No: it is prompt text |
| **Plugins** | Local Python registering tools | **Yes** |
| **Commands** | Slash prompt templates | No |
| **Schedules** | A prompt on a timer | Runs the agent |

## Skills

A skill is a saved procedure: Markdown you write once and the agent reuses. **Only the one-line description goes into the system prompt.** The body is fetched with `load_skill` when the model decides it is relevant, so a large library costs almost nothing in context.

```bash
jaigent skills new changelog -d "Write a release changelog from git history"
jaigent skills list
jaigent skills show changelog
```

That creates `.jaigent/skills/changelog.md`:

```markdown
---
name: changelog
description: Write a release changelog from git history.
---

Read the git log since the last tag, group the commits by type, and write
the result to CHANGELOG.md following Keep a Changelog.
```

**Two skills ship built in**: `spend-cap` (stay cheap before the hard stop) and `compact` (what to keep when the chat is long). They cannot be removed with `jaigent skills remove`.

| Location | Scope |
| --- | --- |
| `./.jaigent/skills` | Project. Commit them. |
| `~/.jaigent/skills` | User, with `--user`. |

A project skill **shadows** a user skill of the same name. Loading a skill never executes code.

## Plugins

A plugin is local Python that registers extra tools. Unlike skills, plugins **are** code: only files you put in `.jaigent/plugins` (project) or `~/.jaigent/plugins` (personal) are loaded, **never anything from the network**. `register()` receives redacted settings: `api_key` is always `None`.

```bash
jaigent plugins new wordcount
jaigent plugins list
jaigent plugins remove wordcount
```

The starter file:

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

Plugin tools are `read_only=False` **by default**. Set `read_only=True` only when the plugin is guaranteed not to mutate files or state: then it stays available under `jaigent serve --read-only` and advertises an accurate MCP read-only hint.

> [!WARNING]
> `read_only` is **a declaration, not a sandbox**. A plugin can do whatever it wants inside the process.

A broken plugin is **skipped** so it cannot take down a run. Turn them all off with `JAIGENT_PLUGINS=0`.

## Custom commands

A Markdown prompt template becomes `/review` in chat and `jaigent /review` in the shell.

```bash
jaigent commands new review -d "Review the working tree" \
  --template 'Run git diff, then review $ARGUMENTS for correctness first, style second.'
```

`$ARGUMENTS` is replaced by whatever you type after the command.

## Schedules

Run a prompt on a timer. Approval is forced to `auto` because nobody is there to answer.

```bash
jaigent schedule add "check my repos for failing CI and write status.md" --every 2h
jaigent schedule add "summarise today's commits" --every "daily at 18:00"
jaigent schedule list
jaigent schedule run              # anything due — safe for cron
jaigent schedule run --watch
jaigent schedule pause task-1
jaigent schedule show task-1
```

Supported intervals: `30m`, `every 2h`, `hourly`, `daily`, `daily at 09:00` and `weekly`. Each task remembers its workspace and its model, and records the last result.

With cron:

```cron
*/15 * * * * cd ~/project && jaigent schedule run >> ~/.jaigent/cron.log 2>&1
```

The task store lives in `JAIGENT_SCHEDULE_FILE`, by default `$JAIGENT_HOME/schedules.json`.

## Adding your own tool

Two paths depending on what you need:

**Without writing Python** — create a skill describing the procedure step by step using the tools that already exist (`web_search`, `fetch_page`, `read_file`, `write_file`, `edit_file`, `search_files`).

**With Python** — create a plugin like the one above and register it in the `ToolRegistry`. The tool then appears in `jaigent tools`, in the local MCP and in the gateway, because all three share the same registry.

> [!TIP]
> Every path goes through `resolve_in_workspace()`. If your tool touches files, use `settings.workspace` as the root and do not accept absolute paths from the model: the sandbox would reject them anyway.
