"""Genera data.js para el prototipo v3 a partir de contenido/*.json y assets/imagenes.json.

Uso:  python build-data.py   (desde cualquier carpeta)
El prototipo se abre como archivo local, así que los datos se cargan como script (fetch no funciona en file://).
En WordPress estos datos pasan a ser tipos de contenido (Servicio, Proyecto) y opciones del tema.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

CLIENT_LOGOS = {  # archivo en assets/clientes → nombre visible
    "pricesmart.png": "PriceSmart", "epm.png": "EPM", "idom.png": "IDOM",
    "antioquia-gold.png": "Antioquia Gold", "edu.png": "EDU · Empresa de Desarrollo Urbano",
    "arquitectura-concreto.png": "Arquitectura & Concreto", "bioexplora.png": "Bioexplora",
    "aqua-y-terra.png": "aqua&terra", "mc-arquitectos.png": "MC Arquitectos", "acca.png": "ACCA",
    "la-cimarrona.png": "La Cimarrona E.S.P.", "double-designs.png": "Double C Designs",
}


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def main():
    empresa = load("contenido/empresa.json")
    servicios = load("contenido/servicios.json")
    proyectos = load("contenido/proyectos.json")
    imagenes = load("assets/imagenes.json")

    imgs = {}
    for i in imagenes["imagenes"]:
        key = i["archivo_lg"].split("/")[-1].replace("-lg.webp", "")
        imgs[key] = {
            "lg": "../../assets/web/" + i["archivo_lg"].split("/")[-1],
            "sm": "../../assets/web/" + i["archivo_sm"].split("/")[-1],
            "alt": i["alt"], "w": i["ancho"], "h": i["alto"],
        }

    data = {
        "empresa": {k: empresa[k] for k in ("nombre", "perfil", "mision", "vision", "contacto",
                                            "capacidades_campo", "equipos", "cifras")},
        "servicios": servicios["servicios"],
        "otros": servicios["otros_servicios"]["items"],
        "proyectos": proyectos["proyectos"] if isinstance(proyectos, dict) else proyectos,
        "imagenes": imgs,
        "clientes": [{"nombre": n, "logo": "../../assets/clientes/" + f.replace(".png", ".webp")}
                     for f, n in CLIENT_LOGOS.items() if (ROOT / "assets/clientes" / f).exists()],
    }
    out = HERE / "data.js"
    out.write_text("/* Generado por build-data.py — no editar a mano */\nwindow.GYE = "
                   + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"data.js: {len(data['servicios'])} servicios, {len(data['proyectos'])} proyectos, "
          f"{len(imgs)} imágenes, {len(data['clientes'])} clientes")


if __name__ == "__main__":
    main()
