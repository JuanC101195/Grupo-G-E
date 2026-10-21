"""Reconstrucción vectorial del logo de Grupo G&E a partir del JPG del brochure.

Geometría (G, E, pilote y franjas) dibujada a mano sobre el original ampliado 2x;
el "&", "Group" y el bloque de texto son glifos de fuentes libres (OFL) convertidos a trazos,
así el SVG final no depende de ninguna fuente instalada.

Uso:  python generar_logo.py <carpeta_fuentes_ttf> <carpeta_salida>
Fuentes: Michroma-Regular.ttf, Tinos-Bold.ttf y Arimo[wght].ttf (google/fonts, licencia OFL).
"""
import math
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONTS = Path(sys.argv[1])
OUT = Path(sys.argv[2])

COLORS = {
    "ink": "#181818", "gray": "#808080",
    "green": "#076035", "blue": "#266BAA", "brown": "#623A16", "orange": "#D85C19",
}

# ---------------- Texto → trazos ----------------
_cache = {}


def font(name, wght=None):
    key = (name, wght)
    if key not in _cache:
        f = TTFont(FONTS / name)
        if wght is not None:
            f = instantiateVariableFont(f, {"wght": wght})
        _cache[key] = f
    return _cache[key]


def text_path(f, text, x, baseline, cap_height, tracking=0.0, sx=1.0):
    """Devuelve (d, ancho) del texto escalado para que la altura de mayúscula sea cap_height.
    sx ensancha los glifos (el logo usa una tipografía extendida)."""
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    cap = getattr(f["OS/2"], "sCapHeight", 0) or f["head"].unitsPerEm * 0.7
    s = cap_height / cap
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    cx = x
    for ch in text:
        g = cmap[ord(ch)]
        TP = TransformPen(pen, (s * sx, 0, 0, -s, cx, baseline))
        gs[g].draw(TP)
        cx += gs[g].width * s * sx + tracking
    return pen.getCommands(), cx - tracking - x


# ---------------- Geometría del símbolo (coordenadas del original x2) ----------------
def superellipse_pts(cx, cy, rx, ry, n, a0, a1, steps=120):
    """Puntos de una superelipse (lados más rectos que una elipse, como la G del logo)."""
    pts = []
    for i in range(steps + 1):
        a = math.radians(a0 + (a1 - a0) * i / steps)
        c, s = math.cos(a), math.sin(a)
        pts.append((cx + rx * math.copysign(abs(c) ** (2 / n), c),
                    cy + ry * math.copysign(abs(s) ** (2 / n), s)))
    return pts


def symbol(c, p):
    g = []
    sx = p["stem_x"]
    # Franjas de suelo: se hunden hacia el pilote desde ambos lados
    for color, (yl, yr, yb, xa, xb) in zip(("green", "blue", "brown", "orange"), p["stripes"]):
        d = (f"M{p['stripe_x0']} {yl} H{xa} "
             f"C{xa + (sx - xa) * 0.55} {yl} {sx - 16} {yb} {sx} {yb} "
             f"C{sx + 16} {yb} {xb - (xb - sx) * 0.55} {yr} {xb} {yr} "
             f"H{p['stripe_x1']}")
        g.append(f'<path d="{d}" fill="none" stroke="{c[color]}" stroke-width="{p["stripe_w"]}" stroke-linecap="round"/>')
    # G: superelipse desde el remate superior, vuelta por la izquierda, sube por la derecha hasta la barra
    gx, gy, rx, ry = p["g_center"] + p["g_radii"]
    pts = superellipse_pts(gx, gy, rx, ry, p["g_n"], p["g_a0"], p["g_a1"])
    xr = pts[-1][0]
    d = "M" + " L".join(f"{px:.1f} {py:.1f}" for px, py in pts) + f" V{p['bar_y']} H{p['bar_x0']}"
    g.append(f'<path d="{d}" fill="none" stroke="{c["ink"]}" stroke-width="{p["g_w"]}" stroke-linejoin="miter"/>')
    # Pilote: nace en la barra de la G y termina en punta
    w2, by = p["stem_w"] / 2, p["bar_y"]
    g.append(f'<path d="M{sx - w2} {by} V{p["stem_y1"]} L{sx} {p["tip_y"]} L{sx + w2} {p["stem_y1"]} V{by} Z" fill="{c["ink"]}"/>')
    # &
    d, _ = text_path(font("Jost[wght].ttf", p["amp_wght"]), "&", p["amp_x"], p["base_y"], p["amp_h"], sx=p["amp_sx"])
    g.append(f'<path d="{d}" fill="{c["gray"]}"/>')
    # E (geométrica)
    ex, et, eb, ew, es, ea = p["e_x"], p["e_top"], p["base_y"], p["e_w"], p["e_stem"], p["e_arm"]
    em = (et + eb) / 2
    g.append(f'<path d="M{ex} {et} H{ex + ew} V{et + ea} H{ex + es} V{em - ea / 2} H{ex + ew * p["e_mid"]} '
             f'V{em + ea / 2} H{ex + es} V{eb - ea} H{ex + ew} V{eb} H{ex} Z" fill="{c["ink"]}"/>')
    # Group
    d, _ = text_path(font("Tinos-Bold.ttf"), "Group", p["group_x"], p["group_y"], p["group_h"])
    g.append(f'<path d="{d}" fill="{c["ink"]}"/>')
    return "\n  ".join(g)


