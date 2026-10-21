import os, shutil, json
from PIL import Image
A = r"C:\Users\LeNoVo\Desktop\grupo-gye-web\assets"
O = os.path.join(A, "originales"); W = os.path.join(A, "web")
CL = os.path.join(A, "clientes"); MA = os.path.join(A, "marca")

# original -> (nombre_base, tipo, pagina_str, uso, alt)
FOTOS = {
 "p1-1.jpeg": ("operario-equipo-perforacion-portada", "equipo", 1, "equipamiento",
   "Operario junto a equipo de perforación naranja en obra al aire libre"),
 "p2-2.jpeg": ("perforacion-en-campo", "obra", 2, "construccion",
   "Equipo de perforación en campo con operarios con cascos en ladera verde"),
 "p2-3.jpeg": ("mapa-geologico", "mapa", 2, "capacidades",
   "Mapa geológico con unidades de suelo en colores y trazado de cauce de río"),
 "p4-2.jpeg": ("perforacion-roto-percusion", "equipo", 4, "equipamiento",
   "Operarios manejando equipo de perforación a roto-percusión en zona boscosa"),
 "p4-4.jpeg": ("sismografo-abem", "equipo", 4, "equipamiento",
   "Sismógrafo ABEM naranja y negro con pantalla de registro"),
 "p5-2.jpeg": ("talud-con-llenos", "obra", 5, "capacidades",
   "Talud de suelo con llenos y cuneta de concreto en vía de montaña"),
 "p5-3.jpeg": ("diagrama-contencion-anclajes", "diagrama", 5, "capacidades",
   "Sección de talud con anclajes y cargas de diseño en kN/m²"),
 "p5-4.jpeg": ("modelo-estabilidad-taludes", "diagrama", 5, "capacidades",
   "Modelo numérico de estabilidad de talud con mapa de colores de desplazamientos"),
 "p5-5.jpeg": ("tomografia-electrica", "ensayo", 5, "capacidades",
   "Sección de tomografía eléctrica con distribución de resistividad en ohm·m"),
 "p5-6.jpeg": ("ensayo-gpr-calle", "ensayo", 5, "capacidades",
   "Operarios realizando ensayo de georradar GPR sobre calle pavimentada"),
 "p5-8.jpeg": ("pozo-agua-visto-desde-arriba", "obra", 5, "capacidades",
   "Pozo de agua visto desde arriba con paredes de concreto"),
 "p5-9.jpeg": ("planta-industrial", "obra", 5, "proyectos",
   "Planta industrial con torres de proceso y vehículos en patio"),
 "p5-10.jpeg": ("diagrama-3d-cimentacion", "diagrama", 5, "capacidades",
   "Diagrama 3D de cimentación con cotas y zapata en rojo"),
 "p6-2.jpeg": ("micropilotes-ladera-1", "obra", 6, "construccion",
   "Equipo de micropilotes en ladera con operarios y barrenas"),
 "p6-3.jpeg": ("micropilotes-ladera-2", "obra", 6, "construccion",
   "Equipo de perforación sobre ladera bajo cielo azul durante construcción de micropilotes"),
 "p6-4.jpeg": ("micropilotes-ladera-3", "obra", 6, "construccion",
   "Operario supervisando perforación de micropilote con equipo azul en ladera"),
 "p6-5.jpeg": ("micropilotes-ladera-4", "obra", 6, "construccion",
   "Cuadrilla instalando armadura de micropilote en ladera con andamio de madera"),
 "p9-18.jpeg": ("estructura-industrial", "obra", 9, "proyectos",
   "Operarios trabajando en altura dentro de estructura industrial metálica"),
 "p9-19.jpeg": ("perforacion-puerto-contenedores", "obra", 9, "proyectos",
   "Equipo de perforación en patio de puerto junto a contenedores apilados"),
 "p9-20.jpeg": ("nucleo-perforacion", "ensayo", 9, "capacidades",
   "Núcleo de perforación cilíndrico extraído del terreno sobre superficie blanca"),
}
LOGOS = {
 "p9-2.png": "pricesmart", "p9-3.png": "idom", "p9-5.png": "double-designs",
 "p9-6.png": "antioquia-gold", "p9-7.png": "edu", "p9-9.png": "la-cimarrona",
 "p9-10.png": "bioexplora", "p9-12.png": "cliente-logo-a-roja", "p9-13.png": "aqua-y-terra",
 "p9-14.png": "mc-arquitectos", "p9-15.png": "epm", "p9-16.png": "arquitectura-concreto",
 "p9-17.png": "acca",
}
def ladodeimg(im): return max(im.size)
def calidad(lado):
    if lado >= 1200:
        return "alta"
    if lado >= 700:
        return "media"
    return "baja"

out = []
for orig, (base, tipo, pag, uso, alt) in FOTOS.items():
    im = Image.open(os.path.join(O, orig))
    w0, h0 = im.size
    im = im.convert("RGB") if im.mode not in ("RGB","RGBA") else im
    lg = im.copy(); lg.thumbnail((1600, 1600), Image.LANCZOS)
    sm = im.copy(); sm.thumbnail((800, 800), Image.LANCZOS)
    fl, fs = f"{base}-lg.webp", f"{base}-sm.webp"
    lg.save(os.path.join(W, fl), "WEBP", quality=80, method=6)
    sm.save(os.path.join(W, fs), "WEBP", quality=80, method=6)
    out.append({"archivo_lg": fl, "archivo_sm": fs, "original": orig, "pagina": pag,
                "ancho": w0, "alto": h0, "tipo": tipo, "alt": alt, "uso_sugerido": uso,
                "calidad": calidad(ladodeimg(im))})

logos = []
for orig, nombre in LOGOS.items():
    im = Image.open(os.path.join(O, orig)); w0, h0 = im.size
    if w0 > 400:
        im = im.resize((400, round(h0*400/w0)), Image.LANCZOS)
    im.save(os.path.join(CL, f"{nombre}.png"), "PNG", optimize=True)
    logos.append({"archivo": f"clientes/{nombre}.png", "original": orig, "ancho_original": w0, "alto_original": h0, "tipo": "logo-cliente"})
shutil.copy(os.path.join(O, "p1-2.png"), os.path.join(MA, "logo-ge.png"))
logos.append({"archivo": "marca/logo-ge.png", "original": "p1-2.png", "ancho_original": 826, "alto_original": 330, "tipo": "logo-ge"})
json.dump({"imagenes": out, "logos": logos}, open(os.path.join(A, "_scripts", "_draft.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "fotos;", len(logos), "logos")
for o in out: print(o["archivo_lg"], o["ancho"], o["alto"], o["calidad"])
