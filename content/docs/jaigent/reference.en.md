---
description: "Model tools table, environment variables, internal architecture and the safety model."
updated: "2026-10-18"
---

Quick lookup reference. For usage context, see [Using the CLI](/jaigent/cli/).

## Tools

The model chooses which of these to call, and in what order.

| Tool | What it is for |
| --- | --- |
| `web_search` | Search the web: titles, URLs and snippets. |
| `fetch_page` | Download a page and strip it to readable text. |
| `list_files` | List the workspace, optionally by glob. |
| `read_file` | Read a UTF-8 file with line numbers; paginated. |
| `write_file` | Create or overwrite a file. |
| `edit_file` | Replace an exact snippet. |
| `search_files` | Grep by substring or regex. |
| `delete_file` | Delete a file or an empty directory. |
| `load_skill` | Fetch a skill body (when skills exist). |
| `ask_user` | Ask a clarifying question, with a picker. |
| `write_todos` | Track a multi-step task as a live checklist. |
| `remember` / `recall` | Project memory (only if `memory` is on). |
| `run_command` ⚠ | Shell. **Opt-in**, see the safety model. |

File tools **refuse** `.env`, private keys, `*.pem`, `*.key` and anything under `.git`. `.env.example` stays readable. Every path goes through `resolve_in_workspace()`.

## Environment variables

CLI flags override variables.

### Provider and model

| Variable | Default | Meaning |
| --- | --- | --- |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / … | — | Provider key |
| `JAIGENT_API_KEY` | — | Generic key; wins over provider-specific ones |
| `JAIGENT_PROVIDER` | `openai` | openai, anthropic, gemini, openrouter, groq, deepseek, mistral, xai, together, ollama |
| `JAIGENT_MODEL` | Provider default | Model id, or `auto` / `free` |
| `JAIGENT_BASE_URL` | Provider default | API root for compatible gateways |

### Execution

| Variable | Default | Meaning |
| --- | --- | --- |
| `JAIGENT_WORKSPACE` | Current directory | Directory the file tools are locked to |
| `JAIGENT_MAX_STEPS` | `12` | Tool-call budget per turn |
| `JAIGENT_TEMPERATURE` | `0.2` | Sampling temperature |
| `JAIGENT_MAX_TOKENS` | `2048` | Tokens per assistant turn |
| `JAIGENT_TIMEOUT` | `60` | HTTP timeout in seconds |
| `JAIGENT_APPROVAL` | tty-dependent | `ask`, `auto` or `dry-run` |
| `JAIGENT_STREAM` | `1` | Stream the answer |
| `JAIGENT_SHOW_COST` | `1` | Print the token and cost line |
| `JAIGENT_VERBOSE` | `0` | Trace tool calls |
| `JAIGENT_SESSION_DIR` | `~/.jaigent/sessions` | Saved conversations |
| `JAIGENT_PRICES` | — | JSON overriding the price table |

### Search and network

| Variable | Default | Meaning |
| --- | --- | --- |
| `JAIGENT_SEARCH_BACKEND` | `duckduckgo` | `duckduckgo` (no key) or `tavily` |
| `TAVILY_API_KEY` | — | Required only for Tavily |
| `JAIGENT_ALLOW_SHELL` | `0` | `1` enables `run_command` |
| `JAIGENT_FAILOVER` | `1` | Retry, then fall back |
| `JAIGENT_RETRIES` | `3` | Attempts per provider. `1` disables retrying |

### Extensions and persistence

