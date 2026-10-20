---
title: "MCP & your own API"
icon: "plug"
order: 50
blurb: "connecting ChatGPT Web, Claude Desktop and your apps."
description: "Connecting jAIgent with ChatGPT Web, Claude Desktop and your own applications: remote MCP, stdio MCP and the OpenAI gateway."
updated: "2026-10-18"
---

jAIgent connects in two directions: **outbound** as a client calling providers, and **inbound** exposing its tools to other programs. This page is about the second one.

## Your own API

`jaigent serve` turns jAIgent into an OpenAI-compatible endpoint at `/v1/chat/completions` and `/v1/models`. Your apps get one URL; behind it jAIgent picks the model, searches the web and uses its tools.

```bash
jaigent keys new my-app       # prints jgt-… once — copy it now
jaigent serve                 # http://127.0.0.1:8787/v1
```

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8787/v1", api_key="jgt-...")
reply = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "research X and summarise it"}],
)
print(reply.choices[0].message.content)
print(reply.jaigent if hasattr(reply, "jaigent") else "")
```

Responses carry a `jaigent` block with `tool_calls`, `tools_used` and `estimated_usd`.

| Detail | Value |
| --- | --- |
| Keys | Stored hashed, owner-only permissions, constant-time comparison |
| Management | `jaigent keys list` and `jaigent keys revoke <name>` |
| Default binding | `127.0.0.1` (loopback) |
| Read-only mode | `jaigent serve --read-only` |

> [!DANGER]
> **A `jgt-` key is a production credential.** It grants full agent access — files, the web, and the shell if you enabled it — billed to your provider account. Keep it on loopback unless you have real auth and TLS in front.

## MCP over stdio (local clients)

For Claude Desktop and any local MCP client:

```bash
jaigent mcp --print-config claude     # paste the result into Claude Desktop
```

It exposes the tool registry over stdio. By default it is **read-only**: `JAIGENT_MCP_WRITE=1` also exposes the write tools.

## Remote MCP and ChatGPT Web

This is the inbound direction: **ChatGPT connects to your jAIgent host**. The recommended route is a **remote Streamable HTTP MCP app created in ChatGPT Web**. It is not a local stdio app, a polling client, or an OpenAI API tunnel.

```text
ChatGPT Web → your HTTPS reverse proxy → `jaigent chatgpt` (`/mcp`, OAuth)
              ├─ existing jAIgent tools in the configured workspace
              └─ jaigent_chat / sessions → `jaigent serve` → existing agent
```

The bridge **reuses** jAIgent's existing gateway, tool registry, sandbox and saved-session store. It does not start a second agent or copy provider credentials. Direct remote file writes still go through the workspace sandbox and the existing checkpoint store, subject to the explicit bridge and gateway write policy.

### Availability in ChatGPT Web

OpenAI documents creating a custom app in **ChatGPT Web → Settings (or Workspace Settings) → Apps → Create**, with Developer Mode and custom apps enabled. You enter the remote MCP endpoint, configure OAuth, scan the tools, then connect and test the app in a web chat.

> [!WARNING]
> As documented on **7 October 2026**, ChatGPT Pro's Developer Mode supports read-only and fetch MCP actions, while full MCP — including write actions — is in beta for Business, Enterprise and Edu workspaces. Features can change and an administrator may disable them. **Do not assume your plan, workspace or region has write access until the app's tool picker confirms it.**

### The desktop-only plugin

The [jAIgent plugin listing](https://chatgpt.com/plugins/plugins_6ac65df23b2081918dda77cba4e674ca) is **Desktop-only**. A local MCP/stdio app cannot be reached from ChatGPT Web: installing that listing does not make a local server web-accessible. The remote HTTP/OAuth app described here is a separate connection.

The files in `integrations/chatgpt/` are an optional Plugin Creator or Codex starter, **not** a hosted server and not a way around ChatGPT's plan restrictions. Never describe a plugin as Web-compatible if it is marked Desktop-only or points at a local MCP process.

### Why a TLS proxy is needed

ChatGPT is the client and initiates requests, but it **cannot call `localhost` or `127.0.0.1` on your machine**. `jaigent chatgpt` binds to loopback and serves plain HTTP: it has to be exposed through a TLS reverse proxy such as Caddy at a publicly reachable HTTPS URL.

That needs three things jAIgent does not provide:

1. Working DNS.
2. Inbound connectivity.
3. A trusted **OAuth 2.1** authorization server.

### Bridge variables

| Variable | Default | What it does |
| --- | --- | --- |
| `JAIGENT_PLUGIN_HOST` | `127.0.0.1` | Local bind interface (loopback only) |
| `JAIGENT_PLUGIN_PORT` | `8788` | Local HTTP port of the inbound MCP bridge |
| `JAIGENT_PLUGIN_WORKSPACE` | Current workspace | Sandbox for direct remote MCP tools |
| `JAIGENT_PLUGIN_PUBLIC_URL` | Local URL | Public HTTPS origin used as MCP resource metadata (no `/mcp`) |
| `JAIGENT_PLUGIN_OAUTH_ISSUER` | — | Exact OAuth/OIDC issuer URL used to validate tokens |
| `JAIGENT_PLUGIN_OAUTH_AUDIENCE` | The public URL | Expected JWT audience or resource identifier |
| `JAIGENT_PLUGIN_GATEWAY_URL` | `http://127.0.0.1:8787/v1` | Existing gateway base; remote URLs must use HTTPS |
| `JAIGENT_PLUGIN_GATEWAY_KEY` | — | Private `jgt-` gateway key; **never** a provider key |
| `JAIGENT_PLUGIN_ALLOW_WRITE` | `0` | `1` permits non-read-only tools and session mutations, only when the gateway is writable |
| `JAIGENT_PLUGIN_VERBOSE` | `0` | Logs MCP method and path only; never request bodies or tokens |

## Python API

It can also be used as a library:

```python
from jaigent.agent import Agent

agent = Agent(workspace=".")
result = agent.run("summarise README.md")
print(result.text)
```

The agent loop is one function, so it is readable and extensible with no framework in between.
