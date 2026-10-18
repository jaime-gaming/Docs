---
description: "Diez proveedores, enrutado automático, modelos gratuitos y conmutación por fallo."
updated: "2026-10-18"
---

jAIgent habla con diez proveedores y decide cuál usar según lo que le pidas. Tres mecanismos lo gobiernan: **auto**, **free** y **failover**.

## Auto

`--model auto` dimensiona el modelo al trabajo. Un saludo no cuesta un refactor.

```bash
jaigent -m auto "hola"                                    # → un modelo barato
jaigent -m auto "refactoriza este paquete y añade tests"  # → uno capaz
jaigent settings set model auto
jaigent route "¿por qué esto deadlockea bajo carga?"      # preview, no gasta nada
```

El enrutador puntúa **longitud, bloques de código, fraseo multipaso y palabras clave de dificultad**, y clasifica en simple, estándar o complejo.

> [!NOTE]
> Es una heurística en `src/jaigent/router.py`, **no una segunda llamada a un LLM**. No paga un modelo para elegir modelo.

## Free

`--model free` recorre los proveedores que de verdad puedes usar y elige un modelo sin coste. El orden es **Ollama primero**, luego Groq, Gemini y los identificadores `:free` de OpenRouter.

```bash
jaigent -m free "resume README.md"
jaigent models --free
jaigent route --free "refactoriza esto"
jaigent settings set model free
```

Sigues necesitando una clave para Groq, Gemini u OpenRouter. **Ollama no necesita ninguna.**

## Failover

Un 503 o un límite de tasa reintenta con **backoff y jitter**, y después cae al siguiente proveedor que tenga **clave propia**.

```console
$ jaigent "resume el changelog"
  openai is overloaded — retrying…
  Continuing on anthropic…
```

Las reglas exactas:

| Código | Comportamiento |
| --- | --- |
| 503, 429 | Reintento con backoff y jitter, y después siguiente proveedor |
| 400, 401 | **Fallo inmediato**: reintentar una petición mala solo pierde tiempo |
| Proveedor sin clave | Se salta: nunca se reutiliza la clave del backend anterior |

`jaigent doctor` muestra la cadena completa. Se ajusta con `--retries N` o se desactiva con `JAIGENT_FAILOVER=0`. Un Ollama local cuenta como respaldo sin clave. Cambiar con `/provider` nunca reutiliza la clave del backend anterior.

> [!TIP]
> Cada reintento y cada cambio de proveedor **se anuncia mientras ocurre**. Por eso un turno lento se lee como un turno lento y no como un proceso colgado.

## Proveedores admitidos

| Proveedor | Variable | Notas |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` | Predeterminado |
| Anthropic | `ANTHROPIC_API_KEY` | |
| Gemini | `GEMINI_API_KEY` | Tiene capa gratuita |
| OpenRouter | `OPENROUTER_API_KEY` | Acceso a muchos modelos, incluidos `:free` |
| Groq | `GROQ_API_KEY` | Rápido, con capa gratuita |
| Together | `TOGETHER_API_KEY` | |
| DeepSeek | `DEEPSEEK_API_KEY` | |
| Mistral | `MISTRAL_API_KEY` | |
| xAI (Grok) | `XAI_API_KEY` | |
| Ollama | — | Local, sin clave |

`jaigent providers` imprime esta tabla desde tu propia instalación, con lo que tienes configurado. `jaigent models` lista el catálogo y `jaigent route` previsualiza qué elegiría el enrutador **sin gastar nada**.

## Presupuesto de pasos y temperatura

El bucle tiene un presupuesto de pasos por turno: `JAIGENT_MAX_STEPS`, por defecto **12**. Cuando se agota, se hace **una última llamada sin herramientas**, forzando una respuesta en vez de dejar el turno a medias.

| Variable | Por defecto | Qué controla |
| --- | --- | --- |
| `JAIGENT_MAX_STEPS` | `12` | Llamadas a herramientas por turno |
| `JAIGENT_TEMPERATURE` | `0.2` | Temperatura de muestreo |
| `JAIGENT_MAX_TOKENS` | `2048` | Tokens por turno del asistente |
| `JAIGENT_TIMEOUT` | `60` | Tiempo de espera HTTP en segundos |
| `JAIGENT_BASE_URL` | El del proveedor | Raíz de API para gateways compatibles |
| `JAIGENT_PRICES` | — | Archivo JSON que sobrescribe la tabla de precios |

## Tope de gasto

Tres controles independientes. Ninguno está activado hasta que lo digas, salvo las skills integradas, que son solo texto de prompt.

```bash
jaigent settings set budget 0.50       # tope duro en USD para una ejecución
jaigent settings set auto_compact true # pliega turnos viejos cuando crece el historial
jaigent settings set memory true       # remember / recall + .jaigent/memory.md
```

**Tope de gasto.** `budget` se aplica en el bucle del agente **después de cada respuesta del modelo**. Cuando la estimación alcanza el tope, la ejecución se detiene y el pie dice `spend cap reached`. La skill integrada `spend-cap` es la parte blanda: gastar menos *antes* de que maten la ejecución. `0` lo desactiva.

**Compact.** `/compact` en el chat pliega los turnos viejos en un resumen **sin otra llamada al modelo**. `auto_compact` hace lo mismo cuando el historial pasa de veinte mensajes. La skill integrada `compact` le dice al modelo qué conservar.

**Memoria.** Apagada hasta que la enciendes. Entonces el modelo recibe `remember` y `recall`, y las notas permanentes viven en `.jaigent/memory.md` dentro del espacio de trabajo. Mientras el ajuste esté apagado no se escribe ni se envía nada.

> [!WARNING]
> No guardes secretos en `.jaigent/memory.md`. Es texto plano dentro de tu espacio de trabajo y, si lo confirmas en Git, es público.