| Variable | Default | Meaning |
| --- | --- | --- |
| `JAIGENT_SKILLS` | `1` | Load skills and offer `load_skill` |
| `JAIGENT_PLUGINS` | `1` | Load local plugins |
| `JAIGENT_CHECKPOINTS` | `1` | Snapshot files before changing them |
| `JAIGENT_BUDGET` | `0` | Hard USD cap for one run. `0` disables it |
| `JAIGENT_MEMORY` | `0` | `1` persists notes in `.jaigent/memory.md` |
| `JAIGENT_AUTO_COMPACT` | `0` | `1` collapses older chat turns |
| `JAIGENT_MCP_WRITE` | `0` | `1` exposes write tools from the local stdio MCP server |
| `JAIGENT_HOME` | `~/.jaigent` | Settings, skills, schedules and `secrets.env` |
| `JAIGENT_SCHEDULE_FILE` | `$JAIGENT_HOME/schedules.json` | Scheduled task store |
| `JAIGENT_KEYS_FILE` | `$JAIGENT_HOME/keys.json` | Gateway keys |
| `JAIGENT_NO_UPDATE_CHECK` | — | `1` never checks for releases |
| `JAIGENT_BETA` | `0` | `1` pulls updates from the `beta` branch |

The ChatGPT bridge variables (`JAIGENT_PLUGIN_*`) are in [MCP & your own API](/jaigent/mcp/).

## Internal architecture

In one sentence: **an agent loop asks a provider for either text or tool calls, executes those calls inside a sandbox and repeats until the model answers**, with every mutation snapshotted, approved and reversible.

### The loop (`agent.py`)

`Agent.run(prompt)` is the entire product, in one function:

1. **Route.** `model="auto"` picks a model for this prompt; `model="free"` may also switch provider. Non-routing models skip this step.
2. **Build the messages**: system prompt, history and the user's prompt.
3. **Call the provider.** The reply is either plain text (done) or tool calls (continue). Streaming chunks are forwarded through `on_text` as they arrive.
4. **Execute each call** with `_execute`: snapshot → approval check → run → append the result for the model.
5. **Repeat** until the model answers without tool calls, or the step budget (`max_steps`, 12 by default) runs out. Then **one final call is made without tools**, forcing an answer.

### Layers

| Layer | File | Responsibility |
| --- | --- | --- |
| CLI | `cli.py` | Arguments, terminal and status callbacks |
| Agent | `agent.py` | The loop: route, messages, execution, budget |
| Routing | `router.py` | `auto` and `free` heuristic, no LLM call |
| Providers | `llm/` | Per-provider adapters and `FailoverProvider` |
| Tools | `tools/` | Files, web, shell, `ask_user` and plugins |
| Registry | `ToolRegistry` | One single list shared by CLI, MCP and gateway |
| Local MCP | `mcp.py` | Exposes the registry over stdio |
| ChatGPT bridge | `chatgpt.py` | Remote MCP with OAuth, reusing registry and gateway |
| Gateway | `serve` | `/v1/chat/completions` and `/v1/models` |

One `Agent`, one tool registry and one approval and checkpoint implementation.

## Safety model

The defaults are deliberately conservative.

**Filesystem.** Every path is resolved and checked against the workspace. Traversal, absolute paths and escaping symlinks are rejected. Reads are capped at **1 MB**.

**Shell.** Absent unless `--allow-shell` or `JAIGENT_ALLOW_SHELL=1`. Time-limited and blocklisted (`rm -rf /`, `sudo`, `format c:`, …).

> [!DANGER]
> A model that can run a shell **can work around a string filter**. Treat the flag as "I trust this model with this directory", not as a protection.

**Undo.** Every file change is snapshotted first. See [Using the CLI](/jaigent/cli/).

**Network.** `fetch_page` refuses loopback, link-local, private ranges and cloud metadata (`169.254.169.254`). Hostnames are resolved and **every redirect is re-checked**. Fetched pages are still untrusted input: do not combine `--allow-shell` with sites you do not trust.

**Secrets.** Keys come from the environment, from `jaigent auth` / `~/.jaigent/secrets.env` or from a git-ignored `.env`, and are **never printed in full**. File tools refuse `.env`, private keys and similar files even inside the workspace.

### Usage recommendation

Run in a dedicated directory, keep it under version control and start with `--verbose`.
