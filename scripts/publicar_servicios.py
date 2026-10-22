"""Páginas de servicio (páginas pilar para SEO) de grupogye.com.

Lee contenido/paginas/<slug>.json (texto) y arma cada página con el mismo diseño de la portada:
encabezado, pie, modo claro/oscuro, botón de WhatsApp y "Cotizar este servicio" (abre el cotizador
de la portada con el servicio preseleccionado: /?servicio=<linea>#cotizar).

  python scripts/publicar_servicios.py --preview     → fuentes/servicios-preview/<slug>.html
  python scripts/publicar_servicios.py               → crea/actualiza las páginas en WordPress como BORRADOR
  python scripts/publicar_servicios.py --revision    → las publica con noindex para que la empresa las revise en la web
  python scripts/publicar_servicios.py --publicar    → las publica e indexables (tras la aprobación de la empresa)
"""
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from publicar_v3 import CSS_ASTRA, CSS_RESET_ASTRA, script_seguro, svg_data_uri  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
V3 = ROOT / "prototipo" / "v3"
PAGINAS = ROOT / "contenido" / "paginas"
SITIO = "https://grupogye.com"
WA = "https://wa.me/573126523638"

CSS_PAGINA = """
.svc-hero{background:var(--ink);color:#fff;position:relative;overflow:hidden}
.svc-hero .wrap{padding-top:var(--s6);padding-bottom:var(--s6)}
.crumbs{font:500 13px/1.4 var(--f-mono);letter-spacing:.04em;text-transform:uppercase;color:var(--muted-dark);margin:0 0 var(--s4);display:flex;flex-wrap:wrap;gap:8px}
.crumbs a{color:var(--muted-dark);text-decoration:none}.crumbs a:hover{color:#fff;text-decoration:underline}
.svc-hero h1{font:800 clamp(40px,6vw,76px)/.95 var(--f-display);text-transform:uppercase;max-width:15em}
.svc-hero .lead{color:#C9CED3;font-size:clamp(17px,1.6vw,20px);max-width:40em;margin-top:var(--s4)}
.svc-hero .ctas{display:flex;flex-wrap:wrap;gap:var(--s3);margin-top:var(--s5)}
.svc-main{padding:var(--s6) 0}
.svc-main .wrap{display:grid;gap:var(--s5)}
@media (min-width:1000px){.svc-main .wrap{grid-template-columns:minmax(0,1fr) 340px;align-items:start}}
.svc-art h2{font:700 clamp(28px,3.4vw,40px)/1.05 var(--f-display);text-transform:uppercase;margin:var(--s5) 0 var(--s3)}
.svc-art h2:first-child{margin-top:0}
.svc-art p{color:var(--text);margin:0 0 var(--s3);max-width:46em}
.svc-art ul{margin:0 0 var(--s3);padding:0;list-style:none;display:grid;gap:8px;max-width:46em}
.svc-art li{padding-left:22px;position:relative}
.svc-art li::before{content:"";position:absolute;left:0;top:.62em;width:9px;height:9px;background:var(--clay)}
.svc-side{display:grid;gap:var(--s3)}
@media (min-width:1000px){.svc-side{position:sticky;top:calc(var(--hdr) + 24px)}}
.svc-card{background:var(--paper);border:1px solid var(--line);border-top:4px solid var(--clay);padding:var(--s4)}
.svc-card h2{font:700 20px/1.1 var(--f-display);text-transform:uppercase;margin:0 0 var(--s3)}
.svc-card ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:15px}
.svc-card li{padding-left:18px;position:relative}
.svc-card li::before{content:"✓";position:absolute;left:0;color:var(--ok);font-weight:700}
.svc-card .btn{width:100%;margin-top:var(--s3)}
.svc-card p{color:var(--muted);font-size:15px}
.svc-rel{padding:0 0 var(--s6)}
.svc-rel h2,.svc-faq h2{font:700 clamp(28px,3.4vw,40px)/1.05 var(--f-display);text-transform:uppercase;margin:0 0 var(--s4)}
.svc-rel .proj{cursor:default;min-height:0}
@media (min-width:700px){.svc-rel .proj-grid{grid-template-columns:repeat(2,1fr)}}
.svc-rel .proj:hover{transform:none}
.svc-faq{padding:0 0 var(--s6)}
.svc-links{display:flex;flex-wrap:wrap;gap:var(--s2);margin-top:var(--s5)}
.svc-links a{border:1.5px solid var(--line);background:var(--paper);padding:10px 14px;text-decoration:none;font-weight:500;font-size:15px}
.svc-links a:hover{border-color:var(--text)}
.svc-links a::first-letter{text-transform:uppercase}
.svc-cta{background:var(--ink);color:#fff;padding:var(--s6) 0}
.svc-cta .wrap{display:grid;gap:var(--s4);align-items:center}
@media (min-width:900px){.svc-cta .wrap{grid-template-columns:1fr auto}}
.svc-cta h2{font:800 clamp(32px,4.4vw,52px)/1 var(--f-display);text-transform:uppercase;margin:0 0 var(--s3)}
.svc-cta p{color:var(--muted-dark);max-width:40em}
.svc-cta .ctas{display:flex;flex-wrap:wrap;gap:var(--s3)}
"""
TIPOS = {"consultoria": "Consultoría", "interventoria": "Interventoría", "obra": "Obra"}


