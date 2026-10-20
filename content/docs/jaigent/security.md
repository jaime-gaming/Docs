---
title: "Seguridad"
icon: "shield"
order: 80
blurb: "qué defiende, qué no defiende a propósito y cómo informar de una vulnerabilidad."
description: "El modelo de seguridad de jAIgent: qué defiende de verdad, qué no defiende a propósito, versiones con soporte y cómo informar de una vulnerabilidad."
updated: "2026-10-19"
---

jAIgent ejecuta herramientas que tocan ficheros, red y —si tú lo activas— el intérprete de comandos. [`SECURITY.md`](https://github.com/jaime-gaming/jAIgent/blob/main/SECURITY.md) dedica 12 KB a explicar exactamente dónde está la línea, y la divide en dos listas: **lo que defiende** y **lo que no defiende, a propósito**. Conocer la segunda ahorra más tiempo que la primera.

> [!IMPORTANT]
> Saber contra qué no se defiende es parte del diseño, no un descuido. Las dos listas se leen juntas.

## Versiones con soporte

Solo la rama 0.5.x recibe parches de seguridad.

| Versión | Publicación | Soporte | Notas |
| --- | --- | --- | --- |
| 0.5.x | 2026-09-11 | ✅ | Candidata beta actual: 0.5.7 preparada, última publicada 0.5.6. Autenticación, binarios y MCP remoto |
| 0.4.x | 2026-08-18 | ❌ | Fin de soporte |
| 0.3.x | 2026-08-18 | ❌ | Fin de soporte |
| 0.2.x | 2026-08-18 | ❌ | Fin de soporte |
| 0.1.x | 2026-08-18 | ❌ | Fin de soporte |

Las correcciones llegan primero a `main` y se publican como versiones de parche para 0.5.x. **A las versiones 0.1–0.4 no se les backportea nada.** Para actualizar: `pip install --upgrade jaigent`.

### Versiones de Python

jAIgent soporta **todo Python que su propio upstream siga soportando**: 3.10, 3.11, 3.12 y 3.13. La integración continua ejecuta la suite completa contra las cuatro en Linux, y contra 3.10 y 3.13 en macOS y Windows. Los binarios independientes **empaquetan su propio intérprete**, así que funcionan sin ningún Python instalado.

Tras actualizar se confirma con `jaigent --version`, y `jaigent doctor` dice si algo va mal.

## Cómo informar de una vulnerabilidad

Los problemas de seguridad se comunican **en privado** a través de los [avisos de seguridad de GitHub](https://github.com/jaime-gaming/jAIgent/security/advisories/new), no abriendo un issue público. Conviene incluir qué has encontrado, cómo se reproduce y qué conseguiría un atacante. La respuesta inicial llega en pocos días.

Hay interés particular en cuatro cosas:

- **Escapes del espacio aislado** — cualquier forma de que una herramienta de ficheros lea o escriba fuera del espacio de trabajo.
- **Saltos del bloqueo de comandos** que vayan más allá de los límites documentados de `run_command`.
- **Fugas de claves** — cualquier camino por el que una clave de API llegue a la salida estándar, a un log o a disco.
- **Fallos de autenticación del gateway** — cualquier forma de alcanzar `jaigent serve` sin una clave válida, de recuperar una clave desde `keys.json`, o de que un llamante vea los datos de otro.

## Qué defiende

### El espacio de trabajo

- Las herramientas de ficheros **no pueden salir del espacio de trabajo**. Los recorridos relativos, las rutas absolutas y los enlaces simbólicos que apuntan fuera se rechazan **antes de que ocurra ninguna entrada o salida**.
- La ejecución de comandos **no está en el juego de herramientas** salvo que se active explícitamente.
- Una herramienta que falla **no puede reventar una ejecución ni volcar una traza de pila al usuario**: los errores se devuelven al modelo como texto.
- Cada fichero que el agente modifica se **fotografía antes**, así que un cambio no deseado se revierte con `jaigent undo`. La instantánea se toma **antes del aviso de aprobación**, de modo que un cambio que aprobaste y del que luego te arrepentiste también es recuperable. Restaurar no puede escribir fuera del espacio de trabajo: un `../..` o una ruta absoluta en un índice de puntos de control editado a mano **se salta en vez de seguirse**.

### Las claves

- Las claves de API de los proveedores se leen del entorno, de un `.env` ignorado por Git o de `~/.jaigent/secrets.env` (solo para su propietario, escrito por `jaigent auth` o `jaigent init`). **Se enmascaran en toda la salida, incluida `jaigent config`**, y `jaigent settings set` se niega directamente a guardar un secreto.
- Las claves del gateway (`jgt-…`) se almacenan **solo como hashes SHA-256**, en un fichero creado con permisos de solo propietario. El texto plano se enseña una única vez, al crearla. La comparación es **de tiempo constante**, así que medir tiempos no revela un prefijo válido.
- Los ficheros que contienen credenciales —el `.env` que escribe `jaigent init` y el almacén de claves del gateway— se crean con permisos de solo propietario **puestos antes de escribir el primer byte**, no arreglados después.

### El gateway

- `jaigent serve` se ata a **`127.0.0.1` por defecto** y se niega a arrancar sin claves salvo que pases `--no-auth` explícitamente. `--no-auth` en una interfaz que no sea loopback **se rechaza de plano**: las peticiones corren con las aprobaciones forzadas a `auto`, así que un gateway sin autenticar en una dirección alcanzable es control remoto del espacio de trabajo. O atas loopback, o creas una clave.
- La respuesta autenticada de `/v1/models` informa **solo** de si su agente es de solo lectura y de si el intérprete de comandos está activado. Eso permite al puente comprobar la configuración real de seguridad del gateway sin introducir otro endpoint de capacidades.

### El puente con ChatGPT

- El listener MCP entrante se ata a loopback y **cada `tools/call` exige un JWT de OAuth válido**. El descubrimiento de herramientas y la inicialización son públicos a propósito, para que ChatGPT pueda explorar la aplicación.
- El puente comprueba **firma, emisor, audiencia, expiración y ámbito** contra los datos de descubrimiento y el JWKS del emisor configurado, y verifica las capacidades de seguridad del gateway con clave existente. **Se niega a trabajar con gateways que tengan acceso al intérprete de comandos.**
- Las herramientas que no son de solo lectura se exponen únicamente cuando el propietario activa explícitamente las escrituras del puente **y** el gateway es escribible; el puente **vuelve a comprobar esa política antes de cada llamada que modifica**.
- Las herramientas de ficheros directas integradas usan el espacio aislado del espacio de trabajo y el almacén de puntos de control cuando estos están activados.
- **Los plugins locales son Python ejecutable de confianza, no están aislados.** Revísalos o desactiva los plugins antes de exponer el puente.
- `serve --read-only` elimina además toda herramienta no declarada explícitamente como `read_only=True` y toda herramienta marcada `dangerous=True`. **Esa declaración no es un espacio aislado.**
- Las sesiones creadas desde ChatGPT usan el almacén JSON de sesiones existente y llevan un origen de integración. La lista remota excluye las sesiones de CLI no relacionadas, los identificadores se validan antes de cargarse y las peticiones de una misma sesión se serializan. La CLI local todavía puede listarlas y reanudarlas: es **una frontera de propietario único, no aislamiento por usuario**.

### Los comandos y la red

- Los comandos se filtran contra una lista de bloqueo que cubre borrados recursivos de `/` o `~`, escrituras en crudo a disco, formateos del sistema de ficheros, bombas de bifurcación, `sudo`, descargar algo y volcarlo a un intérprete, force pushes, lecturas de `~/.ssh` y `/etc/shadow`, y apagado de la máquina. El filtrado se hace sobre una forma **normalizada en espacios y en minúsculas** del comando, así que `RM  -RF  /` se trata igual que `rm -rf /`.
- Un fallo de proveedor no puede filtrar tu prompt en silencio a un proveedor no deseado: **la cadena de respaldo solo incluye proveedores para los que tú has configurado una clave**.
- `fetch_page` se niega a alcanzar la máquina local o una red privada. Se rechazan los endpoints de metadatos de la nube (`169.254.169.254` y compañía), loopback, enlace local, rangos privados y reservados. **El nombre se resuelve primero y se comprueban todas las direcciones a las que apunta**, así que un nombre con aspecto público apuntando a `127.0.0.1` también se caza, y **cada salto de redirección se vuelve a comprobar** para que una URL pública no pueda rebotar hacia dentro. Importa porque el modelo puede estar actuando bajo instrucciones de una página que acaba de leer.
- La comprobación de actualizaciones es de solo lectura y **no contacta con nada más que la API de releases de GitHub**. No envía información identificativa, y `jaigent update` nunca instala nada sin un comando explícito —y, en una terminal, una confirmación—.

### Skills, cadena de suministro y binarios

- Los skills y los comandos propios son **texto de prompt, nunca código**: cargar uno no puede ejecutar nada. Aun así sus descripciones, plantillas y cuerpos pueden enviarse al modelo conectado, así que **no guardes secretos en ellos**. El descubrimiento de skills y comandos **ignora ficheros y directorios enlazados simbólicamente**, lo que impide que un enlace de prompt lea fuera de sus directorios configurados. Las lecturas y escrituras de la memoria del proyecto también rechazan rutas simbólicas y objetivos de credenciales.
- Las dependencias se auditan con **`pip-audit`** y el código con **`bandit`** en cada ejecución de la integración continua, en todas las versiones de Python soportadas. La lista de dependencias de runtime por defecto son **dos paquetes**: `httpx` y `rich`. El endpoint MCP entrante de ChatGPT es opcional y añade `joserfc` solo cuando se instala con `jaigent[chatgpt]`.
- Los binarios de las releases los construye **la integración continua a partir de un commit etiquetado, nunca la máquina de un desarrollador**, y se publican con sumas de comprobación SHA-256. Los dos scripts de instalación **verifican la suma y abortan si no coincide**.

## Qué no defiende, a propósito

Esta es la lista que conviene leer antes de decidir cómo se usa.

- **Inyección de prompts desde contenido descargado.** `fetch_page` devuelve texto no confiable de la web abierta: una página maliciosa puede intentar dar instrucciones al modelo. El contenido se limpia y se trunca, nunca se ejecuta, pero **no combines `--allow-shell` con navegación por sitios no confiables**.
- **Un modelo para el que activaste el intérprete de comandos.** `--allow-shell` concede ejecución de comandos en el espacio de trabajo. La lista de bloqueo **previene accidentes, no a un adversario decidido**.
- **Lo que el modelo decide enviar.** El contenido de los ficheros que lee el agente local se envía al proveedor de LLM configurado. Con las herramientas MCP directas de ChatGPT, el contenido de ficheros y páginas solicitado se devuelve a ChatGPT como resultado de la herramienta. Las claves de API del proveedor se quedan en el host de jAIgent, pero **dar acceso de lectura sigue siendo compartir datos con el servicio del modelo conectado**. No apuntes el espacio de trabajo a un directorio que contenga secretos.
- **El tratamiento que tu proveedor da a tus datos.** Eso es entre tú y ellos; jAIgent no añade ningún intermediario.
- **Cualquiera que pueda alcanzar un gateway expuesto.** Una clave `jgt-` concede acceso completo al agente —herramientas de ficheros, acceso web y el intérprete si lo activaste— dentro del espacio de trabajo del servidor, **facturado a tu cuenta del proveedor**. Trátala como una credencial de producción. Atar `jaigent serve` a `0.0.0.0` entrega ese acceso a toda tu red, y por eso exige una clave; `--no-auth` solo se acepta en loopback.
- **Compartir un puente de ChatGPT entre usuarios no confiables.** OAuth autentica y autoriza el acceso al puente, pero todas las conexiones autorizadas siguen usando el mismo gateway, espacio de trabajo y cuenta de proveedor configurados. El puente es **de propietario único, no un servicio multiinquilino**. Restringe el emisor y el ámbito de OAuth a usuarios de confianza y no publiques una instancia compartida como si los usuarios tuvieran espacios aislados.
- **Errores de proxy inverso HTTPS y agotamiento de tráfico.** `jaigent chatgpt` habla **HTTP plano en loopback**: quien opera es responsable de terminar el TLS y no debe publicar directamente el puerto del backend. Los metadatos de recursos, la inicialización y el descubrimiento de herramientas son públicos a propósito; solo las llamadas a herramientas requieren OAuth. El listener de la biblioteca estándar **no tiene limitador de velocidad por cliente**. Configura tamaño de petición, tiempos de espera de conexión y lectura y límites de velocidad en el proxy inverso, y mantén su listener de loopback inaccesible desde la red. En ChatGPT se registra únicamente la URL MCP pública con HTTPS.
- **Las tareas programadas.** Corren desatendidas con la aprobación forzada a `auto`, así que pueden escribir ficheros sin que nadie confirme. Sus cambios sí se siguen registrando en puntos de control.
- **Los efectos colaterales de los comandos.** Los puntos de control cubren los ficheros tocados por las herramientas de ficheros del propio agente. Una invocación de `run_command` puede cambiar cualquier cosa de la máquina, así que **no se fotografía nada para ella y `undo` no puede ayudar**. Haz commit antes de ejecutar una tarea con `--allow-shell`.
- **Exfiltración a un host público.** La protección contra SSRF impide que el agente llegue **hacia dentro**. No puede impedir que un modelo envíe el contenido del espacio de trabajo a una URL pública controlada por un atacante si una inyección de prompt lo convence. Revisa qué descarga el agente cuando la tarea implique páginas no confiables.
- **Los permisos de fichero en Windows.** Allí no existen los bits de modo POSIX: el acceso a `.env` y al almacén de claves lo gobierna la herencia de NTFS.
- **Una release hostil de GitHub.** `jaigent update` ejecuta el script de instalación oficial, que verifica la suma publicada, pero **cualquiera que pueda publicar una release en este repositorio puede publicar un binario**. Es la misma confianza que depositas en cualquier gestor de paquetes. Fija una versión si eso te importa.
- **Un endpoint de proveedor comprometido.** Si apuntas `--base-url` a un host que no controlas, ve cada prompt y puede devolver cualquier cosa, **incluidas llamadas a herramientas que el agente ejecutará**. Usa solo URLs base en las que confíes.

## Buenas prácticas

- Ejecuta en un directorio dedicado, **no en `$HOME` ni en `/`**.
- Mantén el espacio de trabajo bajo control de versiones, para poder revisar y revertir cambios.
- Empieza con `--verbose` para ver qué hace realmente el agente.
- Deja `--allow-shell` desactivado salvo que lo necesites y confíes en la tarea.
- Usa una clave de API con ámbito y límite de gasto.
- Ejecuta `jaigent doctor` tras instalar o actualizar: comprueba la configuración de claves, los permisos del almacenamiento y qué proveedores son alcanzables de verdad.
- Verifica la suma de comprobación si descargas un binario a mano; los scripts de instalación lo hacen por ti.
- Mantén `jaigent` al día. Todas las versiones están soportadas, pero las correcciones llegan primero a la release de parche más nueva.
- Mantén `jaigent serve` en loopback salvo que hayas puesto autenticación y TLS reales delante. Para una conexión entrante de ChatGPT, prefiere `jaigent serve --read-only`, deja `--allow-shell` desactivado y publica solo `jaigent chatgpt` a través de un proxy inverso HTTPS. Emite **una clave de gateway por aplicación** para poder revocarlas individualmente con `jaigent keys revoke`, y revisa `jaigent keys list` en busca de llamadas que no reconozcas.

## Dónde seguir

- [MCP y tu propia API](/jaigent/mcp/) — el gateway y el puente con ChatGPT en detalle.
- [Referencia de tools](/jaigent/reference/) — qué hace cada herramienta y cuáles son de solo lectura.
- [Instalación y claves](/jaigent/install/) — `jaigent auth`, `init` y `doctor`.
