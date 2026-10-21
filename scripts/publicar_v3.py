"""Publica el prototipo v3 como portada de grupogye.com (fase A: la v3 tal cual, dentro de una página).

1. Sube a Medios las imágenes que usa la v3 (una sola vez; el mapa queda en fuentes/medios-subidos.json).
2. Arma una página con un bloque HTML: estilos, contenido, datos y JS de la v3, con las rutas apuntando a Medios.
3. Aplica los ajustes de producción (sin franja de prototipo ni datos "por confirmar" a la vista).
4. La deja como portada; la página "Próximamente" pasa a borrador.

  python scripts/publicar_v3.py --preview   → genera fuentes/v3-produccion-preview.html (sin tocar WordPress)
  python scripts/publicar_v3.py --publicar
"""
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V3 = ROOT / "prototipo" / "v3"
MAPA = ROOT / "fuentes" / "medios-subidos.json"
SLUG = "inicio"
INDEX, DATA, APP, PAGES = "index.html", "data.js", "app.js", "wp/v2/pages"


def leer(p):
    return (V3 / p).read_text(encoding="utf-8")


def svg_data_uri(rel):
    return "data:image/svg+xml;base64," + base64.b64encode((ROOT / "assets" / rel).read_bytes()).decode()


def imagenes_usadas(texto):
    return sorted(set(re.findall(r"\.\./\.\./assets/((?:web|clientes)/[\w.-]+\.webp)", texto)))


def subir_medios(wp, rutas):
    mapa = json.loads(MAPA.read_text(encoding="utf-8")) if MAPA.exists() else {}
    alts = {}
    cat = json.loads((ROOT / "assets/imagenes.json").read_text(encoding="utf-8"))
    for i in cat["imagenes"]:
        alts["web/" + i["archivo_lg"]] = alts["web/" + i["archivo_sm"]] = i["alt"]
    for rel in rutas:
        if rel in mapa:
            continue
        m = wp.upload(ROOT / "assets" / rel, alts.get(rel, ""))
        mapa[rel] = m["source_url"]
        MAPA.write_text(json.dumps(mapa, ensure_ascii=False, indent=1), encoding="utf-8")
        print("  subido", rel)
    return mapa


def produccion(body):
    """Quita lo que en el prototipo marcaba datos pendientes, para no publicarlo a medias."""
    cambios = [
        (r'<div class="proto"[^>]*>.*?</div>\s*', ""),
        (r'\s*<span class="tbd" title="Confirmar autorización de uso de logos">Uso de logos por confirmar</span>\.', ""),
    ]
    for patron, nuevo in cambios:
        body, n = re.subn(patron, nuevo, body, flags=re.S)
        assert n, f"No se encontró en index.html: {patron[:60]}"
    # avisos internos que aparecían al pasar el mouse sobre datos pendientes
    # todos los title= del prototipo son notas internas sobre datos pendientes
    return re.sub(r' title="[^"]*"', "", body)


# Ajustes para convivir con el tema actual (Astra) mientras llega el tema propio
CSS_ASTRA = """
.tbd{border-bottom:0!important;cursor:auto!important}
.gye-v3{font-family:var(--f-body)}
.gye-v3 h1,.gye-v3 h2,.gye-v3 h3,.gye-v3 .display,.gye-v3 legend,.gye-v3 .faq summary{font-family:var(--f-display)!important}
.gye-v3 .hero h1,.gye-v3 footer h2,.gye-v3 .mono{font-family:var(--f-mono)!important}
.gye-v3 p,.gye-v3 li,.gye-v3 a,.gye-v3 span,.gye-v3 label,.gye-v3 input,.gye-v3 select,.gye-v3 textarea,.gye-v3 button,.gye-v3 figcaption{font-family:inherit}
.gye-v3 button:not(.btn):not(.chip):not(.link):not(.more-inc){background:none;border:0;color:inherit;padding:0;box-shadow:none}
.gye-v3 .btn,.gye-v3 .chip,.gye-v3 .link{box-shadow:none;text-transform:none;letter-spacing:normal;line-height:1}
.gye-v3 a{box-shadow:none}
.gye-v3 input,.gye-v3 select,.gye-v3 textarea{box-shadow:none;max-width:none}
.gye-v3 h1,.gye-v3 h2,.gye-v3 h3{color:inherit;clear:none}
.gye-v3 ul,.gye-v3 ol{margin:0}
.gye-v3 figure{margin:0}
.gye-v3 svg{display:block}
.gye-v3 .logo img{max-width:none}
"""


def datos_publicos(data_js):
    """Quita de data.js las notas internas de trabajo (pendientes, razones de selección) y las FAQ sin confirmar."""
    prefijo, cuerpo = data_js.split("window.GYE = ", 1)
    d = json.loads(cuerpo.rstrip().rstrip(";"))
    for s in d["servicios"]:
        s["faq"] = [f for f in s.get("faq", []) if not f.get("pendiente_confirmar")]

    def limpiar(x):
        if isinstance(x, dict):
            return {k: limpiar(v) for k, v in x.items() if not k.startswith(("pendiente", "nota", "razon_"))}
        if isinstance(x, list):
            return [limpiar(v) for v in x]
        return x
    return prefijo + "window.GYE = " + json.dumps(limpiar(d), ensure_ascii=False) + ";\n"


