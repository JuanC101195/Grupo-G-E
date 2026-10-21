import os
from PIL import Image, ImageDraw
O = r"C:\Users\LeNoVo\Desktop\grupo-gye-web\assets\originales"
S = r"C:\Users\LeNoVo\Desktop\grupo-gye-web\assets\_scripts"
files = sorted(os.listdir(O), key=lambda s: (int(s.split('-')[0][1:]), int(s.split('-')[1].split('.')[0])))
cell = 300
per = 12
for k in range(0, len(files), per):
    chunk = files[k:k+per]
    cols = 4; rows = (len(chunk)+cols-1)//cols
    sheet = Image.new("RGB", (cols*cell, rows*(cell+24)), (255,255,255))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        im = Image.open(os.path.join(O, f)).convert("RGB")
        im.thumbnail((cell-8, cell-8))
        x = (i%cols)*cell; y = (i//cols)*(cell+24)
        d.text((x+4, y+4), f"{i+1}: {f}", fill=(0,0,0))
        sheet.paste(im, (x+4, y+22))
    p = os.path.join(S, f"hoja_{k//per+1}.png"); sheet.save(p); print(p, [f"{i+1}={f}" for i,f in enumerate(chunk)])
