"""Respaldo del contenido de WordPress vía API REST + inventario.

Guarda un JSON por tipo de contenido en fuentes/wp-respaldo-<fecha>/ (carpeta ignorada por git)
y muestra un resumen. Solo lee; no modifica nada en el sitio.
Uso: python scripts/respaldo_wp.py
"""
import datetime
import json
from pathlib import Path

from wp_api import WP

ROOT = Path(__file__).resolve().parent.parent
RUTAS = {
    "paginas": ("wp/v2/pages", {"context": "edit", "status": "any"}),
    "entradas": ("wp/v2/posts", {"context": "edit", "status": "any"}),
    "medios": ("wp/v2/media", {"context": "edit"}),
    "categorias": ("wp/v2/categories", {}),
    "etiquetas": ("wp/v2/tags", {}),
    "comentarios": ("wp/v2/comments", {"context": "edit", "status": "all"}),
    "usuarios": ("wp/v2/users", {"context": "edit"}),
    "plugins": ("wp/v2/plugins", {}),
    "temas": ("wp/v2/themes", {}),
    "menus": ("wp/v2/menus", {"context": "edit"}),
    "menu_items": ("wp/v2/menu-items", {"context": "edit"}),
    "plantillas": ("wp/v2/templates", {"context": "edit"}),
    "partes_plantilla": ("wp/v2/template-parts", {"context": "edit"}),
    "bloques_reutilizables": ("wp/v2/blocks", {"context": "edit"}),
}
SIN_PAGINAR = {"plugins", "temas"}


def main():
    wp = WP()
    out = ROOT / "fuentes" / f"wp-respaldo-{datetime.date.today().isoformat()}"
    out.mkdir(parents=True, exist_ok=True)
    resumen = {}
    for nombre, (ruta, params) in RUTAS.items():
        try:
            data = wp.get(ruta, **params) if nombre in SIN_PAGINAR else wp.get_all(ruta, **params)
        except RuntimeError as e:
            resumen[nombre] = f"no disponible ({str(e)[:80]})"
            continue
        (out / f"{nombre}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        resumen[nombre] = data
    ajustes = wp.get("wp/v2/settings")
    (out / "ajustes.json").write_text(json.dumps(ajustes, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Respaldo en: {out}\n")
    for nombre, data in resumen.items():
        print(f"{nombre:22} {len(data) if isinstance(data, list) else data}")
    print("\nAjustes:", {k: ajustes.get(k) for k in ("title", "description", "url", "language", "timezone", "show_on_front", "page_on_front")})
    if isinstance(resumen.get("plugins"), list):
        print("\nPlugins:")
        for p in resumen["plugins"]:
            print(f"  [{p['status']:8}] {p['name']} {p.get('version', '')}")
    if isinstance(resumen.get("temas"), list):
        print("\nTemas:")
        for t in resumen["temas"]:
            print(f"  [{t['status']:8}] {t['name']['rendered'] if isinstance(t['name'], dict) else t['name']} {t.get('version', '')}")
    if isinstance(resumen.get("paginas"), list):
        print("\nPáginas:")
        for p in resumen["paginas"]:
            print(f"  [{p['status']:8}] id {p['id']:5} /{p['slug']}/  autor {p['author']}  «{p['title']['raw'][:40]}»")
    if isinstance(resumen.get("entradas"), list):
        print("\nEntradas:", [(p["id"], p["status"], p["title"]["raw"][:30], p["author"]) for p in resumen["entradas"]][:15])
    if isinstance(resumen.get("comentarios"), list):
        st = {}
        for c in resumen["comentarios"]:
            st[c["status"]] = st.get(c["status"], 0) + 1
        print("\nComentarios por estado:", st)
    if isinstance(resumen.get("usuarios"), list):
        print("\nUsuarios:", [(u["id"], u["username"], u["roles"]) for u in resumen["usuarios"]])


if __name__ == "__main__":
    main()
