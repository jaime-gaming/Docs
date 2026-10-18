---
description: "Three ways to install jAIgent and how to get a provider key without overpaying."
updated: "2026-10-18"
---

jAIgent installs three ways. If you do not want Python, use the binary; if you already work with Python, use PyPI.

## Standalone binary

No Python installation needed.

**macOS and Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/jaime-gaming/jaigent/main/packaging/install.sh | sh
```

**Windows** (PowerShell)

```powershell
irm https://raw.githubusercontent.com/jaime-gaming/jaigent/main/packaging/install.ps1 | iex
```

Both scripts **verify the published SHA-256 checksum** before installing. You can also download the archive from [Releases](https://github.com/jaime-gaming/jaigent/releases): Windows x64, macOS (Intel and Apple Silicon) and Linux (x64 and arm64).

## From PyPI

The recommended path if you already have Python:

```bash
pip install jaigent
```

If the package is not on PyPI yet in your environment:

```bash
pip install git+https://github.com/jaime-gaming/jaigent.git
```

## From source

Requires **Python 3.10 to 3.13**.

```bash
git clone https://github.com/jaime-gaming/jaigent.git
cd jaigent
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -e .
```

## First check

```bash
jaigent init          # pick a provider, store a key and test it
jaigent doctor        # keys, storage and providers
jaigent --logo        # the orange jAI wordmark
```

`jgt` is a shorter alias for the same command.

The logo adapts to the terminal: six-row block letters when there is room, a three-row wordmark in narrow windows and a single line below about 28 columns. Colour drops under `--no-color` or when the output is piped.

## Getting an API key

jAIgent **has no key of its own**: you supply one. `jaigent providers` prints the same table.

| Provider | Where to get a key | Environment variable |
| --- | --- | --- |
| OpenAI (default) | platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Anthropic | console.anthropic.com/settings/keys | `ANTHROPIC_API_KEY` |
| Gemini | aistudio.google.com/apikey | `GEMINI_API_KEY` |
| OpenRouter | openrouter.ai/keys | `OPENROUTER_API_KEY` |
| Groq | console.groq.com/keys | `GROQ_API_KEY` |
| Together | api.together.xyz/settings/api-keys | `TOGETHER_API_KEY` |
| DeepSeek | platform.deepseek.com/api_keys | `DEEPSEEK_API_KEY` |
| Mistral | console.mistral.ai/api-keys | `MISTRAL_API_KEY` |
| xAI (Grok) | console.x.ai | `XAI_API_KEY` |
| Ollama | None — it runs locally | — |

> [!TIP]
> Do not want to pay? Use **Ollama**, which needs no key, or the free models of OpenRouter and Groq with `--model free`. Web search uses DuckDuckGo by default and needs **no** second key.

### Storing the key

Three equivalent paths:

```bash
jaigent auth set openai sk-...     # stored in ~/.jaigent/secrets.env
# or
export OPENAI_API_KEY='sk-...'
# or
cp .env.example .env && $EDITOR .env
```

Then:

```bash
jaigent config          # the key is printed as <set>, never in full
```

`.env` is git-ignored. **Real environment variables always win.**

`jaigent init` writes the key to `~/.jaigent/secrets.env` and only also writes a project `.env` when that folder is writable: it skips `System32` on Windows so a double-clicked installer cannot fail by trying to create a file there.

> [!WARNING]
> `jaigent settings set` **refuses** API keys on purpose. Keys go through `jaigent auth`, the environment or a git-ignored `.env`, never through the settings file.

## Verifying the installation

```bash
jaigent doctor          # keys, storage, providers and the failover chain
jaigent update --check  # only reports, does not update
```

`jaigent update` really updates and also syncs a source checkout. With `JAIGENT_BETA=1` or `jaigent beta`, updates come from the `beta` branch. If you prefer no release checks at all, `JAIGENT_NO_UPDATE_CHECK=1`.

## Installation troubleshooting

| Symptom | What to do |
| --- | --- |
| `jaigent: command not found` after `pip install` | Python's script directory is not on the `PATH`. |
| The binary does not start on Linux | Missing recent `glibc`, or the file lacks the executable permission. |
| `doctor` sees no keys | Real variables win: check that no empty variable is exported. |
| Installing from Git fails | Python version outside the 3.10–3.13 range. |
