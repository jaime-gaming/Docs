---
description: "What jAIgent is, how it differs from other agents and how its pieces fit together."
updated: "2026-10-18"
---

**jAIgent** is a command-line AI agent with one clear idea: **one binary, ten providers and the same tools everywhere**. Terminal, ChatGPT Web over remote MCP, Claude Desktop over local stdio, and any application that speaks the OpenAI SDK.

> [!NOTE]
> This source prepares version **0.5.7**; **0.5.6** remains the latest published release until the next one ships. The full history is in the repository's `CHANGELOG.md`.

## Why it exists

| If you already have… | jAIgent is the one place that… |
| --- | --- |
| Claude Code, Cursor or Aider | Looks things up on the live web and writes a file you can undo |
| ChatGPT Web or Claude Desktop | Serves the same tools over remote OAuth MCP or local stdio, never shell |
| An app on the OpenAI SDK | `jaigent serve`: one URL, hashed `jgt-` keys, tools included |
| A local Ollama or the Groq free tier | `--model free` so a greeting does not cost a refactor |
| Several API keys | Failover: a 429 on OpenAI continues on Anthropic, then Ollama |

## What is actually different

**Undo is the product.** Every write is snapshotted **before** the approval prompt. `jaigent undo`, `rewind <id>` and `/revert` exist because other agents ask you first, but jAIgent also lets you change your mind afterwards.

**Web and files in the same loop.** `web_search` → `fetch_page` → `write_file`. It is not a chat wrapper and not a repo-only coder.

**It links instead of replacing.** Remote OAuth MCP for ChatGPT Web, local stdio MCP for desktop clients, `serve` for anything that speaks OpenAI, and skills, plugins and slash commands as local files you can commit.

**Ten providers, or none.** OpenAI, Anthropic, Gemini, DeepSeek, Grok, Groq, Mistral, OpenRouter, Together and Ollama. `--model auto` sizes the job; `--model free` picks a no-cost model you can actually reach.

**A hard spend cap.** `jaigent settings set budget 0.50` stops the run. Built-in `spend-cap` and `compact` skills; `/compact` in chat; memory only if you turn it on.

**Conservative by default.** Workspace sandbox, no shell unless you pass `--allow-shell`, secret files refused and no telemetry. One binary if you do not want Python.

**Small enough to read.** The agent loop is **one function**. No framework.

## Features by version

| Feature | What it does | Since |
| --- | --- | --- |
| Agent loop | Plan → tools → answer, with a step budget | 0.1.0 |
| Web search and fetch | DuckDuckGo (no key) or Tavily; pages stripped to text | 0.1.0 |
| File tools | List, read, write, edit, search and delete inside the sandbox | 0.1.0 |
| Approvals | `ask`, `auto` and `dry-run` depending on the terminal | 0.2.0 |
| Checkpoints and undo | Snapshot before every change and step-by-step restoration | 0.3.0 |
| Model routing | `auto` and `free` with a local heuristic, no extra call | 0.3.0 |
| Failover | Retry with backoff, then jump to the next provider with a key | 0.3.0 |
| Local stdio MCP | The tool registry exposed to desktop clients | 0.4.0 |
| OpenAI gateway | `jaigent serve` on `/v1/chat/completions` and `/v1/models` | 0.4.0 |
| Skills and plugins | Markdown procedures and local Python tools | 0.4.0 |
| ChatGPT Web bridge | Remote MCP over HTTP with OAuth 2.1 | 0.5.0 |
| Schedules | Run a prompt on a timer | 0.5.0 |

## How it all fits together

```text
                    CLI (cli.py)       MCP stdio (mcp.py)       gateway (serve)
                       │                    │                        │
                       └──────────────┬─────┴────────────────────────┘
                                      │    Agent (agent.py)
                                      │  ┌─────────────────────────────┐
                                      │  │ route → provider → tools …  │
                                      │  └────────┬─────────────┬──────┘
                                      │           │             │
                             FailoverProvider   ToolRegistry
                                      │           │
                         llm/ adapters        tools/ (files, web,
                         (openai, etc.)       shell, ask, plugins)

              ChatGPT Web → chatgpt.py (OAuth MCP) ──┬── existing tool registry
                                                     └── gateway's /v1 API → Agent
```

One `Agent`, one tool registry and one approval and checkpoint implementation. The CLI and the OpenAI-compatible gateway drive the same loop; local MCP exposes the registry; the inbound ChatGPT bridge composes that same registry for direct tool calls and delegates full agent or session turns through the existing gateway. **It creates no second agent and does not duplicate tool logic.**

