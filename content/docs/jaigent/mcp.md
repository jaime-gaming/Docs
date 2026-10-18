---
description: "Conectar jAIgent con ChatGPT Web, Claude Desktop y tus propias aplicaciones: MCP remoto, MCP stdio y gateway OpenAI."
updated: "2026-10-18"
---

jAIgent se conecta en dos direcciones: **hacia fuera** como cliente que llama a proveedores, y **hacia dentro** exponiendo sus herramientas a otros programas. Esta página trata la segunda.

## Tu propia API

`jaigent serve` convierte jAIgent en un endpoint compatible con OpenAI en `/v1/chat/completions` y `/v1/models`. Tus aplicaciones reciben una URL; detrás, jAIgent elige el modelo, busca en la web y usa sus herramientas.

```bash
jaigent keys new my-app       # imprime jgt-… una sola vez: cópiala ahora
jaigent serve                 # http://127.0.0.1:8787/v1
```

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8787/v1", api_key="jgt-...")
reply = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "investiga X y resúmelo"}],
)
print(reply.choices[0].message.content)
print(reply.jaigent if hasattr(reply, "jaigent") else "")
```

Las respuestas llevan un bloque `jaigent` con `tool_calls`, `tools_used` y `estimated_usd`.

| Detalle | Valor |
| --- | --- |
| Claves | Guardadas con hash, permisos solo del propietario, comparación en tiempo constante |
| Gestión | `jaigent keys list` y `jaigent keys revoke <nombre>` |
| Enlace por defecto | `127.0.0.1` (loopback) |
| Modo lectura | `jaigent serve --read-only` |

> [!DANGER]
> **Una clave `jgt-` es una credencial de producción.** Concede acceso completo al agente: archivos, web y shell si lo activaste, facturado a tu cuenta de proveedor. Mantenla en loopback salvo que tengas autenticación real y TLS delante.

## MCP por stdio (clientes locales)

Para Claude Desktop y cualquier cliente MCP local:

```bash
jaigent mcp --print-config claude     # pega el resultado en Claude Desktop
```

Expone el registro de herramientas por stdio. Por defecto **solo lectura**: `JAIGENT_MCP_WRITE=1` expone también las herramientas de escritura.

## MCP remoto y ChatGPT Web

Esta es la dirección entrante: **ChatGPT se conecta a tu host de jAIgent**. La vía recomendada es una **aplicación MCP remota por Streamable HTTP creada en ChatGPT Web**. No es una app stdio local, ni un cliente de sondeo, ni un túnel a la API de OpenAI.

```text
ChatGPT Web → tu proxy inverso HTTPS → `jaigent chatgpt` (`/mcp`, OAuth)
              ├─ herramientas existentes de jAIgent en el espacio configurado
              └─ jaigent_chat / sessions → `jaigent serve` → agente existente
```

El puente **reutiliza** el gateway, el registro de herramientas, el sandbox y el almacén de sesiones guardadas de jAIgent. No arranca un segundo agente ni copia credenciales de proveedores. Las escrituras remotas directas siguen pasando por el sandbox del espacio de trabajo y por el almacén de checkpoints existente, sujetos a la política explícita de escritura del puente y del gateway.

### Disponibilidad en ChatGPT Web

OpenAI documenta crear una app propia en **ChatGPT Web → Settings (o Workspace Settings) → Apps → Create**, con Developer Mode y las apps personalizadas activadas. Se introduce el endpoint MCP remoto, se configura OAuth, se escanean las herramientas y se conecta y prueba la app en un chat web.

> [!WARNING]
> Según lo documentado el **7 de octubre de 2026**, el Developer Mode de ChatGPT Pro admite acciones MCP de solo lectura y fetch, mientras que el MCP completo —incluidas las acciones de escritura— está en beta para espacios de trabajo Business, Enterprise y Edu. Las funciones pueden cambiar y un administrador puede desactivarlas. **No des por hecho que tu plan, espacio o región tiene acceso de escritura hasta que el selector de herramientas de la app lo confirme.**

### El plugin de solo escritorio

El [listado del plugin de jAIgent](https://chatgpt.com/plugins/plugins_6ac65df23b2081918dda77cba4e674ca) es **solo de escritorio**. Una app MCP/stdio local no es alcanzable desde ChatGPT Web: instalar ese listado no hace que un servidor local sea accesible desde la web. La app remota HTTP/OAuth descrita aquí es una conexión separada.

Los archivos en `integrations/chatgpt/` son un arranque opcional para Plugin Creator o Codex, **no** un servidor alojado ni una forma de saltarse las restricciones de plan de ChatGPT. Nunca se debe describir un plugin como compatible con la web si está marcado como solo escritorio o apunta a un proceso MCP local.

### Por qué hace falta un proxy TLS

ChatGPT es el cliente e inicia las peticiones, pero **no puede llamar a `localhost` ni a `127.0.0.1` de tu equipo**. `jaigent chatgpt` enlaza a loopback y sirve HTTP plano: hay que exponerlo por un proxy inverso con TLS, como Caddy, en una URL HTTPS alcanzable públicamente.

Eso requiere tres cosas que jAIgent no proporciona:

1. DNS funcionando.
2. Conectividad entrante.
3. Un servidor de autorización **OAuth 2.1** de confianza.

### Variables del puente

| Variable | Por defecto | Qué hace |
| --- | --- | --- |
| `JAIGENT_PLUGIN_HOST` | `127.0.0.1` | Interfaz de enlace local (solo loopback) |
| `JAIGENT_PLUGIN_PORT` | `8788` | Puerto HTTP local del puente MCP entrante |
| `JAIGENT_PLUGIN_WORKSPACE` | El espacio actual | Sandbox para herramientas MCP remotas directas |
| `JAIGENT_PLUGIN_PUBLIC_URL` | URL local | Origen HTTPS público usado como metadato de recurso MCP (sin `/mcp`) |
| `JAIGENT_PLUGIN_OAUTH_ISSUER` | — | URL exacta del emisor OAuth/OIDC para validar tokens |
| `JAIGENT_PLUGIN_OAUTH_AUDIENCE` | La URL pública | Audiencia o identificador de recurso esperado en el JWT |
| `JAIGENT_PLUGIN_GATEWAY_URL` | `http://127.0.0.1:8787/v1` | Base del gateway existente; las URLs remotas deben usar HTTPS |
| `JAIGENT_PLUGIN_GATEWAY_KEY` | — | Clave `jgt-` privada del gateway; **nunca** una clave de proveedor |
| `JAIGENT_PLUGIN_ALLOW_WRITE` | `0` | `1` permite herramientas no de solo lectura y mutaciones de sesión, solo si el gateway es escribible |
| `JAIGENT_PLUGIN_VERBOSE` | `0` | Registra solo método y ruta MCP; nunca cuerpos de petición ni tokens |

## API de Python

También se puede usar como biblioteca:

```python
from jaigent.agent import Agent

agent = Agent(workspace=".")
result = agent.run("resume README.md")
print(result.text)
```

El bucle del agente es una función, así que es legible y ampliable sin framework por medio.