def e(texto):
    return html.escape(texto, quote=True)


def cargar(nombre):
    return json.loads((ROOT / "contenido" / nombre).read_text(encoding="utf-8"))


def piezas_portada():
    """Encabezado y pie de la portada, con enlaces de sección apuntando a la portada."""
    idx = (V3 / "index.html").read_text(encoding="utf-8")
    header = re.search(r'<header class="hdr">.*?</header>', idx, re.S).group(0)
    footer = re.search(r'<footer class="on-dark">.*?</footer>', idx, re.S).group(0)
    def a_portada(s):
        s = re.sub(r'href="#(?!")', 'href="/#', s)
        return s.replace('href="#"', 'href="/"').replace('href="/#contenido"', 'href="/"')
    header, footer = a_portada(header), a_portada(footer)
    for svg in ("marca/logo-ge.svg", "marca/logo-ge-negativo.svg"):
        header = header.replace("../../assets/" + svg, svg_data_uri(svg))
        footer = footer.replace("../../assets/" + svg, svg_data_uri(svg))
    # notas internas del prototipo fuera del sitio publicado
    footer = re.sub(r' · NIT <span class="tbd">por confirmar</span>', "", footer)
    footer = re.sub(r' title="[^"]*"', "", footer)
    return header, footer


NOMBRE_CORTO = {"estudio-de-suelos": "Estudio de suelos", "estudios-geotecnicos": "Estudios geotécnicos",
                "pilotes-y-micropilotes": "Pilotes y micropilotes", "estabilidad-de-taludes": "Estabilidad de taludes",
                "vulnerabilidad-sismica-reforzamiento": "Vulnerabilidad sísmica"}


def lista_servicios_pie(paginas):
    return "".join(f'<li><a href="/{p["slug"]}/">{e(NOMBRE_CORTO.get(p["slug"], p["h1"]))}</a></li>' for p in paginas)


def jsonld(p, servicio_nombre):
    url = f"{SITIO}/{p['slug']}/"
    datos = [
        {"@context": "https://schema.org", "@type": "Service", "name": p["h1"], "serviceType": servicio_nombre,
         "description": p["meta_description"], "url": url, "areaServed": {"@type": "Country", "name": "Colombia"},
         "provider": {"@type": "ProfessionalService", "@id": f"{SITIO}/#empresa", "name": "Grupo G&E S.A.S.", "url": SITIO + "/"}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
            {"@type": "ListItem", "position": 2, "name": "Servicios", "item": SITIO + "/#servicios"},
            {"@type": "ListItem", "position": 3, "name": p["h1"], "item": url}]},
    ]
    if p.get("faq"):
        datos.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": f["pregunta"], "acceptedAnswer": {"@type": "Answer", "text": f["respuesta"]}} for f in p["faq"]]})
    return "".join(f'<script type="application/ld+json">{json.dumps(d, ensure_ascii=False)}</script>' for d in datos)