The details are in [Tools reference](/jaigent/reference/).

## Getting started in four commands

```bash
jaigent init                          # pick a provider, paste a key, test it
jaigent "summarise README.md into overview.md"
jaigent undo                          # put overview.md back if you hate it
jaigent chat                          # then keep going interactively
```

`jgt` is a shorter alias for the same command.

## Reading further in the repository

This guide summarizes and organizes. The repository also ships its own documentation, and a couple of files should not be mistaken for existing functionality.

| Document | Size | What it is |
| --- | --- | --- |
| [`README.md`](https://github.com/jaime-gaming/jAIgent/blob/main/README.md) | 59 KB | The presentation of the project, very complete |
| [`CHANGELOG.md`](https://github.com/jaime-gaming/jAIgent/blob/main/CHANGELOG.md) | 66 KB | The changelog, version by version |
| [`AGENTS.md`](https://github.com/jaime-gaming/jAIgent/blob/main/AGENTS.md) | 15 KB | The context for coding agents working on the repository |
| [`SECURITY.md`](https://github.com/jaime-gaming/jAIgent/blob/main/SECURITY.md) | 12 KB | The security policy |
| [`docs/web-ui-proposal.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/web-ui-proposal.md) | 11 KB | **A proposal**, not a feature: a local web UI |
| [`docs/architecture.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/architecture.md) | 9 KB | The architecture |
| [`docs/terminal-ui.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/terminal-ui.md) | 8 KB | The terminal UI |
| [`docs/ci-and-releases.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/ci-and-releases.md) | 7 KB | Continuous integration and releases |
| [`docs/workflow-repair-v0.5.1.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/workflow-repair-v0.5.1.md) | 4 KB | The workflow repairs for version 0.5.1 |
| [`CONTRIBUTING.md`](https://github.com/jaime-gaming/jAIgent/blob/main/CONTRIBUTING.md) | 4 KB | How to contribute |
| [`LICENSE.md`](https://github.com/jaime-gaming/jAIgent/blob/main/LICENSE.md) | 4 KB | The license agreement |
| [`integrations/chatgpt/skills/jaigent/SKILL.md`](https://github.com/jaime-gaming/jAIgent/blob/main/integrations/chatgpt/skills/jaigent/SKILL.md) | 2 KB | The skill for the ChatGPT integration |
| [`src/jaigent/data/skills/spend-cap.md`](https://github.com/jaime-gaming/jAIgent/blob/main/src/jaigent/data/skills/spend-cap.md) | 1 KB | The built-in spend cap skill |
| [`src/jaigent/data/skills/compact.md`](https://github.com/jaime-gaming/jAIgent/blob/main/src/jaigent/data/skills/compact.md) | 1 KB | The built-in compact skill |
| [`.github/pull_request_template.md`](https://github.com/jaime-gaming/jAIgent/blob/main/.github/pull_request_template.md) | 1 KB | The pull request template |

### Two warnings before reading them

> [!WARNING]
> **`docs/web-ui-proposal.md` is a proposal only: no web UI is implemented.** The document says so in its first line and reminds you that it is still on the "discuss in an issue first" list in `AGENTS.md` and `CONTRIBUTING.md`. It is planning material, not an approved implementation specification.

The two built-in skills are **instructions, not mechanisms**. Each one declares in its header when it should be loaded and what to do, and the mechanical work is done elsewhere:

| Skill | When it loads | Who does the real work |
| --- | --- | --- |
| `compact` | When the conversation gets long or the user says "compact" | `/compact` in chat, or `auto_compact` in settings. The skill only says **what is worth preserving** |
| `spend-cap` | When the user mentions cost, budget or spend | The hard stop is enforced by jAIgent itself when `JAIGENT_BUDGET` (or `jaigent settings set budget 0.50`) is greater than zero. The skill is the soft side: spend less **before** the run is killed |

The ChatGPT skill, for its part, assumes a **remote OAuth-protected HTTP MCP endpoint**: it does not make a local stdio server reachable from ChatGPT Web.

## Guide tour

- [Install & API keys](/jaigent/install/) — binary, PyPI or source, and how to get a key.
- [Using the CLI](/jaigent/cli/) — commands, chat, undo and streaming.
- [Models & providers](/jaigent/models/) — `auto`, `free` and failover.
- [MCP & your own API](/jaigent/mcp/) — connecting ChatGPT Web, Claude Desktop and your apps.
- [Skills, plugins & schedules](/jaigent/extend/) — extending it with local files.
- [Tools reference](/jaigent/reference/) — tools table, variables and the safety model.
