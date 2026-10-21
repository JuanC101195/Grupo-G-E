import fitz, hashlib, os, io
from PIL import Image
SRC = r"C:\Users\LeNoVo\Desktop\grupo-gye-web\fuentes\Brochure_GE_2026.pdf"
OUT = r"C:\Users\LeNoVo\Desktop\grupo-gye-web\assets\originales"
doc = fitz.open(SRC)
seen = {}
report = []
for pno in range(len(doc)):
    page = doc[pno]
    for n, info in enumerate(page.get_images(full=True), start=1):
        xref = info[0]
        d = doc.extract_image(xref)
        data = d["image"]; ext = d["ext"]
        w, h = d["width"], d["height"]
        short = min(w, h)
        h256 = hashlib.sha256(data).hexdigest()
        if short < 120:
            report.append((pno+1, n, "descartada<120", w, h)); continue
        if h256 in seen:
            report.append((pno+1, n, f"duplicada de {seen[h256]}", w, h)); continue
        name = f"p{pno+1}-{n}.{ext}"
        with open(os.path.join(OUT, name), "wb") as f: f.write(data)
        seen[h256] = name
        report.append((pno+1, n, name, w, h))
for r in report: print(r)
print("pages", len(doc))
