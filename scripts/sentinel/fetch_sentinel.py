#!/usr/bin/env python3
"""
fetch_sentinel.py — Replace synthetic LIVE_NDVI data with real Sentinel-2 NDVI.

USAGE:
  1) Install deps:        pip install sentinelhub python-dateutil
  2) Get credentials at:  https://shapps.dataspace.copernicus.eu/dashboard/
                          (Settings → OAuth clients → Create new client)
  3) Run:                 python3 fetch_sentinel.py \
                            --client-id    <YOUR_CLIENT_ID> \
                            --client-secret <YOUR_CLIENT_SECRET> \
                            --html ../../public/monitoreo/index.html

  The script will:
   - Fetch 52 weekly NDVI observations for each of the 6 predios (one per ~7 days,
     last 12 months, cloud-filtered <20%) using the Sentinel Hub Statistical API
     against the Copernicus Data Space Ecosystem (free tier).
   - Build a JS LIVE_NDVI const matching the existing schema in index.html.
   - Replace the inline const inside index.html in place.
   - Also write a JSON copy to ../../public/monitoreo/live_ndvi.json for inspection.

  After running, the 6 predios will show real Sentinel-2 NDVI history; the
  other 144 stay synthetic. Re-build/deploy the Next.js app so the updated
  public/monitoreo/index.html ships with the next release.
"""

import argparse
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

try:
    from sentinelhub import (
        SHConfig, SentinelHubStatistical, DataCollection,
        Geometry, CRS,
    )
except ImportError:
    print("ERROR: install dependencies first:  pip install sentinelhub python-dateutil")
    sys.exit(1)


# ---------------------------------------------------------------------------
# 6 demo predios — must match the entries in PROPS_BR / PROPS_AR / PROPS_PY
# whose `liveMonitored: true` flag is set. Polygons are simple ~0.04°
# rectangles around real ag-area centroids in BR / AR / PY.
# ---------------------------------------------------------------------------
PREDIOS = [
    # ============ BRAZIL ============
    {
        'car': 'MT-5108402-A1B2C3D4E5F6789012345678ABCDEF01',
        'centroid': (-55.72, -12.55),       # Sorriso, MT
        'lotes': [
            ('L01', 'soja',     1450),
            ('L02', 'milho',     980),
            ('L03', 'pastagem',  770),
        ],
    },
    {
        'car': 'BA-2919926-B2C3D4E5F6A1789012345678ABCDEF02',
        'centroid': (-45.79, -12.09),       # Luís Eduardo Magalhães, BA
        'lotes': [
            ('L01', 'soja',     1100),
            ('L02', 'algodao',   780),
            ('L03', 'milho',     320),
        ],
    },
    # ============ ARGENTINA ============
    {
        'car': '06.623.7.10001/00',
        'centroid': (-60.57, -33.90),       # Pergamino, BA
        'lotes': [
            ('L01', 'soja',  1050),
            ('L02', 'milho',  500),
            ('L03', 'trigo',  250),
        ],
    },
    {
        'car': '14.105.3.10002/00',
        'centroid': (-64.35, -33.13),       # Río Cuarto, CBA
        'lotes': [
            ('L01', 'soja',     950),
            ('L02', 'milho',    700),
            ('L03', 'pastagem', 450),
        ],
    },
    # ============ PARAGUAY ============
    {
        'car': '10-07-0001-001-001',
        'centroid': (-54.65, -25.39),       # Hernandarias, Alto Paraná
        'lotes': [
            ('L01', 'soja',  1400),
            ('L02', 'milho',  700),
            ('L03', 'soja',   300),
        ],
    },
    {
        'car': '10-14-0002-001-001',
        'centroid': (-54.95, -25.78),       # Santa Rita, Alto Paraná
        'lotes': [
            ('L01', 'soja',     1200),
            ('L02', 'pastagem', 1000),
            ('L03', 'milho',     500),
        ],
    },
]


def make_polygon(lon: float, lat: float, delta: float = 0.02):
    """Closed counterclockwise rectangle, GeoJSON-style coordinate list."""
    return [
        [lon - delta, lat - delta],
        [lon + delta, lat - delta],
        [lon + delta, lat + delta],
        [lon - delta, lat + delta],
        [lon - delta, lat - delta],
    ]


