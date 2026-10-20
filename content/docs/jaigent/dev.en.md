---
title: "Development"
icon: "code"
order: 90
blurb: "the environment, how the code is organised, the mock server and the workflows."
description: "Developing jAIgent: the environment, how the code is organised, how to try it without spending tokens, and the real state of the workflows and releases."
updated: "2026-10-19"
---

A page for whoever is going to touch the code. The repository carries plenty of material for it — [`docs/architecture.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/architecture.md), [`CONTRIBUTING.md`](https://github.com/jaime-gaming/jAIgent/blob/main/CONTRIBUTING.md) and a 15 KB [`AGENTS.md`](https://github.com/jaime-gaming/jAIgent/blob/main/AGENTS.md) with the full conventions — and this gathers what you need to know before starting.

## The development environment

```bash
pip install -e ".[dev]"
pytest
ruff check . && ruff format .
mypy
bandit -r src/jaigent -ll
pip-audit
```

> [!TIP]
> **The suite is offline.** It needs no network, no tokens and no API key configured. Anyone new to the code should start with `docs/architecture.md`, which walks the whole thing in one page, and continue with `agent.py`.

## How the code is organised

| Path | What it is |
| --- | --- |
| `src/jaigent/agent.py` | The tool-calling loop. 21 KB |
| `src/jaigent/cli.py` | The terminal interface. **163 KB, by a wide margin the largest file in the project** |
| `src/jaigent/chatgpt.py` | The OAuth-protected inbound HTTP bridge to the existing gateway. 46 KB |
| `src/jaigent/mcp.py` | The MCP JSON-RPC core and the stdio transport |
| `src/jaigent/config.py` | Configuration |
| `src/jaigent/memory.py` | Optional project notes |
| `src/jaigent/plugins.py` | Local tool plugins |
| `src/jaigent/branding.py` | The orange jAI wordmark |
| `src/jaigent/data/skills/` | The two built-in skills: spend cap and compact |
| `src/jaigent/llm/` | The provider adapters |
| `src/jaigent/tools/` | Sandbox, files, web and shell |

That is **45 `.py` modules** under `src/jaigent/` and **55 test files** in `tests/`. The largest tests say where the risk lives: `test_cli_interactive.py` (62 KB), `test_updater.py` (55 KB) and `test_regressions.py` (37 KB).

## Trying it without spending tokens

`examples/mock_llm_server.py` (5.9 KB) is a tiny OpenAI-compatible server built for exactly that. It **ignores the model's actual intelligence and just replays a fixed plan**: list the workspace, write a summary, then answer. Both streaming and non-streaming requests are supported, so it exercises the same code paths a real provider does.

```bash
python examples/mock_llm_server.py            # listens on :8000
```

Then, in another shell:

```bash
JAIGENT_BASE_URL=http://localhost:8000/v1 \
JAIGENT_API_KEY=not-a-real-key \
jaigent "summarise notes.md into summary.md" --verbose
```

> [!NOTE]
> The `not-a-real-key` key is not an oversight: the mock server does not validate it. It is there to check the whole flow — approvals, checkpoints, streaming, tools — without it costing money.

`examples/basic_usage.py` (4.8 KB) is the other side: how to use jAIgent **from Python**, with a real key involved.

## The workflows and the releases

What surrounds continuous integration:

| File | Size | What it is |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](https://github.com/jaime-gaming/jAIgent/blob/main/.github/workflows/ci.yml) | — | The suite across several platforms |
| [`.github/workflows/release.yml`](https://github.com/jaime-gaming/jAIgent/blob/main/.github/workflows/release.yml) | — | Binary builds and publishing |
| [`docs/ci-and-releases.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/ci-and-releases.md) | 7 KB | The CI jobs, cutting a release, PyPI publishing and republishing a tag |
| [`tests/test_workflows.py`](https://github.com/jaime-gaming/jAIgent/blob/main/tests/test_workflows.py) | 22 KB | Regression tests **of the workflows themselves** |
| [`scripts/activate-ci.sh`](https://github.com/jaime-gaming/jAIgent/blob/main/scripts/activate-ci.sh) | 7 KB | Puts the workflows where GitHub reads them and keeps their paths honest |
| [`packaging/workflow-fixes-v0.5.1.patch`](https://github.com/jaime-gaming/jAIgent/blob/main/packaging/workflow-fixes-v0.5.1.patch) | 3 KB | The patch with the repairs, to apply by hand |
| [`docs/workflow-repair-v0.5.1.md`](https://github.com/jaime-gaming/jAIgent/blob/main/docs/workflow-repair-v0.5.1.md) | 4.5 KB | The record of why they were needed |

`packaging/` also holds the two installers (`install.sh` and `install.ps1`), the PyInstaller recipe (`jaigent.spec`), a launcher (`launcher.py`), the icon generator (`make_icon.py`) and the images they derive from.

### Why activate-ci.sh exists

GitHub **refuses any push that creates or edits a file under `.github/workflows/`** unless the token carries the `workflows` scope. The automation account that writes those files does not have it, so it could not push its own fixes. The script exists to be run from your own machine, with your own credentials, which do have that scope. It is safe to run repeatedly: **it only commits when something actually changed**.

### The three repairs, and their current state

`docs/workflow-repair-v0.5.1.md` opens by saying that `main` ships with workflows that fail on every platform. **That was true when it was written; all three repairs are applied on `main` today.** They are still worth knowing, because all three are Windows runner traps rather than code problems:

1. **`ci.yml`, "Smoke test the CLI", failed on both Windows runners.** The step said `doctor || true`. The default shell on Windows is `pwsh`, and the runner **prepends** `$ErrorActionPreference = 'stop'` to every pwsh step. `doctor` exits 1 when no API key is configured, pwsh then tried to run `true` — which is not a command on Windows — and the step aborted. **Applied fix:** the step is pinned to `shell: bash`, with a comment explaining why.
2. **`release.yml`, "Smoke test the binary (windows)", exited 1 with a good `jaigent.exe`.** The runner **appends** `if ((Test-Path -LiteralPath variable:\LASTEXITCODE)) { exit $LASTEXITCODE }` to every pwsh step, and the step's last native command was `doctor`, which exits 1 **by design**. The step published that 1 as its own and the binary was discarded. **Applied fix:** `$PSNativeCommandUseErrorActionPreference = $false` at the top and `exit 0` at the end; the `throw`s still fail on real problems.
3. **`release.yml`, the `macos-x64` job never left the queue.** `macos-13` was retired on 4 December 2025 and jobs on retired images **queue forever**. **Applied fix:** `macos-15-intel`, GitHub's designated x86_64 successor.

> [!IMPORTANT]
> The document reads as a record, not as a to-do list. Every repair has its regression test in `tests/test_workflows.py`.

## Where to go next

- [Security](/jaigent/security/) — the threat model and the supported versions.
- [Tools reference](/jaigent/reference/) — the Python API and how to add your own tool.
- [Skills, plugins & schedules](/jaigent/extend/) — the four ways to extend it with local files.
