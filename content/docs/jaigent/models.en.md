---
title: "Models & providers"
icon: "cpu"
order: 40
blurb: "`auto`, `free` and failover."
description: "Ten providers, automatic routing, free models and failover."
updated: "2026-10-18"
---

jAIgent talks to ten providers and decides which one to use based on what you ask. Three mechanisms govern it: **auto**, **free** and **failover**.

## Auto

`--model auto` sizes the model to the job. A greeting does not cost a refactor.

```bash
jaigent -m auto "hi"                                        # → a cheap model
jaigent -m auto "refactor this package and add tests"       # → a capable one
jaigent settings set model auto
jaigent route "why does this deadlock under load?"          # preview, spends nothing
```

The router scores **length, code blocks, multi-step phrasing and difficulty keywords**, then buckets into simple, standard or complex.

> [!NOTE]
> It is a heuristic in `src/jaigent/router.py`, **not a second LLM call**. It does not pay for a model in order to choose a model.

## Free

`--model free` walks the providers you can actually use and picks a no-cost model. The order is **Ollama first**, then Groq, Gemini and OpenRouter's `:free` identifiers.

```bash
jaigent -m free "summarise README.md"
jaigent models --free
jaigent route --free "refactor this"
jaigent settings set model free
```

You still need a key for Groq, Gemini or OpenRouter. **Ollama needs none.**

## Failover

A 503 or a rate limit retries with **backoff and jitter**, then falls through to the next provider that has a **key of its own**.

```console
$ jaigent "summarise the changelog"
  openai is overloaded — retrying…
  Continuing on anthropic…
```

The exact rules:

| Code | Behaviour |
| --- | --- |
| 503, 429 | Retry with backoff and jitter, then next provider |
| 400, 401 | **Fail immediately**: retrying a bad request only wastes time |
| Provider without a key | Skipped: the previous backend's key is never reused |

`jaigent doctor` shows the full chain. Tune it with `--retries N` or disable it with `JAIGENT_FAILOVER=0`. A local Ollama counts as a fallback with no key. Switching with `/provider` never reuses the previous backend's key.

> [!TIP]
> Every retry and every provider switch **is announced as it happens**. That is why a slow turn reads as a slow turn and not as a hung process.

## Supported providers

| Provider | Variable | Notes |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` | Default |
| Anthropic | `ANTHROPIC_API_KEY` | |
| Gemini | `GEMINI_API_KEY` | Has a free tier |
| OpenRouter | `OPENROUTER_API_KEY` | Access to many models, including `:free` |
| Groq | `GROQ_API_KEY` | Fast, with a free tier |
| Together | `TOGETHER_API_KEY` | |
| DeepSeek | `DEEPSEEK_API_KEY` | |
| Mistral | `MISTRAL_API_KEY` | |
| xAI (Grok) | `XAI_API_KEY` | |
| Ollama | — | Local, no key |

`jaigent providers` prints this table from your own installation, with what you have configured. `jaigent models` lists the catalogue and `jaigent route` previews what the router would choose **without spending anything**.

## Step budget and temperature

The loop has a step budget per turn: `JAIGENT_MAX_STEPS`, **12** by default. When it runs out, **one final call is made without tools**, forcing an answer instead of leaving the turn half done.

| Variable | Default | What it controls |
| --- | --- | --- |
| `JAIGENT_MAX_STEPS` | `12` | Tool calls per turn |
| `JAIGENT_TEMPERATURE` | `0.2` | Sampling temperature |
| `JAIGENT_MAX_TOKENS` | `2048` | Tokens per assistant turn |
| `JAIGENT_TIMEOUT` | `60` | HTTP timeout in seconds |
| `JAIGENT_BASE_URL` | The provider's | API root for compatible gateways |
| `JAIGENT_PRICES` | — | JSON file overriding the price table |

## Spend cap

Three independent controls. None is on until you say so, except the built-in skills, which are just prompt text.

```bash
jaigent settings set budget 0.50       # hard USD stop for one run
jaigent settings set auto_compact true # collapse older turns when history grows
jaigent settings set memory true       # remember / recall + .jaigent/memory.md
```

**Spend cap.** `budget` is enforced in the agent loop **after each model reply**. When the estimate reaches the cap, the run stops and the footer says `spend cap reached`. The built-in `spend-cap` skill is the soft side: spend less *before* the run is killed. `0` disables it.

**Compact.** `/compact` in chat collapses older turns into one summary **without another model call**. `auto_compact` does the same when history passes twenty messages. The built-in `compact` skill tells the model what to keep.

**Memory.** Off until you turn it on. Then the model gets `remember` and `recall`, and standing notes live in `.jaigent/memory.md` inside the workspace. While the setting is off, nothing is written or sent.

> [!WARNING]
> Do not store secrets in `.jaigent/memory.md`. It is plain text inside your workspace and, if you commit it to Git, it is public.