def wordmark(c, p):
    f = font("Michroma-Regular.ttf")
    lines = ["CONSULTORÍA", "GEOTÉCNICA", "ESTRUCTURAL", "INTEGRAL"]
    # ensanche calculado para que "ESTRUCTURAL" mida lo mismo que en el original
    _, w0 = text_path(f, "ESTRUCTURAL", 0, 0, p["wm_h"])
    tr = p["wm_tracking"]
    sx = (p["wm_width"] - tr * (len("ESTRUCTURAL") - 1)) / w0
    out = []
    for line, y in zip(lines, p["wm_baselines"]):
        d, _ = text_path(f, line, p["wm_x"], y, p["wm_h"], tr, sx)
        # trazo del mismo color para igualar el peso "bold extended" del original
        out.append(f'<path d="{d}" fill="{c["ink"]}" stroke="{c["ink"]}" stroke-width="{p["wm_bold"]}" stroke-linejoin="miter"/>')
    return "\n  ".join(out)


P = {
    "stem_x": 149, "stem_w": 22, "stem_y1": 520, "tip_y": 548,
    # franjas: (y izquierda, y derecha, y fondo en el pilote, x inicio curva, x fin curva)
    "stripes": ((373, 366, 412, 92, 208), (424, 420, 457, 92, 208), (481, 477, 503, 96, 206), (535, 533, 553, 92, 214)),
    "stripe_w": 26, "stripe_x0": 18, "stripe_x1": 594,
    "g_center": (152.0, 158.0), "g_radii": (94.0, 124.0), "g_n": 2.35, "g_a0": -36.0, "g_a1": -335.0, "g_w": 35,
    "bar_y": 157, "bar_x0": 136,
    "amp_x": 238, "amp_h": 204, "amp_wght": 520, "amp_sx": 0.92, "base_y": 302,
    "e_x": 421, "e_top": 16, "e_w": 156, "e_stem": 42, "e_arm": 38, "e_mid": 0.88,
    "group_x": 454, "group_y": 345, "group_h": 25,
    "wm_x": 636, "wm_h": 48, "wm_width": 868, "wm_tracking": 10, "wm_bold": 7,
    "wm_baselines": (124, 248, 370, 490),
}


def svg(view, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img" aria-labelledby="t">\n'
            f'  <title id="t">{title}</title>\n  {body}\n</svg>\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    neg = dict(COLORS, ink="#FFFFFF", gray="#B3B3B3")
    title = "Grupo G&amp;E · Consultoría geotécnica estructural integral"
    files = {
        "logo-ge.svg": svg("0 0 1548 578", symbol(COLORS, P) + "\n  " + wordmark(COLORS, P), title),
        "logo-ge-negativo.svg": svg("0 0 1548 578", symbol(neg, P) + "\n  " + wordmark(neg, P), title),
        "logo-ge-simbolo.svg": svg("0 0 612 578", symbol(COLORS, P), "Grupo G&amp;E"),
        "logo-ge-simbolo-negativo.svg": svg("0 0 612 578", symbol(neg, P), "Grupo G&amp;E"),
    }
    for name, content in files.items():
        (OUT / name).write_text(content, encoding="utf-8")
        print(name, len(content.encode()) // 1024, "KB")


if __name__ == "__main__":
    main()
