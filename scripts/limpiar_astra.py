"""Quita los restos de la plantilla vieja de Astra que se ven en páginas que no son nuestras (p. ej. el error 404).

- Widgets activos (barra lateral y pie: boletín en inglés, "Administrador del sitio", imagen) → inactivos (no se borran)
- Menús "Primary" y "Footer": sus enlaces a páginas viejas se reemplazan por las secciones del sitio nuevo
Uso: python scripts/limpiar_astra.py
"""
from wp_api import WP

SECCIONES = [("Inicio", "/"), ("Servicios", "/#servicios"), ("Proyectos", "/#proyectos"),
             ("Nosotros", "/#nosotros"), ("Cotizar", "/#cotizar")]


def main():
    wp = WP()
    base = wp.base.replace("/wp-json/", "")

    activos = [w for w in wp.get("wp/v2/widgets", context="edit") if w["sidebar"] != "wp_inactive_widgets"]
    for w in activos:
        wp.request("POST", f"wp/v2/widgets/{w['id']}", {"sidebar": "wp_inactive_widgets"})
    print(f"Widgets desactivados: {len(activos)}")

    for menu in wp.get("wp/v2/menus", context="edit"):
        items = [i for i in wp.get_all("wp/v2/menu-items", context="edit", menus=menu["id"])]
        for i in items:
            wp.request("DELETE", f"wp/v2/menu-items/{i['id']}", force="true")
        for orden, (titulo, ruta) in enumerate(SECCIONES, 1):
            wp.request("POST", "wp/v2/menu-items", {"title": titulo, "url": base + ruta, "type": "custom",
                                                    "menus": menu["id"], "menu_order": orden, "status": "publish"})
        print(f"Menú «{menu['name']}»: {len(items)} enlaces viejos → {len(SECCIONES)} secciones nuevas")


if __name__ == "__main__":
    main()
