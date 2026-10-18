---
description: "Day to day in the terminal: one-shot tasks, interactive chat, undo, streaming and cost."
updated: "2026-10-18"
---

## One-shot tasks

`jaigent <prompt>` is shorthand for `jaigent run <prompt>`: it does one task and exits.

```bash
jaigent "what changed in the latest Node.js LTS? write it to node-lts.md"
jaigent "read all .py files here and list every TODO comment"
jaigent "compare the pricing pages of Vercel and Netlify into pricing.md"
```

With modifiers:

```bash
jaigent "audit this repo" --workspace ~/projects/api
jaigent "research X" --verbose
jaigent "explain this code" -m gpt-4o
jaigent "run the tests and fix what fails" --allow-shell
```

## Interactive chat

```bash
jaigent chat
```

Inside chat there are slash commands:

| Command | What it does |
| --- | --- |
| `/provider groq` | Switches backend mid-session (needs that key) |
| `/compact` | Shrinks a long thread into a summary |
| `/memory` | Shows project notes once memory is on |
| `/revert` | Undoes the last file change |
| `/diff` | Shows what changed |
| `/checkpoints` | Lists the restore points |
| `/rewind <id>` | Jumps to a specific point without touching history |

## Command table

| Command | What it does |
| --- | --- |
| `jaigent init` | Pick a provider, store a key and test it. |
| `jaigent run <prompt>` | One task, then exit. |
| `jaigent chat` | Interactive session. |
| `jaigent undo` / `rewind` / `checkpoints` | Revert file changes. |
| `jaigent mcp` | Local stdio MCP server for desktop clients. |
| `jaigent chatgpt` | Remote MCP bridge with OAuth for ChatGPT Web. |
| `jaigent serve` / `keys` | OpenAI-compatible API and `jgt-` credentials. |
| `jaigent auth` | Store a provider API key (works from any directory). |
| `jaigent providers` / `models` / `route` | Backends, catalogue and `auto`/`free` preview. |
| `jaigent settings` / `config` / `doctor` | Persist, inspect and diagnose. |
| `jaigent skills` / `plugins` / `commands` | Procedures, local tools and slash templates. |
| `jaigent schedule` | Run a prompt on a timer. |
| `jaigent sessions` | Saved conversations. |
| `jaigent update` | Upgrade; `--check` only reports. |
| `jaigent beta` / `feedback` | Beta channel and feedback to the maintainers. |
| `jaigent tools` | What the model can call. |
| `jgt` | Short alias. |

## Undo anything

Every mutating call is snapshotted **before** the approval prompt, so a change you approved and then regretted is just as reversible as one you never saw.

```console
$ jaigent "tidy up the imports across the project"
  → edit_file(path='src/app.py')
  → edit_file(path='src/utils.py')

$ jaigent undo
  revert  src/utils.py
✓ reverted 1 file(s) to just now (edit_file src/utils.py)
```

Each `undo` **consumes** the checkpoint it restored, so repeating it walks back one change at a time. `jaigent rewind <id>` jumps to any point and leaves history alone.

How it works underneath:

- The store is **content-addressed**: unchanged bytes are stored once.
- It keeps the **last 100 checkpoints** and prunes unreferenced objects.
- It **skips files over 5 MB.**
- Everything lives in `.jaigent/checkpoints`, inside the workspace.

Turn it off with `--no-checkpoints`, `JAIGENT_CHECKPOINTS=0` or `jaigent settings set checkpoints false`.

> [!WARNING]
> **Not a substitute for version control.** Checkpoints cover files the agent touched through its own tools, but they do not track `run_command` side effects. Commit before a big run.

## Streaming and cost

`JAIGENT_STREAM=1` ships enabled: the answer arrives as it is generated, and chunks are forwarded through the `on_text` callback as they appear. `JAIGENT_SHOW_COST=1` prints the token and cost line.

Everything the loop observes is reported through assignable callbacks:

| Callback | When it fires | What the CLI uses it for |
| --- | --- | --- |
| `on_tool_start` | Just before a tool runs | Naming the action on the status line |
| `on_approval` | Just before an approval prompt | Pausing the status animation |
| `on_text` | With each answer chunk | Streaming to screen |

A run stopped early by the spend cap or the step budget **says so**, and says what to do next. A slow turn reads as a slow turn, not as a stuck one: every retry and every provider switch is announced as it happens.

## Asking when it is needed

When the model genuinely cannot proceed — a missing preference, an ambiguous target — `ask_user` interrupts with its own panel: pick an answer with `↑`/`↓` and Enter, press a digit to jump, or `Esc` to type your own. Once answered, the panel collapses into a single summary line so the transcript stays compact.

Where nobody can answer (`serve`, schedules, pipes and MCP) the model is told so and **proceeds with its best judgment** instead of blocking forever.

## Persistent settings

```bash
jaigent settings set model gpt-4o
jaigent settings set budget 0.50
jaigent settings set memory true
jaigent settings set max_steps 20 --project
jaigent settings list
jaigent settings path
```

Precedence, each layer winning over the one below:

1. CLI flags
2. Environment and `.env`
3. `./.jaigent/settings.json`
4. `~/.jaigent/settings.json`
5. Built-in defaults

Values are **validated before writing**: `settings set provider notreal` is rejected, so a bad setting cannot break every later command.
