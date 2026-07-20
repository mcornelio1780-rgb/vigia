// Integración con NASA FIRMS (focos de calor VIIRS, casi en tiempo real).
// Requiere una MAP_KEY gratuita (FIRMS_MAP_KEY). El parseo del CSV es una
// función pura y testeable; la llamada de red se aísla en fetchFires.

// Se leen del entorno en cada llamada (no en la carga del módulo) para que
// reflejen la configuración vigente y sean testeables.
const mapKey = () => process.env.FIRMS_MAP_KEY || "";
const source = () => process.env.FIRMS_SOURCE || "VIIRS_SNPP_NRT";

export function firmsConfigured() {
  return Boolean(mapKey());
}

// Parsea el CSV de FIRMS (cabecera + filas) mapeando por nombre de columna.
export function mapFires(csv) {
  if (typeof csv !== "string") return [];
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const head = lines[0].split(",").map((h) => h.trim());
  const idx = (name) => head.indexOf(name);
  const iLat = idx("latitude"), iLng = idx("longitude");
  const iConf = idx("confidence"), iFrp = idx("frp");
  const iDate = idx("acq_date"), iTime = idx("acq_time");
  if (iLat < 0 || iLng < 0) return [];
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    const lat = Number(c[iLat]);
    const lng = Number(c[iLng]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    out.push({
      lat,
      lng,
      confidence: iConf >= 0 ? c[iConf] : null,
      frp: iFrp >= 0 ? Number(c[iFrp]) || 0 : 0,
      acqDate: iDate >= 0 ? c[iDate] : null,
      acqTime: iTime >= 0 ? c[iTime] : null,
    });
  }
  return out;
}

// Distancia aproximada en km entre dos puntos (haversine).
export function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function firmsUrl(lat, lng, days) {
  const w = (lng - 0.5).toFixed(4), e = (lng + 0.5).toFixed(4);
  const s = (lat - 0.5).toFixed(4), n = (lat + 0.5).toFixed(4);
  return `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey()}/${source()}/${w},${s},${e},${n}/${days}`;
}

// Descarga y filtra los focos a menos de `radiusKm` del campo.
export async function fetchFires(lat, lng, { days = 2, radiusKm = 50 } = {}) {
  const res = await fetch(firmsUrl(lat, lng, days), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`firms ${res.status}`);
  const fires = mapFires(await res.text())
    .map((f) => ({ ...f, distanceKm: Math.round(distanceKm(lat, lng, f.lat, f.lng)) }))
    .filter((f) => f.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return fires;
}
