---
description: "Tres formas de instalar jAIgent y cómo conseguir una clave de proveedor sin pagar de más."
updated: "2026-10-18"
---

jAIgent se instala de tres formas. Si no quieres Python, usa el binario; si ya trabajas con Python, usa PyPI.

## Binario independiente

No necesita Python instalado.

**macOS y Linux**

```bash
curl -fsSL https://raw.githubusercontent.com/jaime-gaming/jaigent/main/packaging/install.sh | sh
```

**Windows** (PowerShell)

```powershell
irm https://raw.githubusercontent.com/jaime-gaming/jaigent/main/packaging/install.ps1 | iex
```

Ambos scripts **verifican la suma de comprobación SHA-256 publicada** antes de instalar. También puedes descargar el archivo desde [Releases](https://github.com/jaime-gaming/jaigent/releases): Windows x64, macOS (Intel y Apple Silicon) y Linux (x64 y arm64).

## Desde PyPI

Es la vía recomendada si ya tienes Python:

```bash
pip install jaigent
```

Si el paquete todavía no está en PyPI en tu entorno:

```bash
pip install git+https://github.com/jaime-gaming/jaigent.git
```

## Desde el código fuente

Requiere **Python 3.10 a 3.13**.

```bash
git clone https://github.com/jaime-gaming/jaigent.git
cd jaigent
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -e .
```

## Primera comprobación

```bash
jaigent init          # elige proveedor, guarda una clave y la prueba
jaigent doctor        # claves, almacenamiento y proveedores
jaigent --logo        # el logotipo naranja jAI
```

`jgt` es un alias más corto del mismo comando.

El logotipo se adapta a la terminal: letras de bloque de seis filas cuando hay sitio, un wordmark de tres filas en ventanas estrechas y una sola línea por debajo de unas 28 columnas. El color desaparece con `--no-color` o cuando la salida va por tubería.

## Conseguir una clave de API

jAIgent **no tiene clave propia**: tú aportas una. `jaigent providers` imprime la misma tabla.

| Proveedor | Dónde conseguir la clave | Variable de entorno |
| --- | --- | --- |
| OpenAI (por defecto) | platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Anthropic | console.anthropic.com/settings/keys | `ANTHROPIC_API_KEY` |
| Gemini | aistudio.google.com/apikey | `GEMINI_API_KEY` |
| OpenRouter | openrouter.ai/keys | `OPENROUTER_API_KEY` |
| Groq | console.groq.com/keys | `GROQ_API_KEY` |
| Together | api.together.xyz/settings/api-keys | `TOGETHER_API_KEY` |
| DeepSeek | platform.deepseek.com/api_keys | `DEEPSEEK_API_KEY` |
| Mistral | console.mistral.ai/api-keys | `MISTRAL_API_KEY` |
| xAI (Grok) | console.x.ai | `XAI_API_KEY` |
| Ollama | Ninguna: se ejecuta en local | — |

> [!TIP]
> ¿No quieres pagar? Usa **Ollama**, que no necesita clave, o los modelos gratuitos de OpenRouter y Groq con `--model free`. La búsqueda web usa DuckDuckGo por defecto y **no** necesita una segunda clave.

### Guardar la clave

Tres caminos equivalentes:

```bash
jaigent auth set openai sk-...     # se guarda en ~/.jaigent/secrets.env
# o
export OPENAI_API_KEY='sk-...'
# o
cp .env.example .env && $EDITOR .env
```

Después:

```bash
jaigent config          # la clave se imprime como <set>, nunca completa
```

`.env` está ignorado por Git. **Las variables de entorno reales siempre ganan.**

`jaigent init` escribe la clave en `~/.jaigent/secrets.env` y solo escribe además un `.env` de proyecto cuando esa carpeta es escribible: se salta `System32` en Windows para que un instalador abierto con doble clic no falle al intentar crear ahí un archivo.

> [!WARNING]
> `jaigent settings set` **rechaza** claves de API a propósito. Las claves van por `jaigent auth`, por el entorno o por un `.env` ignorado, nunca por el archivo de ajustes.

## Verificar la instalación

```bash
jaigent doctor          # claves, almacenamiento, proveedores y cadena de fallo
jaigent update --check  # solo informa, no actualiza
```

`jaigent update` actualiza de verdad y también sincroniza un checkout de fuente. Con `JAIGENT_BETA=1` o `jaigent beta` las actualizaciones llegan desde la rama `beta`. Si prefieres que no se comprueben releases, `JAIGENT_NO_UPDATE_CHECK=1`.

## Solución de problemas de instalación

| Síntoma | Qué hacer |
| --- | --- |
| `jaigent: command not found` tras `pip install` | El directorio de scripts de Python no está en el `PATH`. |
| El binario no arranca en Linux | Falta `glibc` reciente o el archivo no tiene permiso de ejecución. |
| `doctor` no ve ninguna clave | Las variables reales ganan: comprueba que no haya una variable vacía exportada. |
| La instalación desde Git falla | Versión de Python fuera del rango 3.10–3.13. |