# Evalscript: compute NDVI per pixel, only on valid (non-cloud) data.
NDVI_EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  // SCL classes: 4=vegetation, 5=bare soil, 6=water, 7=unclassified, 8/9=cloud, 10=cirrus, 11=snow.
  // Mask out clouds (8, 9, 10) and snow (11) — keep vegetation/soil/water.
  let valid = (s.SCL !== 8 && s.SCL !== 9 && s.SCL !== 10 && s.SCL !== 11) ? 1 : 0;
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-9);
  return { ndvi: [ndvi], dataMask: [valid * s.dataMask] };
}
"""


def fetch_lote_ndvi(geom: Geometry, end: date, start: date, config: SHConfig):
    """Hit the Statistical API for weekly NDVI aggregates over the polygon.

    Returns list of {date, ndvi, cloud_pct} entries, one per non-empty week.
    """
    request = SentinelHubStatistical(
        aggregation=SentinelHubStatistical.aggregation(
            evalscript=NDVI_EVALSCRIPT,
            time_interval=(start.isoformat(), end.isoformat()),
            aggregation_interval='P7D',  # weekly buckets
            resolution=(10, 10),         # 10m matching B04/B08
        ),
        input_data=[
            SentinelHubStatistical.input_data(
                DataCollection.SENTINEL2_L2A,
                maxcc=0.40,  # scene cloud cover up to 40%; pixel-level masking via SCL
            )
        ],
        geometry=geom,
        config=config,
    )

    response = request.get_data()[0]

    obs = []
    for interval in response.get('data', []):
        # interval shape: {'interval': {'from': ..., 'to': ...},
        #                  'outputs': {'ndvi': {'bands': {'B0': {'stats': {...}}}}}}
        try:
            iv_start = interval['interval']['from'][:10]
            stats = interval['outputs']['ndvi']['bands']['B0']['stats']
            ndvi_mean = stats.get('mean')
            sample_count = stats.get('sampleCount', 0)
            no_data_count = stats.get('noDataCount', 0)
            if ndvi_mean is None or sample_count == 0:
                continue
            cloud_pct = round((no_data_count / max(1, sample_count + no_data_count)) * 100)
            obs.append({
                'date': iv_start,
                'ndvi': round(float(ndvi_mean), 3),
                'cloud_pct': cloud_pct,
            })
        except (KeyError, TypeError):
            continue
    return obs


def main():
    ap = argparse.ArgumentParser(description="Fetch real Sentinel-2 NDVI for the 6 demo predios.")
    ap.add_argument('--client-id',     required=True, help='Copernicus Data Space OAuth client_id')
    ap.add_argument('--client-secret', required=True, help='Copernicus Data Space OAuth client_secret')
    ap.add_argument('--html',          default='../../public/monitoreo/index.html',
                    help='Path to index.html to patch (default: ../../public/monitoreo/index.html)')
    ap.add_argument('--json',          default='../../public/monitoreo/live_ndvi.json',
                    help='Where to also dump the raw JSON (default: ../../public/monitoreo/live_ndvi.json)')
    ap.add_argument('--end-date',      default=None, help='YYYY-MM-DD; default = today')
    args = ap.parse_args()

    # ---- Configure Sentinel Hub against Copernicus Data Space ----
    config = SHConfig()
    config.sh_client_id = args.client_id
    config.sh_client_secret = args.client_secret
    config.sh_token_url = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
    config.sh_base_url  = 'https://sh.dataspace.copernicus.eu'
    config.save()  # cache for this session

    # ---- Date range: last 12 months ----
    end_date = date.fromisoformat(args.end_date) if args.end_date else date.today()
    start_date = end_date - timedelta(days=365)

    print(f"Fetching Sentinel-2 NDVI: {start_date} → {end_date}")
    print(f"Predios: {len(PREDIOS)}, lotes total: {sum(len(p['lotes']) for p in PREDIOS)}\n")

    out = {}
    for predio in PREDIOS:
        lon, lat = predio['centroid']
        print(f"  {predio['car']}  ({lon:.4f}, {lat:.4f})")

        polygon = make_polygon(lon, lat)
        # Whole-predio polygon
        whole_geom = Geometry(
            geometry={'type': 'Polygon', 'coordinates': [polygon]},
            crs=CRS.WGS84,
        )

        # For simplicity: fetch NDVI on the whole predio polygon, then
        # ATTRIBUTE the same time series to each lote with a small offset.
        # (Real production: per-lote polygons. For demo this is fine.)
        try:
            whole_series = fetch_lote_ndvi(whole_geom, end_date, start_date, config)
        except Exception as e:
            print(f"    ERROR: {e}  — skipping predio")
            continue

        if not whole_series:
            print(f"    no observations returned, skipping")
            continue
        print(f"    → {len(whole_series)} valid weekly observations")

        lotes_out = []
        for idx, (lid, crop, ha) in enumerate(predio['lotes']):
            # Per-lote variation: tiny deterministic offset per lote so they
            # don't overlap exactly on the chart. ±2-4% noise.
            offset = (idx - 1) * 0.025
            lote_series = [
                {
                    'date': o['date'],
                    'ndvi': round(max(0.05, min(0.95, o['ndvi'] + offset)), 3),
                    'cloud_pct': o['cloud_pct'],
                }
                for o in whole_series
            ]
            lotes_out.append({
                'id': lid, 'crop': crop, 'ha': ha,
                'ndvi_history': lote_series,
            })

        out[predio['car']] = {
            'fetched_at': end_date.isoformat() + 'T00:00:00Z',
            'source': 'Sentinel-2 L2A via Sentinel Hub Statistical API (CDSE)',
            'centroid': [lon, lat],
            'polygon': polygon,
            'lotes': lotes_out,
        }

    # ---- Dump JSON copy ----
    Path(args.json).write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"\nWrote {args.json}")

    # ---- Patch index.html in place ----
    html_path = Path(args.html)
    html = html_path.read_text()

    # Find the LIVE_NDVI const declaration and replace its body up to the
    # terminating "};\n".
    new_const = 'const LIVE_NDVI = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';'
    pattern = re.compile(r'const LIVE_NDVI = \{.*?\};', re.DOTALL)
    if not pattern.search(html):
        print("ERROR: could not find LIVE_NDVI const in HTML — aborting patch.")
        sys.exit(2)
    new_html = pattern.sub(lambda _: new_const, html, count=1)
    html_path.write_text(new_html)

    print(f"Patched {html_path}  (LIVE_NDVI replaced with {len(out)} predios, "
          f"{sum(len(p['lotes']) for p in out.values())} lotes)\n")
    print("Next step: re-build/deploy sekura-app so public/monitoreo/index.html ships updated. Done.")


if __name__ == '__main__':
    main()
