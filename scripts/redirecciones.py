"""Redirecciones 301 de las direcciones del sitio anterior (plantilla Astra) a las secciones del sitio nuevo.
Usa la API del plugin Redirection. Es idempotente: no duplica reglas existentes.
Uso: python scripts/redirecciones.py
"""
from wp_api import WP

GRUPO = "Sitio anterior (2022–2026)"
REGLAS = {
    "/home/": "/",
    "/about/": "/#nosotros",
    "/books/": "/#proyectos",
    "/servicios/": "/#servicios",
    "/contact/": "/#cotizar",
    "/recursos/": "/#preguntas",
    "/proximamente/": "/",
    # la empresa pidió no enfocar la página solo en Medellín (22-oct-2026)
    "/estudio-de-suelos-medellin/": "/estudio-de-suelos/",
}


def instalar_redirection(wp):
    """El plugin crea sus tablas con un asistente de varios pasos (normalmente se ve en wp-admin)."""
    for _ in range(10):
        estado = {s["id"]: s["status"] for s in wp.get("redirection/v1/plugin")["status"]}
        if estado.get("db") == "good":
            res, _ = wp.request("POST", "redirection/v1/plugin/data", {})
            if not res.get("inProgress"):
                return
        else:
            wp.request("POST", "redirection/v1/plugin/data", {})
    raise RuntimeError("No se pudo completar la instalación de Redirection")


def main():
    wp = WP()
    instalar_redirection(wp)
    grupos = wp.get("redirection/v1/group")["items"]
    grupo = next((g for g in grupos if g["name"] == GRUPO), None)
    if not grupo:
        r, _ = wp.request("POST", "redirection/v1/group", {"name": GRUPO, "moduleId": 1})
        grupo = next(g for g in r["items"] if g["name"] == GRUPO)
    existentes = {x["url"] for x in wp.get("redirection/v1/redirect", per_page=200)["items"]}
    for origen, destino in REGLAS.items():
        if origen in existentes:
            print("ya existe:", origen)
            continue
        wp.request("POST", "redirection/v1/redirect", {
            "url": origen, "match_type": "url", "action_type": "url", "action_code": 301,
            "action_data": {"url": destino}, "group_id": grupo["id"], "regex": False,
            "match_data": {"source": {"flag_query": "pass", "flag_case": True, "flag_trailing": True, "flag_regex": False}},
        })
        print(f"301 {origen} → {destino}")


if __name__ == "__main__":
    main()
