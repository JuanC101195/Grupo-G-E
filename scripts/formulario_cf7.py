"""Formulario de cotización en Contact Form 7: recibe los envíos del cotizador de la página y los manda por correo.

  python scripts/formulario_cf7.py            → crea o actualiza el formulario y muestra su id
  python scripts/formulario_cf7.py --prueba   → además hace UN envío de prueba real (llega al correo de destino)
"""
import json
import sys

import urllib.request

from wp_api import WP

TITULO = "Cotización web"
DESTINO = "gyeconsultoriaintegral@gmail.com"   # pedido de la empresa: los buzones @grupogye.com a veces fallan
CAMPOS = """[text* servicio]
[text* ciudad]
[text* tipo]
[text area]
[text pisos]
[text plazo]
[textarea detalle]
[text* nombre]
[text empresa]
[tel* tel]
[email* email]
[acceptance habeas]"""
CUERPO = """Nueva solicitud de cotización desde grupogye.com

Servicio: [servicio]
Municipio: [ciudad]
Tipo de obra: [tipo]
Área aproximada: [area]
Pisos y sótanos: [pisos]
Plazo: [plazo]
Detalles:
[detalle]

Nombre: [nombre]
Empresa: [empresa]
Teléfono / WhatsApp: [tel]
Correo: [email]

Autorizó el tratamiento de datos (Ley 1581 de 2012).
Para responder, use "Responder": va directo al correo de la persona."""


def datos_formulario():
    return {
        "title": TITULO, "locale": "es_CO", "form": CAMPOS,
        "mail": {
            "subject": "Cotización web: [servicio] · [ciudad] · [nombre]",
            "sender": "Grupo G&E Web <wordpress@grupogye.com>",
            "recipient": DESTINO, "body": CUERPO,
            "additional_headers": "Reply-To: [nombre] <[email]>",
            "attachments": "", "use_html": False, "exclude_blank": True,
        },
        "mail_2": {"active": False},
    }


def envio_prueba(base, form_id):
    """Envía como lo haría un visitante (sin credenciales) al endpoint público de CF7."""
    campos = {
        "_wpcf7": str(form_id), "_wpcf7_version": "6.2.3", "_wpcf7_locale": "es_CO",
        "_wpcf7_unit_tag": f"wpcf7-f{form_id}-o1", "_wpcf7_container_post": "0",
        "servicio": "[PRUEBA] Estudio de suelos", "ciudad": "Medellín", "tipo": "Edificio",
        "area": "1200", "pisos": "8 pisos", "plazo": "Sin definir",
        "detalle": "Envío de prueba de la página web. Puede ignorarse.",
        "nombre": "PRUEBA página web", "empresa": "", "tel": "3000000000",
        "email": "gyeconsultoriaintegral@gmail.com", "habeas": "1",
    }
    url = base + f"contact-form-7/v1/contact-forms/{form_id}/feedback"
    boundary = "----gyeprueba7f3a"   # CF7 solo acepta multipart/form-data, como el navegador
    body = "".join(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n' for k, v in campos.items())
    body += f"--{boundary}--\r\n"
    req = urllib.request.Request(url, data=body.encode("utf-8"), method="POST",
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "User-Agent": "grupogye-web/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def main():
    wp = WP()
    existentes = [f for f in wp.get("contact-form-7/v1/contact-forms") if f["title"] in (TITULO, "Contact form 1")]
    propio = next((f for f in existentes if f["title"] == TITULO), None)
    datos = dict(datos_formulario(), context="save")   # sin context=save, CF7 responde OK pero no guarda
    if propio:
        form, _ = wp.request("POST", f"contact-form-7/v1/contact-forms/{propio['id']}", datos)
    else:
        form, _ = wp.request("POST", "contact-form-7/v1/contact-forms", datos)
    if not form.get("id"):
        raise RuntimeError("Contact Form 7 no guardó el formulario")
    print(f"Formulario «{TITULO}»: id {form['id']} → envía a {DESTINO}")
    for f in existentes:   # el formulario de ejemplo que trae el plugin no se usa
        if f["title"] == "Contact form 1":
            wp.request("DELETE", f"contact-form-7/v1/contact-forms/{f['id']}")
            print("Eliminado el formulario de ejemplo del plugin")
    if "--prueba" in sys.argv:
        r = envio_prueba(wp.base, form["id"])
        print("Envío de prueba:", r.get("status"), "|", r.get("message"))
        for inv in r.get("invalid_fields") or []:
            print("  campo inválido:", inv.get("field"), inv.get("message"))


if __name__ == "__main__":
    main()