def script_seguro(codigo):
    """WordPress convierte '&&' en '&#038;&#038;' dentro del contenido y rompe el JS.
    Se publica el código en base64 y un cargador mínimo (sin '&') lo decodifica como UTF-8 y lo ejecuta."""
    b64 = base64.b64encode(codigo.encode("utf-8")).decode()
    return ("<script>(function(b){var s=atob(b),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++){u[i]=s.charCodeAt(i);}"
            f'(0,eval)(new TextDecoder().decode(u));}})("{b64}");</script>')


def construir(mapa, form=None):
    html = leer(INDEX)
    css = leer("styles.css") + CSS_ASTRA
    data = datos_publicos(leer(DATA))
    app = re.sub(r"// ?TODO[^\n]*", "", leer(APP))   # comentarios internos fuera del sitio publicado
    if form:   # conecta el cotizador al formulario de Contact Form 7 (el prototipo local queda solo con WhatsApp)
        assert "    form: null," in app
        app = app.replace("    form: null,", "    form: " + json.dumps(form) + ",", 1)

    head = html.split("<body>", 1)[0]
    body = html.split("<body>", 1)[1].split('<script src="data.js"></script>', 1)[0]
    body = produccion(body)
    scripts_head = "\n".join(script_seguro(c) for c in re.findall(r"<script>(.*?)</script>", head, flags=re.S))
    jsonld = re.search(r'<script type="application/ld\+json">.*?</script>', head, flags=re.S).group(0)
    fuentes = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^"]+" rel="stylesheet">', head).group(0)

    def rutas(texto):
        for rel, url in mapa.items():
            texto = texto.replace("../../assets/" + rel, url)
        for svg in ("marca/logo-ge.svg", "marca/logo-ge-negativo.svg", "marca/logo-ge-simbolo.svg"):
            texto = texto.replace("../../assets/" + svg, svg_data_uri(svg))
        return texto

    body, data = rutas(body), rutas(data)
    restos = re.findall(r"\.\./\.\./assets/[\w./-]+", body + data + css)
    assert not restos, f"Rutas sin resolver: {restos[:5]}"
    return (f"{scripts_head}\n{fuentes}\n<style>{css}</style>\n{jsonld}\n"
            f'<div class="gye-v3">\n{body}\n</div>\n{script_seguro(data)}\n{script_seguro(app)}')


def formulario(wp):
    """Datos del formulario «Cotización web» (lo crea scripts/formulario_cf7.py)."""
    form = next((f for f in wp.get("contact-form-7/v1/contact-forms") if f["title"] == "Cotización web"), None)
    if not form:
        raise RuntimeError("Falta el formulario: corra primero python scripts/formulario_cf7.py")
    version = next(p["version"] for p in wp.get("wp/v2/plugins") if p["plugin"].startswith("contact-form-7/"))
    return {"id": form["id"], "version": version,
            "endpoint": wp.base + f"contact-form-7/v1/contact-forms/{form['id']}/feedback"}


def main():
    if "--preview" in sys.argv:
        mapa = {rel: "../prototipo/v3/../../assets/" + rel for rel in imagenes_usadas(leer(INDEX) + leer(DATA))}
        mapa = {rel: "../assets/" + rel for rel in mapa}
        out = ROOT / "fuentes" / "v3-produccion-preview.html"
        out.write_text('<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                       f'<title>Grupo G&amp;E</title></head><body style="margin:0">{construir(mapa)}</body></html>', encoding="utf-8")
        print(out)
        return
    sys.path.insert(0, str(Path(__file__).parent))
    from wp_api import WP
    wp = WP()
    print("Subiendo imágenes…")
    mapa = subir_medios(wp, imagenes_usadas(leer(INDEX) + leer(DATA)))
    content = "<!-- wp:html -->\n" + construir(mapa, formulario(wp)) + "\n<!-- /wp:html -->"
    meta = {"ast-global-header-display": "disabled", "footer-sml-layout": "disabled", "site-post-title": "disabled",
            "site-content-layout": "page-builder", "site-sidebar-layout": "no-sidebar", "ast-breadcrumbs-content": "disabled"}
    datos = {"title": "Inicio", "slug": SLUG, "status": "publish", "content": content, "meta": meta}
    existente = wp.get(PAGES, slug=SLUG, status="any", context="edit")
    if existente:
        pagina, _ = wp.request("POST", f"wp/v2/pages/{existente[0]['id']}", datos)
    else:
        pagina, _ = wp.request("POST", PAGES, datos)
    wp.request("POST", "wp/v2/settings", {"show_on_front": "page", "page_on_front": pagina["id"]})
    for p in wp.get(PAGES, slug="proximamente", status="publish"):
        wp.request("POST", f"wp/v2/pages/{p['id']}", {"status": "draft"})
    print(f"Publicada como portada: página {pagina['id']} ({len(content) // 1024} KB)")


if __name__ == "__main__":
    main()
