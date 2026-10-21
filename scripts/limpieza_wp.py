"""Limpieza inicial de grupogye.com (2026-10-21). Todo lo que hace este script es reversible.

- Páginas de la plantilla vieja → borrador (no se borran)
- Entrada "Hello world!" y comentarios spam pendientes → papelera (recuperables 30 días)
- Plugins de la plantilla (Spectra, Plantillas de inicio, Hello Dolly) → desactivados

La eliminación del usuario del socio anterior la hace una persona desde el panel de WordPress.
Uso: python scripts/limpieza_wp.py   (requiere el respaldo previo de scripts/respaldo_wp.py)
"""
from wp_api import WP

PAGINAS_VIEJAS = [896, 898, 900, 902, 2137, 2139]
PLUGINS_DESACTIVAR = ("Spectra", "Plantillas de inicio", "Hello Dolly")


def main():
    wp = WP()

    for pid in PAGINAS_VIEJAS:
        wp.request("POST", f"wp/v2/pages/{pid}", {"status": "draft"})
    print(f"Páginas viejas en borrador: {len(PAGINAS_VIEJAS)}")

    for post in wp.get_all("wp/v2/posts", status="any", context="edit"):
        if post["slug"] in ("hello-world", "hola-mundo"):
            wp.request("DELETE", f"wp/v2/posts/{post['id']}")
            print(f"Entrada de ejemplo a la papelera: {post['id']}")

    comentarios = wp.get_all("wp/v2/comments", status="hold", context="edit")
    for c in comentarios:
        wp.request("DELETE", f"wp/v2/comments/{c['id']}")
    print(f"Comentarios spam a la papelera: {len(comentarios)}")

    for p in wp.get("wp/v2/plugins"):
        if p["name"] in PLUGINS_DESACTIVAR and p["status"] == "active":
            wp.request("POST", f"wp/v2/plugins/{p['plugin']}", {"status": "inactive"})
            print(f"Plugin desactivado: {p['name']}")

    print("\nEstado final:")
    print("  Páginas publicadas:", [p["slug"] for p in wp.get_all("wp/v2/pages", status="publish")])
    print("  Comentarios pendientes:", len(wp.get_all("wp/v2/comments", status="hold", context="edit")))
    print("  Plugins activos:", [p["name"] for p in wp.get("wp/v2/plugins") if p["status"] == "active"])


if __name__ == "__main__":
    main()