def cuerpo(p, paginas, proyectos, servicio_nombre):
    cotizar = f"/?servicio={p['linea']}#cotizar"
    secciones = ""
    for s in p["secciones"]:
        secciones += f"<h2>{e(s['h2'])}</h2>" + "".join(f"<p>{e(x)}</p>" for x in s.get("parrafos", []))
        if s.get("lista"):
            secciones += "<ul>" + "".join(f"<li>{e(x)}</li>" for x in s["lista"]) + "</ul>"
    otros = {q["slug"]: q for q in paginas}
    enlaces = "".join(f'<a href="/{l["slug"]}/">{e(l["texto"])}</a>' for l in p.get("enlaces_internos", []) if l["slug"] in otros)
    rel = [proyectos[i] for i in p.get("proyectos_relacionados", []) if i in proyectos]
    tarjetas = "".join(
        f'<article class="proj" style="--c:var(--g-blue)"><div class="proj-meta mono"><span class="tag">{e(TIPOS.get(x["tipo"], x["tipo"]))}</span>'
        f'<span>{e(x.get("municipio") or "Colombia")}</span></div><h3>{e(x["titulo_corto"])}</h3><p class="client">{e(x["cliente"])}</p></article>'
        for x in rel)
    faq = "".join(f"<details><summary>{e(f['pregunta'])}</summary><p>{e(f['respuesta'])}</p></details>" for f in p.get("faq", []))
    incluye = "".join(f"<li>{e(x)}</li>" for x in p.get("incluye", []))
    return f"""
<section class="svc-hero on-dark" aria-labelledby="h1">
  <div class="wrap">
    <nav class="crumbs" aria-label="Ruta"><a href="/">Inicio</a><span aria-hidden="true">›</span><a href="/#servicios">Servicios</a><span aria-hidden="true">›</span><span aria-current="page">{e(servicio_nombre)}</span></nav>
    <h1 id="h1">{e(p['h1'])}</h1>
    <p class="lead">{e(p['bajada'])}</p>
    <div class="ctas"><a class="btn btn-clay" href="{cotizar}">Cotizar este servicio</a><a class="btn btn-line" href="{WA}" target="_blank" rel="noopener">Escribir por WhatsApp</a></div>
  </div>
</section>
<div class="stripe-bar" aria-hidden="true"></div>
<section class="svc-main">
  <div class="wrap">
    <article class="svc-art">{secciones}
      {f'<nav class="svc-links" aria-label="Servicios relacionados">{enlaces}</nav>' if enlaces else ''}
    </article>
    <aside class="svc-side">
      <div class="svc-card"><h2>Qué incluye</h2><ul>{incluye}</ul><a class="btn btn-clay" href="{cotizar}">Cotizar este servicio</a></div>
      <div class="svc-card" style="border-top-color:var(--g-green)"><h2>Respuesta en 24 horas</h2><p>Cuéntenos ubicación, tipo de obra y área. Le respondemos en menos de 24 horas con una propuesta técnica y económica.</p></div>
    </aside>
  </div>
</section>
{f'<section class="svc-rel" aria-labelledby="h-rel"><div class="wrap"><h2 id="h-rel">Proyectos relacionados</h2><div class="proj-grid">{tarjetas}</div></div></section>' if tarjetas else ''}
{f'<section class="svc-faq" aria-labelledby="h-faq"><div class="wrap"><h2 id="h-faq">Preguntas frecuentes</h2><div class="faq">{faq}</div></div></section>' if faq else ''}
<section class="svc-cta on-dark" aria-labelledby="h-cta">
  <div class="wrap">
    <div><h2 id="h-cta">{e(p['cta']['titulo'])}</h2><p>{e(p['cta']['texto'])}</p></div>
    <div class="ctas"><a class="btn btn-clay" href="{cotizar}">Cotizar ahora</a><a class="btn btn-wa" href="{WA}" target="_blank" rel="noopener">WhatsApp</a></div>
  </div>
</section>"""


def paginas_servicio():
    return [json.loads(f.read_text(encoding="utf-8")) for f in sorted(PAGINAS.glob("*.json"))]


# Metadatos de Astra para que no dibuje su encabezado, pie ni título (el sitio usa los suyos)
META_ASTRA = {"ast-global-header-display": "disabled", "footer-sml-layout": "disabled", "site-post-title": "disabled",
              "site-content-layout": "page-builder", "site-sidebar-layout": "no-sidebar", "ast-breadcrumbs-content": "disabled"}


