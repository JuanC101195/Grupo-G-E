"""Cliente mínimo de la API REST de WordPress para grupogye.com.

Lee WP_URL, WP_USER y WP_APP_PASSWORD de ../.env (archivo ignorado por git) y nunca imprime la clave.
Uso como módulo:  from wp_api import WP;  wp = WP();  wp.get("wp/v2/users/me", context="edit")
Uso directo:      python scripts/wp_api.py   → verifica la conexión y los permisos del usuario.
"""
import base64
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def load_env(path=ENV_PATH):
    if not path.exists():
        sys.exit(f"No existe {path}. Copie .env.example como .env y complete los datos.")
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    missing = [k for k in ("WP_URL", "WP_USER", "WP_APP_PASSWORD") if not env.get(k)]
    if missing:
        sys.exit(f"Faltan valores en .env: {', '.join(missing)}")
    if env["WP_APP_PASSWORD"].replace(" ", "") == "abcdefghijklmnopqrstuvwx":
        sys.exit("WP_APP_PASSWORD todavía tiene el valor de ejemplo.")
    return env


class WP:
    def __init__(self):
        env = load_env()
        self.base = env["WP_URL"].rstrip("/") + "/wp-json/"
        token = base64.b64encode(f'{env["WP_USER"]}:{env["WP_APP_PASSWORD"]}'.encode()).decode()
        self._headers = {"Authorization": "Basic " + token, "Accept": "application/json",
                         "User-Agent": "grupogye-web/1.0"}

    def request(self, method, route, data=None, **params):
        url = self.base + route.lstrip("/")
        if params:
            url += "?" + urllib.parse.urlencode(params)
        body, headers = None, dict(self._headers)
        if data is not None:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read()
                return json.loads(raw) if raw else None, dict(r.headers)
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            raise RuntimeError(f"{method} {route} → HTTP {e.code}: {detail}") from None

    def upload(self, path, alt_text=""):
        """Sube un archivo a la biblioteca de medios y devuelve el objeto media."""
        path = Path(path)
        mime = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}[path.suffix.lower()]
        # multipart/form-data, como un navegador: el ModSecurity del hosting rechaza el cuerpo binario directo
        boundary = "----gye" + base64.b16encode(path.name.encode()).decode()[:24]
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{path.name}"\r\n'
                f"Content-Type: {mime}\r\n\r\n").encode() + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
        headers = dict(self._headers)
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        req = urllib.request.Request(self.base + "wp/v2/media", data=body, method="POST", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                media = json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"upload {path.name} → HTTP {e.code}: {e.read().decode(errors='replace')[:300]}") from None
        if alt_text:
            self.request("POST", f"wp/v2/media/{media['id']}", {"alt_text": alt_text})
        return media

    def get(self, route, **params):
        return self.request("GET", route, **params)[0]

    def get_all(self, route, **params):
        """Recorre todas las páginas de un listado de la API."""
        items, page = [], 1
        while True:
            data, headers = self.request("GET", route, page=page, per_page=100, **params)
            items += data
            if page >= int(headers.get("X-WP-TotalPages", "1")):
                return items
            page += 1


if __name__ == "__main__":
    wp = WP()
    me = wp.get("wp/v2/users/me", context="edit")
    caps = me.get("capabilities", {})
    print(f"Conectado como: {me['username']} (id {me['id']})")
    print(f"Roles: {', '.join(me.get('roles', []))}")
    for c in ("edit_pages", "upload_files", "edit_theme_options", "activate_plugins", "manage_options"):
        print(f"  {c}: {'sí' if caps.get(c) else 'no'}")
