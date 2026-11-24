"""
ReciclaBelem - Gerador de Pacote de Mapa Offline (Belem, Icoaraci e Outeiro)
Baixa os tiles PNG reais (zoom 12 a 15) e empacota em data/belem-map-pack.bin
Formato binario:
  [4 bytes uint32 LE: header_len]
  [header_len bytes: JSON array [{z, x, y, offset, length}, ...]]
  [bytes concatenados de todas as imagens PNG]
"""

import json
import math
import os
import struct
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

# Bounding box cobrindo Belem inteira, Icoaraci e Outeiro
LAT_MIN, LAT_MAX = -1.49, -1.23
LNG_MIN, LNG_MAX = -48.52, -48.38
ZOOMS = [12, 13, 14, 15]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(BASE_DIR, "data", "belem-map-pack.bin")
META_PATH = os.path.join(BASE_DIR, "data", "belem-map-pack.meta.json")


def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return xtile, ytile


def fetch_tile(z, x, y):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "ReciclaBelem-OfflinePackBuilder/1.0 (+https://github.com/breno-fo/ReciclaBelem)"
        },
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200:
                    data = resp.read()
                    if data.startswith(b"\x89PNG") or data.startswith(b"\xff\xd8\xff"):
                        return (z, x, y, data)
        except Exception:
            time.sleep(0.4 * (attempt + 1))
    return (z, x, y, None)


def main():
    coords = []
    for z in ZOOMS:
        x1, y1 = deg2num(LAT_MAX, LNG_MIN, z)
        x2, y2 = deg2num(LAT_MIN, LNG_MAX, z)
        for x in range(x1, x2 + 1):
            for y in range(y1, y2 + 1):
                coords.append((z, x, y))

    print(f"Baixando {len(coords)} tiles de Belem, Icoaraci e Outeiro (zoom {ZOOMS[0]}-{ZOOMS[-1]})...")

    results = {}
    failed = 0
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch_tile, z, x, y): (z, x, y) for (z, x, y) in coords}
        done = 0
        for fut in as_completed(futures):
            z, x, y, data = fut.result()
            done += 1
            if data:
                results[(z, x, y)] = data
            else:
                failed += 1
            if done % 50 == 0 or done == len(coords):
                print(f"  Progresso: {done}/{len(coords)} (falhas: {failed})")

    header = []
    chunks = []
    offset = 0
    for (z, x, y) in coords:
        data = results.get((z, x, y))
        if not data:
            continue
        header.append({"z": z, "x": x, "y": y, "offset": offset, "length": len(data)})
        chunks.append(data)
        offset += len(data)

    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "wb") as f:
        f.write(struct.pack("<I", len(header_bytes)))
        f.write(header_bytes)
        for c in chunks:
            f.write(c)

    total_bytes = os.path.getsize(OUT_PATH)
    size_mb = round(total_bytes / (1024 * 1024), 1)
    meta = {
        "region": "Belém, Icoaraci e Outeiro",
        "zooms": ZOOMS,
        "bounds": {"latMin": LAT_MIN, "latMax": LAT_MAX, "lngMin": LNG_MIN, "lngMax": LNG_MAX},
        "tileCount": len(header),
        "bytes": total_bytes,
        "sizeMB": size_mb,
        "builtAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(META_PATH, "w", encoding="utf-8") as mf:
        json.dump(meta, mf, indent=2, ensure_ascii=False)

    print(f"Concluido! {len(header)} tiles empacotados em {OUT_PATH} ({size_mb} MB)")


if __name__ == "__main__":
    main()