def envolver(contenido, paginas, extra_head="", css_extra=""):
    """Marco común de las páginas interiores: estilos, encabezado, pie, WhatsApp y JS del sitio."""
    header, footer = piezas_portada()
    footer = footer.replace('<ul id="footSvc"></ul>', f"<ul>{lista_servicios_pie(paginas)}</ul>")
    idx = (V3 / "index.html").read_text(encoding="utf-8")
    head = idx.split("<body>", 1)[0]
    scripts_head = "\n".join(script_seguro(c) for c in re.findall(r"<script>(.*?)</script>", head, flags=re.S))
    fuentes = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^"]+" rel="stylesheet">', head).group(0)
    css = CSS_RESET_ASTRA + (V3 / "styles.css").read_text(encoding="utf-8") + CSS_ASTRA + CSS_PAGINA + css_extra
    wa = (f'<a class="wa" href="{WA}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp a Grupo G&amp;E">'
          + re.search(r'<a class="wa"[^>]*>(.*?)</a>', idx, re.S).group(1) + "</a>")
    js = (V3 / "pagina.js").read_text(encoding="utf-8")
    return (f"{scripts_head}\n{fuentes}\n<style>{css}</style>\n{extra_head}\n"
            f'<div class="gye-v3"><a class="skip" href="#contenido">Saltar al contenido</a>{header}'
            f'<main id="contenido">{contenido}</main>{footer}{wa}</div>\n{script_seguro(js)}')


def construir(p, paginas, proyectos, servicios):
    servicio_nombre = servicios[p["linea"]]["nombre"]
    return envolver(cuerpo(p, paginas, proyectos, servicio_nombre), paginas, jsonld(p, servicio_nombre))


def main():
    paginas = paginas_servicio()
    servicios = {s["slug"]: s for s in cargar("servicios.json")["servicios"]}
    pj = cargar("proyectos.json")
    proyectos = {x["id"]: x for x in (pj["proyectos"] if isinstance(pj, dict) else pj) if x.get("publicar", True)}
    for p in paginas:   # nunca un proyecto no publicable en una página de servicio
        p["proyectos_relacionados"] = [i for i in p.get("proyectos_relacionados", []) if i in proyectos]

    if "--preview" in sys.argv:
        out = ROOT / "fuentes" / "servicios-preview"
        out.mkdir(parents=True, exist_ok=True)
        for p in paginas:
            titulo = e(p["title"])
            (out / f"{p['slug']}.html").write_text(
                f'<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                f'<title>{titulo}</title></head><body style="margin:0">{construir(p, paginas, proyectos, servicios)}</body></html>', encoding="utf-8")
            print(out / f"{p['slug']}.html")
        return

    from wp_api import WP
    wp = WP()
    # --revision: publicadas para que la empresa las revise en la web, con noindex (Slim SEO las saca de Google y del sitemap)
    # --publicar: publicadas e indexables, tras la aprobación
    estado = "publish" if ("--publicar" in sys.argv or "--revision" in sys.argv) else "draft"
    noindex = "--publicar" not in sys.argv
    meta = META_ASTRA
    for p in paginas:
        # WordPress arma el <title> como "título – Grupo G&E": se quita el sufijo de marca del título SEO
        titulo = re.sub(r"\s*\|\s*Grupo G&E\s*$", "", p["title"])
        seo = {"title": p["title"], "description": p["meta_description"], "noindex": 1 if noindex else 0}
        datos = {"title": titulo, "slug": p["slug"], "status": estado, "meta": dict(meta, slim_seo=seo),
                 "content": "<!-- wp:html -->\n" + construir(p, paginas, proyectos, servicios) + "\n<!-- /wp:html -->"}
        existente = wp.get("wp/v2/pages", slug=p["slug"], status="any", context="edit")
        if existente:
            pagina, _ = wp.request("POST", f"wp/v2/pages/{existente[0]['id']}", datos)
        else:
            pagina, _ = wp.request("POST", "wp/v2/pages", datos)
        print(f"{estado:7}{' (noindex)' if estado == 'publish' and noindex else ''} {pagina['link']}")


if __name__ == "__main__":
    main()
