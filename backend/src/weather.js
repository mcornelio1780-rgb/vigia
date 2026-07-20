// Integración con Open-Meteo (API pública y gratuita, sin clave).
// El mapeo de la respuesta a la forma que consume el dashboard es una
// función pura y testeable; la llamada de red se aísla en fetchForecast.

const DOW_ES = ["D", "L", "M", "X", "J", "V", "S"];
const DOW_EN = ["S", "M", "T", "W", "T", "F", "S"];

// Convierte la respuesta diaria de Open-Meteo en la serie del dashboard:
// [{ d, de, n, tmax, tmin, p, w, h }]
export function mapForecast(json) {
  const daily = json?.daily;
  if (!daily || !Array.isArray(daily.time)) return [];
  const tmax = daily.temperature_2m_max || [];
  const tmin = daily.temperature_2m_min || [];
  const psum = daily.precipitation_sum || [];
  const wmax = daily.wind_speed_10m_max || [];
  return daily.time.map((date, i) => {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const p = Math.round(psum[i] ?? 0);
    return {
      d: DOW_ES[dow],
      de: DOW_EN[dow],
      n: i,
      tmax: Math.round(tmax[i] ?? 0),
      tmin: Math.round(tmin[i] ?? 0),
      p,
      w: Math.round(wmax[i] ?? 0),
      h: p > 1 ? 78 : 46, // Open-Meteo no da humedad diaria; se aproxima.
    };
  });
}

export function forecastUrl(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    forecast_days: "10",
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

// Descarga y mapea el pronóstico. Lanza si la red o el upstream fallan;
// el llamador decide el fallback.
export async function fetchForecast(lat, lng) {
  const res = await fetch(forecastUrl(lat, lng), { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  return mapForecast(await res.json());
}
