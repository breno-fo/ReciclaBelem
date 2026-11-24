"""
ReciclaBelem - Gerador de Icones Multi-Resolucao (Mucura & Selo)
Remove as margens brancas externas, preenche os cantos com o verde escuro do tema
para adaptar perfeitamente a qualquer mascara (squircle, circulo ou quadrado arredondado)
e gera versoes otimizadas em 32x32, 96x96, 192x192 e 512x512.
"""

import os
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(BASE_DIR, "assets", "icons")

SOURCES = {
    "mucura": os.path.join(ICONS_DIR, "logo_mucura.png"),
    "selo": os.path.join(ICONS_DIR, "logo_selo.png"),
}

SIZES = [32, 96, 192, 512]
BG_DARK_GREEN = (2, 44, 34, 255)  # #022c22


def crop_outer_white_and_fill_corners(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    # Detecta bounding box do conteudo nao-branco (ignora margem branca externa)
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 20 and not (r > 235 and g > 235 and b > 235):
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y

    # Recorta um pouco para dentro da borda externa (~1.5%) para eliminar halos brancos
    pad_x = max(2, int((max_x - min_x) * 0.015))
    pad_y = max(2, int((max_y - min_y) * 0.015))
    cropped = rgba.crop((min_x + pad_x, min_y + pad_y, max_x - pad_x, max_y - pad_y))

    # Garante proporcao quadrada exata
    cw, ch = cropped.size
    side = min(cw, ch)
    left = (cw - side) // 2
    top = (ch - side) // 2
    cropped = cropped.crop((left, top, left + side, top + side))

    # Substitui pixels brancos ou transparentes nos cantos (15% de cada quina) pelo verde escuro do tema
    cpx = cropped.load()
    corner = int(side * 0.16)
    for y in range(side):
        for x in range(side):
            in_corner = (
                (x < corner and y < corner)
                or (x >= side - corner and y < corner)
                or (x < corner and y >= side - corner)
                or (x >= side - corner and y >= side - corner)
            )
            if in_corner:
                r, g, b, a = cpx[x, y]
                if a < 128 or (r > 220 and g > 220 and b > 220):
                    cpx[x, y] = BG_DARK_GREEN

    return cropped


def main():
    for key, path in SOURCES.items():
        if not os.path.exists(path):
            print(f"Arquivo nao encontrado: {path}")
            continue
        img = Image.open(path)
        clean = crop_outer_white_and_fill_corners(img)
        for size in SIZES:
            resized = clean.resize((size, size), Image.Resampling.LANCZOS)
            out_path = os.path.join(ICONS_DIR, f"logo_{key}-{size}.png")
            resized.save(out_path, format="PNG", optimize=True)
            print(f"Gerado: {out_path} ({size}x{size}, {os.path.getsize(out_path)} bytes)")


if __name__ == "__main__":
    main()
