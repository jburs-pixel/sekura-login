# Sekura — Sentinel-2 live data fetch

This folder contains the script to replace the synthetic NDVI data baked into
`public/monitoreo/index.html` with **real Sentinel-2 observations** fetched from the
Copernicus Data Space Ecosystem (CDSE), free tier.

## What it does

The 6 "live-monitored" predios in the prototype (2 per country) have a flag
`liveMonitored: true`. Their NDVI history is held in a JS const called
`LIVE_NDVI` inside `public/monitoreo/index.html`. By default that const ships with
**realistic synthetic curves** so the demo always works, even offline.

This script replaces those synthetic curves with **52 weekly NDVI observations
per lote**, computed from actual Sentinel-2 L2A imagery on each predio's
polygon, with cloud masking via the SCL band.

## Setup (one time, ~10 minutes)

### 1. Register at Copernicus Data Space

Go to <https://dataspace.copernicus.eu/> → "Register" (free, no credit card,
~5 min via email confirmation).

### 2. Generate OAuth credentials

After login, go to <https://shapps.dataspace.copernicus.eu/dashboard/> →
*Settings* → *OAuth clients* → **Create**. Copy:
- `client_id`
- `client_secret`

(Free tier: ~30,000 processing units / month — more than enough for 6 predios.)

### 3. Install Python dependency

```bash
pip install sentinelhub
```

(One package; pulls in `requests`, `rasterio`, `numpy`. Tested on Python 3.10+.)

## Run it

```bash
cd scripts/sentinel

python3 fetch_sentinel.py \
  --client-id     YOUR_CLIENT_ID_HERE \
  --client-secret YOUR_CLIENT_SECRET_HERE
```

Output:
```
Fetching Sentinel-2 NDVI: 2025-05-05 → 2026-05-05
Predios: 6, lotes total: 18

  MT-5108402-A1B2C3D4...  (-55.7200, -12.5500)
    → 47 valid weekly observations
  BA-2919926-B2C3D4E5...  (-45.7900, -12.0900)
    → 49 valid weekly observations
  ...

Wrote ../../public/monitoreo/live_ndvi.json
Patched ../../public/monitoreo/index.html  (LIVE_NDVI replaced with 6 predios, 18 lotes)

Next step: re-build/deploy sekura-app so public/monitoreo/index.html ships updated. Done.
```

The script does two things:
1. Writes a JSON copy of the data to `public/monitoreo/live_ndvi.json` (handy for inspection)
2. Patches `public/monitoreo/index.html` in place — the inline `const LIVE_NDVI = {...}`
   gets swapped for the real data, no other lines change.

## Re-deploy

After running, re-build/deploy the Next.js app (`sekura-app`) so the updated
`public/monitoreo/index.html` ships with the next release. The 6 live predios
will then show real Sentinel-2 NDVI history; the badge `🛰 Live Sentinel-2
monitoring` displays everywhere they appear.

## What you'll see in the UI

- **Country tabs**: live predios are mixed into the table. Their row gets a
  thin blue left edge + a 🛰 icon next to the CAR/RENSPA/CDA code.
- **CAR detail header**: a pill badge `🛰 Live Sentinel-2 monitoring · YYYY-MM-DD · L2A · 5d`
- **Monitoring sub-tab**: NDVI history cards say `🛰 Live Sentinel-2 L2A · last fetch: …`
  instead of `Synthetic baseline`.
- **Laudo técnico**: the owner block shows a `🛰 LIVE Sentinel-2` pill next to the name.

## Troubleshooting

**`401 Unauthorized`**
You probably mistyped the client_id/secret, or your OAuth client is in a different
"realm". Make sure you generated the credentials in the **Sentinel Hub Dashboard**
(`shapps.dataspace.copernicus.eu`), not the legacy Sentinel Hub commercial portal.

**`no observations returned, skipping`**
The polygon is in an area with persistent cloud cover or no recent imagery.
Try lowering `maxcc` from 0.40 to 0.60 inside the script, or pick a different
12-month window with `--end-date 2025-12-31`.

**Quota exhausted**
Free tier has ~30k processing units/month. One run of this script costs
~150-200 PUs. If you hit the limit, wait until the 1st of next month.

## Cost reality check

- **CDSE / Sentinel Hub free tier**: $0 if you stay under 30k PU/month.
- **CDSE paid tier**: starts ~$30/month for 100k PU.
- **Sentinel Hub commercial plans**: $300+/month for production volume.

For 1k predios with weekly fetches, expect ~30-50k PU/month → free tier or
$30/month bracket.

## Schema reference

Each entry in `LIVE_NDVI` looks like:

```js
{
  "MT-5108402-A1B2...": {
    "fetched_at": "2026-05-05T00:00:00Z",
    "source": "Sentinel-2 L2A via Sentinel Hub Statistical API (CDSE)",
    "centroid": [-55.72, -12.55],
    "polygon": [[lon, lat], ..., [lon, lat]],
    "lotes": [
      {
        "id": "L01", "crop": "soja", "ha": 1450,
        "ndvi_history": [
          {"date": "2025-05-12", "ndvi": 0.821, "cloud_pct": 8},
          ...
        ]
      },
      ...
    ]
  }
}
```

The `ndvi_history` is consumed by `getCARDetail()` in `index.html`. The render
code samples 12 evenly-spaced points (every ~4 weeks) from this 52-week series
to draw the chart in the Monitoring sub-tab and the Laudo Técnico.
