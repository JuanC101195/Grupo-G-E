"""Política de Tratamiento de Datos Personales (Ley 1581 de 2012) para grupogye.com.

Se guarda como BORRADOR para que la empresa la apruebe (y, idealmente, la revise su asesor jurídico).
  python scripts/politica_datos.py            → crea/actualiza el borrador en WordPress
  python scripts/politica_datos.py --publicar → la publica (solo tras la aprobación de la empresa)
"""
import sys

from wp_api import WP

SLUG = "politica-de-privacidad"
VIGENCIA = "21 de octubre de 2026"
NIT = "901017577-0"
CORREO = "gyeconsultoriaintegral@gmail.com"

SECCIONES = [
    ("1. Responsable del tratamiento",
     f"<p><strong>GRUPO G&amp;E S.A.S.</strong>, NIT {NIT}, con domicilio en la Carrera 81A #47-73, barrio Floresta, Medellín, Antioquia, Colombia. "
     f"Correo para asuntos de datos personales: <a href=\"mailto:{CORREO}\">{CORREO}</a>. Teléfonos: +57 312 652 3638 y +57 324 248 9898.</p>"),
    ("2. Marco legal",
     "<p>Esta política se adopta en cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) "
     "y demás normas que los modifiquen o complementen.</p>"),
    ("3. Datos que recolectamos",
     "<p>A través del formulario de cotización, WhatsApp, correo electrónico y teléfono recolectamos: nombre, empresa, teléfono, correo electrónico, "
     "municipio del proyecto y la información técnica que usted decida compartir sobre su obra. No recolectamos datos sensibles ni datos de menores de edad.</p>"),
    ("4. Finalidades del tratamiento",
     "<ul><li>Atender solicitudes de cotización y preparar propuestas técnicas y económicas.</li>"
     "<li>Contactarlo para resolver dudas sobre su proyecto y hacer seguimiento a la propuesta.</li>"
     "<li>Ejecutar, administrar y facturar los contratos que se celebren.</li>"
     "<li>Cumplir obligaciones legales, contables y tributarias.</li>"
     "<li>Enviar información sobre nuestros servicios, solo si usted lo autoriza; puede retirar esta autorización en cualquier momento.</li></ul>"),
    ("5. Derechos de los titulares",
     "<p>Como titular de los datos usted puede: conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; "
     "ser informado sobre el uso que se les ha dado; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización "
     "o solicitar la supresión de los datos cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a ellos.</p>"),
    ("6. Cómo ejercer sus derechos",
     f"<p>Escriba a <a href=\"mailto:{CORREO}\">{CORREO}</a> indicando su nombre, documento de identidad, la solicitud concreta y un medio de respuesta.</p>"
     "<ul><li><strong>Consultas:</strong> se responden en máximo diez (10) días hábiles, prorrogables por cinco (5) días hábiles más, informando el motivo.</li>"
     "<li><strong>Reclamos</strong> (corrección, actualización, supresión o incumplimiento): se responden en máximo quince (15) días hábiles, "
     "prorrogables por ocho (8) días hábiles más, informando el motivo.</li></ul>"),
    ("7. Autorización",
     "<p>Al enviar el formulario de cotización y marcar la casilla de autorización, usted autoriza de manera previa, expresa e informada el tratamiento "
     "de sus datos para las finalidades descritas. Cuando nos contacta por WhatsApp, correo o teléfono, la autorización se entiende otorgada por conducta inequívoca.</p>"),
    ("8. Encargados y transferencias",
     "<p>Para operar el sitio web y el correo usamos proveedores de alojamiento y de correo electrónico que actúan como encargados del tratamiento "
     "y pueden almacenar la información en servidores fuera de Colombia, con medidas de seguridad adecuadas. No vendemos ni cedemos sus datos a terceros.</p>"),
    ("9. Seguridad y conservación",
     "<p>Aplicamos medidas técnicas y administrativas razonables para proteger la información contra pérdida, acceso o uso no autorizado. "
     "Conservamos los datos durante el tiempo necesario para cumplir las finalidades y las obligaciones legales.</p>"),
    ("10. Vigencia y cambios",
     f"<p>Esta política rige desde el {VIGENCIA}. Cualquier cambio sustancial se publicará en esta misma página.</p>"),
]

CSS = """
.gye-legal{max-width:820px;margin:0 auto;padding:48px 20px 80px;color:#0F202D;font:400 17px/1.7 "IBM Plex Sans",system-ui,sans-serif}
.gye-legal h1{font:800 clamp(32px,5vw,48px)/1.05 "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;margin:0 0 8px}
.gye-legal h2{font:700 22px/1.2 "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;margin:36px 0 8px}
.gye-legal a{color:#B84A10}
.gye-legal .meta{color:#4E5D6A;font-size:14px;margin-bottom:24px}
.gye-legal .volver{display:inline-block;margin-bottom:24px;font-weight:600;text-decoration:none}
"""


def html():
    cuerpo = "".join(f"<h2>{t}</h2>{c}" for t, c in SECCIONES)
    return (f'<style>@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=IBM+Plex+Sans:wght@400;600&display=swap");{CSS}</style>'
            f'<article class="gye-legal"><a class="volver" href="/">← Volver a Grupo G&amp;E</a>'
            f'<h1>Política de tratamiento de datos personales</h1><p class="meta">Vigente desde el {VIGENCIA}</p>{cuerpo}</article>')


def main():
    wp = WP()
    estado = "publish" if "--publicar" in sys.argv else "draft"
    data = {"title": "Política de tratamiento de datos personales", "slug": SLUG, "status": estado,
            "content": "<!-- wp:html -->\n" + html() + "\n<!-- /wp:html -->",
            "meta": {"site-post-title": "disabled", "site-content-layout": "page-builder", "site-sidebar-layout": "no-sidebar"}}
    # reutiliza la página de privacidad que trae WordPress (id 3) en lugar de crear otra
    existente = wp.get("wp/v2/pages", slug=SLUG, status="any", context="edit") or wp.get("wp/v2/pages", slug="privacy-policy", status="any", context="edit")
    if existente:
        page, _ = wp.request("POST", f"wp/v2/pages/{existente[0]['id']}", data)
    else:
        page, _ = wp.request("POST", "wp/v2/pages", data)
    print(f"Página {page['id']} ({estado}): {page['link']}")


if __name__ == "__main__":
    main()
