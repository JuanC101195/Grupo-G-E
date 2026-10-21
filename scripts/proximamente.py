"""Página "Próximamente" de grupogye.com mientras se construye el sitio nuevo.

  python scripts/proximamente.py --preview   → genera fuentes/proximamente-preview.html para revisarla
  python scripts/proximamente.py --publicar  → crea/actualiza la página en WordPress y la deja como portada

Usa el logo vectorial (assets/marca/logo-ge-negativo.svg) en línea y los datos de contacto reales.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLUG = "proximamente"
WA = "https://wa.me/573126523638?text=" + "Hola%20Grupo%20G%26E%2C%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios."


def logo_svg():
    svg = (ROOT / "assets/marca/logo-ge-negativo.svg").read_text(encoding="utf-8")
    svg = re.sub(r"<title[^>]*>.*?</title>", "", svg, flags=re.S)
    return svg.replace("<svg ", '<svg class="gye-cs-logo" aria-hidden="true" focusable="false" ', 1)


CSS = """
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&display=swap");
.gye-cs{--ink:#0F202D;--line:#2A3F51;--muted:#A3B3C1;--signal:#F29A5E;--clay:#B84A10;
  --stripe:linear-gradient(90deg,#076035 0 25%,#266BAA 25% 50%,#623A16 50% 75%,#D85C19 75%);
  position:relative;min-height:100vh;min-height:100dvh;background:var(--ink);color:#fff;
  display:grid;place-items:center;padding:48px 20px 72px;overflow:hidden;
  font:400 17px/1.6 "IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;margin:0!important;max-width:none!important}
.gye-cs::before{content:"";position:absolute;inset:0 0 auto;height:6px;background:var(--stripe)}
.gye-cs-in{position:relative;width:100%;max-width:760px;text-align:center}
.gye-cs-logo{width:min(440px,86vw);height:auto;margin:0 auto 40px;display:block}
.gye-cs-eyebrow{font:500 13px/1.4 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--signal);margin:0 0 14px}
.gye-cs h1{font:800 clamp(34px,6vw,58px)/1 "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;margin:0 0 18px;color:#fff;letter-spacing:0}
.gye-cs-lead{color:#C9D4DD;max-width:36em;margin:0 auto 32px}
.gye-cs-ctas{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:40px}
.gye-cs-btn{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 22px;font-weight:600;font-size:15px;text-decoration:none!important;border-radius:2px;border:1.5px solid transparent}
.gye-cs-wa{background:#1A7A43;color:#fff!important}.gye-cs-wa:hover{background:#14633A}
.gye-cs-tel{border-color:#fff;color:#fff!important}.gye-cs-tel:hover{background:rgba(255,255,255,.08)}
.gye-cs-data{display:grid;gap:0;border-top:1px solid var(--line);text-align:left;max-width:560px;margin:0 auto}
.gye-cs-data div{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
.gye-cs-data span{font:500 12px/1.6 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.gye-cs-data a{color:#fff!important;overflow-wrap:anywhere}
.gye-cs-data a[href^="tel"]{white-space:nowrap}
.gye-cs a:focus-visible{outline:3px solid var(--signal);outline-offset:3px}
.gye-cs-foot{position:absolute;left:0;right:0;bottom:20px;text-align:center;font-size:13px;color:var(--muted)}
@media (prefers-reduced-motion:no-preference){.gye-cs-in{animation:gyeUp .8s cubic-bezier(.215,.61,.355,1) both}}
@keyframes gyeUp{from{opacity:0;transform:translateY(16px)}}
"""


def html():
    return f"""<style>{CSS}</style>
<main class="gye-cs">
  <div class="gye-cs-in">
    {logo_svg()}
    <p class="gye-cs-eyebrow">Consultoría geotécnica, estructural e integral · Medellín</p>
    <h1>Estamos construyendo nuestro nuevo sitio</h1>
    <p class="gye-cs-lead">Exploración, diseño, interventoría y construcción de cimentaciones para el sector industrial, público y privado. Mientras tanto, cotice con nosotros directamente.</p>
    <div class="gye-cs-ctas">
      <a class="gye-cs-btn gye-cs-wa" href="{WA}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
      <a class="gye-cs-btn gye-cs-tel" href="tel:+573126523638">Llamar +57 312 652 3638</a>
    </div>
    <div class="gye-cs-data">
      <div><span>Correo</span><a href="mailto:info@grupogye.com">info@grupogye.com</a></div>
      <div><span>Teléfonos</span><span style="color:#fff;text-transform:none;font:inherit"><a href="tel:+573126523638">+57 312 652 3638</a> · <a href="tel:+573242489898">+57 324 248 9898</a></span></div>
      <div><span>Oficina</span><a href="https://www.google.com/maps/search/?api=1&amp;query=Cra+81A+%2347-73+Medell%C3%ADn" target="_blank" rel="noopener">Cra 81A #47-73, Floresta · Medellín, Antioquia</a></div>
    </div>
  </div>
  <p class="gye-cs-foot">© 2026 Grupo G&amp;E S.A.S.</p>
</main>"""


def preview():
    out = ROOT / "fuentes" / "proximamente-preview.html"
    out.write_text('<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                   '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">'
                   f'<title>Grupo G&amp;E</title></head><body style="margin:0">{html()}</body></html>', encoding="utf-8")
    print(out)


def publicar():
    sys.path.insert(0, str(Path(__file__).parent))
    from wp_api import WP
    wp = WP()
    content = "<!-- wp:html -->\n" + html() + "\n<!-- /wp:html -->"
    meta = {  # Astra: sin encabezado, pie ni título; ancho completo
        "ast-global-header-display": "disabled", "footer-sml-layout": "disabled",
        "site-post-title": "disabled", "site-content-layout": "page-builder",
        "site-sidebar-layout": "no-sidebar", "ast-breadcrumbs-content": "disabled",
    }
    data = {"title": "Grupo G&E · Próximamente", "slug": SLUG, "status": "publish", "content": content, "meta": meta}
    existing = wp.get("wp/v2/pages", slug=SLUG, status="any", context="edit")
    if existing:
        page, _ = wp.request("POST", f"wp/v2/pages/{existing[0]['id']}", data)
    else:
        page, _ = wp.request("POST", "wp/v2/pages", data)
    wp.request("POST", "wp/v2/settings", {"show_on_front": "page", "page_on_front": page["id"]})
    print(f"Página {page['id']} publicada como portada: {page['link']}")


if __name__ == "__main__":
    if "--publicar" in sys.argv:
        publicar()
    else:
        preview()
