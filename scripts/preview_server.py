#!/usr/bin/env python3
"""Servidor de preview local que replica la publicación en GitHub Pages.

Sirve la raíz del repositorio bajo BASE (/Docs/ por defecto), igual que
hará GitHub Pages, y usa 404.html como respaldo para rutas desconocidas.

    python3 scripts/preview_server.py [puerto]

Enlaza 0.0.0.0 para que también funcione en entornos con proxy.
"""
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.environ.get("DOCS_BASE", "/Docs/").strip("/")
PREFIX = f"/{BASE}" if BASE else ""


class DocsHandler(SimpleHTTPRequestHandler):
    """Añade el prefijo BASE y cae a 404.html cuando la ruta no existe."""

    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if PREFIX and clean.startswith(PREFIX):
            clean = clean[len(PREFIX):] or "/"
        elif PREFIX and not clean.startswith("/assets") and clean not in ("/", ""):
            # Fuera de BASE solo se sirven los recursos, para detectar
            # enlaces mal construidos durante el desarrollo.
            pass
        resolved = super().translate_path(clean)
        if not os.path.exists(resolved) and not clean.endswith((".html", ".xml", ".json", ".svg", ".css", ".js", ".png", ".ico", ".txt")):
            fallback = os.path.join(self.directory, "404.html")
            if os.path.exists(fallback):
                return fallback
        return resolved

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            index = os.path.join(path, "index.html")
            if os.path.exists(index):
                self.path = self.path.rstrip("/") + "/index.html"
        return super().send_head()

    def end_headers(self):
        # Sin caché durante el desarrollo: los cambios se ven al recargar.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write(f"  {self.address_string()} {fmt % args}\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", "8000"))
    handler = partial(DocsHandler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    url = f"http://0.0.0.0:{port}{PREFIX}/"
    print(f"Docs en {url}")
    print(f"Sirviendo {ROOT} bajo BASE={PREFIX or '/'}")
    print("Ctrl+C para parar.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nParado.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
