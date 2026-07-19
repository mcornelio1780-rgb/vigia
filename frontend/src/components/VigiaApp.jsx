"use client";
/* eslint-disable */
import { useState, useEffect, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════
   VIGIA — App completa: Landing → Login → Dashboard
   Marca en una sola constante.
   ══════════════════════════════════════════════════════════════ */
const BRAND = "Vigia";
const DOMAIN = "vigia.ag";

/* ── Idioma: ES · EN · PT ── */
const LANGS = ["es", "en", "pt"];
// pick(lang, textoES, textoEN, textoPT?) — PT cae a EN si no se tradujo.
const pick = (lang, es, en, pt) => (lang === "pt" ? (pt ?? en) : lang === "en" ? en : es);
const nextLang = (lang) => LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
const langLabel = (lang) => nextLang(lang).toUpperCase();

/* ── API real: captura de leads (lista de espera + boletín) ── */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function postLead(payload) {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => null);
    throw new Error(b?.error || "No se pudo enviar. Intenta de nuevo.");
  }
  return res.json();
}

async function fetchLeadStats() {
  const res = await fetch(`${API_URL}/api/leads/stats`);
  if (!res.ok) throw new Error("stats");
  return res.json();
}

// Autenticación de administrador y listado de leads.
async function adminLogin(password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "Contraseña incorrecta");
  return b.token;
}
async function fetchLeads(token, kind) {
  const qs = kind ? `?kind=${kind}` : "";
  const res = await fetch(`${API_URL}/api/leads${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("No autorizado");
  return res.json();
}

/* ── Cuentas de usuario (token en localStorage) ── */
const USER_TOKEN_KEY = "vigia_user_token";
function getUserToken() {
  try { return typeof window !== "undefined" ? window.localStorage.getItem(USER_TOKEN_KEY) : null; } catch { return null; }
}
function setUserToken(t) { try { window.localStorage.setItem(USER_TOKEN_KEY, t); } catch {} }
function clearUserToken() { try { window.localStorage.removeItem(USER_TOKEN_KEY); } catch {} }

async function userAuth(kind, payload) {
  const res = await fetch(`${API_URL}/api/users/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "No se pudo autenticar");
  setUserToken(b.token);
  return b.user;
}
async function fetchMe() {
  const t = getUserToken();
  if (!t) return null;
  try {
    const res = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) { clearUserToken(); return null; }
    return await res.json();
  } catch { return null; }
}
async function updateProfile(name) {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión para editar tu perfil");
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ name }),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "No se pudo actualizar el perfil");
  return b;
}
async function deleteAccount() {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión");
  const res = await fetch(`${API_URL}/api/users/me`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) throw new Error("No se pudo eliminar la cuenta");
  clearUserToken();
}
async function deleteFarm(id) {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión");
  const res = await fetch(`${API_URL}/api/users/farms/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) throw new Error("No se pudo quitar el campo");
}
async function saveFarm(payload) {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión para guardar tu campo");
  const res = await fetch(`${API_URL}/api/users/farms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(payload),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "No se pudo guardar el campo");
  return b;
}
async function updateFarm(id, payload) {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión");
  const res = await fetch(`${API_URL}/api/users/farms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(payload),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "No se pudo editar el campo");
  return b;
}
async function fetchUserStats() {
  const t = getUserToken();
  if (!t) return null;
  try {
    const res = await fetch(`${API_URL}/api/users/stats`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
async function fetchSettings() {
  const t = getUserToken();
  if (!t) return null;
  try {
    const res = await fetch(`${API_URL}/api/users/settings`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
async function putSettings(settings) {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión para guardar tu configuración");
  const res = await fetch(`${API_URL}/api/users/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ settings }),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "No se pudo guardar la configuración");
  return b;
}
async function changePassword(current, next) {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión para cambiar tu contraseña");
  const res = await fetch(`${API_URL}/api/users/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ current, next }),
  });
  const b = await res.json().catch(() => null);
  if (!res.ok) throw new Error(b?.error || "No se pudo cambiar la contraseña");
  return b;
}

// Genera el PDF de evidencia en el backend y dispara la descarga.
async function downloadReport(payload) {
  const res = await fetch(`${API_URL}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo generar el reporte");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vigia-reporte.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Descarga en JSON todos los datos del usuario (perfil + campos + preferencias).
async function exportData() {
  const t = getUserToken();
  if (!t) throw new Error("Inicia sesión para exportar tus datos");
  const res = await fetch(`${API_URL}/api/users/export`, { headers: { Authorization: `Bearer ${t}` } });
  if (!res.ok) throw new Error("No se pudo exportar tus datos");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vigia-datos.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Focos de calor reales cercanos (NASA FIRMS) vía backend. Devuelve el
// objeto { count, fires } o null si no está configurado / sin red.
async function fetchFires(lat, lng) {
  try {
    const res = await fetch(`${API_URL}/api/fires?lat=${lat}&lng=${lng}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Pronóstico real vía backend (Open-Meteo). Devuelve la serie de días o
// null si no hay red disponible, para que el dashboard use su demo.
async function fetchWeather(lat, lng) {
  try {
    const res = await fetch(`${API_URL}/api/weather?lat=${lat}&lng=${lng}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.days) && data.days.length ? data.days : null;
  } catch {
    return null;
  }
}

const C = {
  bg: "#080D0B", s1: "#0D1512", s2: "#121C18", s3: "#182620",
  line: "rgba(120,190,150,0.10)", line2: "rgba(120,190,150,0.22)",
  t1: "#E8F2EA", t2: "#93AC9C", t3: "#5E7A68", t4: "#3B5244",
  green: "#3DDC84", greenDk: "#0E9F5B",
  n5: "#2FBF6B", n4: "#8CD44A", n3: "#E3C339", n2: "#E88A2E", n1: "#D14B33",
  blue: "#5AA9F5", violet: "#9E8BF0",
};
const RAMP = [C.n1, C.n2, C.n3, C.n4, C.n5];
const ndviColor = (v) => (v >= 0.7 ? C.n5 : v >= 0.55 ? C.n4 : v >= 0.42 ? C.n3 : v >= 0.28 ? C.n2 : C.n1);
const riskColor = (v) => (v >= 65 ? C.n1 : v >= 45 ? C.n2 : v >= 28 ? C.n3 : C.n5);

const Ic = ({ d, s = 16, c = "currentColor", sw = 1.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ic = {
  fire: "M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-5 4-7 5-11z",
  water: "M12 2c-4 6-7 9-7 13a7 7 0 0014 0c0-4-3-7-7-13z",
  drought: "M12 3v2m0 14v2M5.64 5.64l1.41 1.41M3 12h2M16 12a4 4 0 11-8 0M19 12h2M16.95 16.95l1.41 1.41",
  wind: "M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2",
  bug: "M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 116 0v1M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0112 0v3c0 3.3-2.7 6-6 6zM12 20v2M8.5 14h7M6 11a2 2 0 01-2-2M18 11a2 2 0 002-2",
  frost: "M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5",
  leaf: "M17 8C8 10 5.9 16.09 3.82 21.18M5 15c4-2 6-4 8-8 2-4 4-6 8-8-2 4-4 6-8 8-4 2-6 4-8 8z",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  chk: "M20 6L9 17l-5-5",
  file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  chat: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  sat: "M13 7L9 3 3 9l6 6m4-4l6 6M7 13l-4 4m4-4l6 6M3 21l4-4M21 3l-4 4",
  arrow: "M5 12h14M12 5l7 7-7 7",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  map: "M9 18l-6 3V7l6-3m0 14l6-3m-6 3V4m6 11l6 3V4l-6 3m0 11V7",
  sun: "M12 3v2m0 14v2M5.64 5.64l1.41 1.41m9.9 9.9l1.41 1.41M3 12h2m14 0h2M5.64 18.36l1.41-1.41m9.9-9.9l1.41-1.41M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  mail: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 0c2.5 2 4 5.5 4 10s-1.5 8-4 10m0-20c-2.5 2-4 5.5-4 10s1.5 8 4 10M2 12h20",
  plus: "M12 5v14M5 12h14",
  down: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
};

/* ── Geometrías de parcela (2 variantes) ── */
const SHAPE_A = {
  hull: "40,60 200,30 380,45 470,120 450,270 300,330 120,310 30,200",
  zones: [
    "40,60 200,30 195,170 55,160",
    "30,200 55,160 195,170 200,300 120,310",
    "200,30 380,45 370,165 195,170",
    "195,170 370,165 360,300 300,330 200,300",
    "380,45 470,120 455,180 370,165",
    "370,165 455,180 450,270 360,300",
  ],
  hot: [415, 238],
};
const SHAPE_B = {
  hull: "60,40 300,25 460,90 480,220 380,320 150,330 35,240 45,110",
  zones: [
    "60,40 300,25 290,150 65,140",
    "45,110 65,140 290,150 285,290 150,330 35,240",
    "300,25 460,90 450,160 290,150",
    "290,150 450,160 440,240 380,320 285,290",
    "450,90 480,220 450,160",
    "440,240 480,220 380,320",
  ],
  hot: [430, 250],
};

/* ── Campos: seis continentes ── */
const FARMS = {
  iowa: {
    label: "Story County, Iowa", country: "USA", cc: "US", coord: "42°02′N 93°37′O", tz: "UTC−5", lat: 42.03, lng: -93.62,
    shape: SHAPE_A, ha: 640, elev: 285, crop: { es: "Maíz / Soja", en: "Corn / Soybean" },
    zones: [0.81, 0.76, 0.68, 0.44, 0.71, 0.33],
    zoneCrop: [["Maíz — R2", "Corn — R2"], ["Maíz — R2", "Corn — R2"], ["Soja — R4", "Soybean — R4"], ["Soja — R4", "Soybean — R4"], ["Maíz — R2", "Corn — R2"], ["Franja de borde", "Field margin"]],
    risks: { fire: 12, drought: 38, flood: 61, pest: 44, frost: 8, wind: 52 },
    base: { t: 26, p: 14, h: 63, w: 21 },
    crops: [
      { n: "Zea mays var. indentata", c: { es: "Maíz dentado 'P1197'", en: "Dent corn 'P1197'" }, fit: 94, price: "$4.62 / bu", src: "CBOT" },
      { n: "Glycine max 'AG28XF3'", c: { es: "Soja grupo II", en: "Soybean group II" }, fit: 88, price: "$10.84 / bu", src: "CBOT" },
      { n: "Sorghum bicolor", c: { es: "Sorgo tolerante a sequía", en: "Drought-tolerant sorghum" }, fit: 71, price: "$4.05 / bu", src: "USDA" },
    ],
  },
  nsw: {
    label: "Riverina, NSW", country: "Australia", cc: "AU", coord: "34°17′S 146°03′E", tz: "UTC+11", lat: -34.28, lng: 146.05,
    shape: SHAPE_B, ha: 1240, elev: 132, crop: { es: "Trigo / Pastura", en: "Wheat / Pasture" },
    zones: [0.52, 0.41, 0.29, 0.18, 0.36, 0.15],
    zoneCrop: [["Trigo — encañado", "Wheat — stem elong."], ["Trigo — encañado", "Wheat — stem elong."], ["Pastura", "Pasture"], ["Pastura", "Pasture"], ["Barbecho", "Fallow"], ["Barbecho", "Fallow"]],
    risks: { fire: 78, drought: 84, flood: 6, pest: 22, frost: 14, wind: 58 },
    base: { t: 34, p: 1, h: 24, w: 33 },
    crops: [
      { n: "Triticum aestivum 'Scepter'", c: { es: "Trigo panadero de ciclo corto", en: "Short-season bread wheat" }, fit: 89, price: "A$362 / t", src: "ASX" },
      { n: "Hordeum vulgare 'Compass'", c: { es: "Cebada tolerante a calor", en: "Heat-tolerant barley" }, fit: 92, price: "A$318 / t", src: "ASX" },
      { n: "Cicer arietinum 'PBA Seamer'", c: { es: "Garbanzo desert-hardy", en: "Desert-hardy chickpea" }, fit: 84, price: "A$742 / t", src: "ASX" },
    ],
  },
  matogrosso: {
    label: "Sorriso, Mato Grosso", country: "Brasil", cc: "BR", coord: "12°32′S 55°42′O", tz: "UTC−4", lat: -12.53, lng: -55.70,
    shape: SHAPE_A, ha: 2100, elev: 365, crop: { es: "Soja / Maíz safrinha", en: "Soybean / 2nd corn" },
    zones: [0.84, 0.79, 0.73, 0.62, 0.77, 0.48],
    zoneCrop: [["Soja — R5", "Soybean — R5"], ["Soja — R5", "Soybean — R5"], ["Soja — R5", "Soybean — R5"], ["Maíz safrinha", "2nd-season corn"], ["Soja — R5", "Soybean — R5"], ["Reserva legal", "Legal reserve"]],
    risks: { fire: 41, drought: 19, flood: 47, pest: 68, frost: 2, wind: 29 },
    base: { t: 31, p: 42, h: 81, w: 12 },
    crops: [
      { n: "Glycine max 'TMG 7067'", c: { es: "Soja RR2 ciclo 110 d", en: "Soybean RR2, 110-day" }, fit: 95, price: "R$132 / sc", src: "B3" },
      { n: "Zea mays 'DKB 390'", c: { es: "Maíz safrinha", en: "Second-crop corn" }, fit: 87, price: "R$61 / sc", src: "B3" },
      { n: "Gossypium hirsutum 'FM 985'", c: { es: "Algodón de fibra larga", en: "Long-staple cotton" }, fit: 79, price: "R$4.12 / lb", src: "ICE" },
    ],
  },
  punjab: {
    label: "Ludhiana, Punjab", country: "India", cc: "IN", coord: "30°54′N 75°51′E", tz: "UTC+5:30", lat: 30.90, lng: 75.85,
    shape: SHAPE_B, ha: 96, elev: 244, crop: { es: "Arroz / Trigo", en: "Rice / Wheat" },
    zones: [0.69, 0.64, 0.51, 0.38, 0.58, 0.26],
    zoneCrop: [["Arroz — macollaje", "Rice — tillering"], ["Arroz — macollaje", "Rice — tillering"], ["Arroz — macollaje", "Rice — tillering"], ["Trigo (post-cosecha)", "Wheat (post-harvest)"], ["Arroz", "Rice"], ["Canal / borde", "Canal / margin"]],
    risks: { fire: 34, drought: 56, flood: 39, pest: 62, frost: 11, wind: 24 },
    base: { t: 38, p: 6, h: 47, w: 15 },
    crops: [
      { n: "Oryza sativa 'PR-126'", c: { es: "Arroz de ciclo corto", en: "Short-duration rice" }, fit: 91, price: "₹2,320 / q", src: "MSP" },
      { n: "Triticum aestivum 'HD-3226'", c: { es: "Trigo resistente a roya", en: "Rust-resistant wheat" }, fit: 88, price: "₹2,275 / q", src: "MSP" },
      { n: "Vigna radiata 'SML 668'", c: { es: "Mung de verano", en: "Summer mungbean" }, fit: 82, price: "₹8,558 / q", src: "MSP" },
    ],
  },
  andalucia: {
    label: "Écija, Andalucía", country: "España", cc: "ES", coord: "37°32′N 5°04′O", tz: "UTC+2", lat: 37.53, lng: -5.07,
    shape: SHAPE_A, ha: 310, elev: 110, crop: { es: "Olivar / Girasol", en: "Olive / Sunflower" },
    zones: [0.58, 0.49, 0.37, 0.24, 0.44, 0.17],
    zoneCrop: [["Olivar intensivo", "Intensive olive"], ["Olivar intensivo", "Intensive olive"], ["Girasol", "Sunflower"], ["Girasol", "Sunflower"], ["Olivar tradicional", "Traditional olive"], ["Erial", "Wasteland"]],
    risks: { fire: 67, drought: 73, flood: 9, pest: 51, frost: 18, wind: 31 },
    base: { t: 39, p: 0, h: 28, w: 19 },
    crops: [
      { n: "Olea europaea 'Arbequina'", c: { es: "Olivo superintensivo", en: "Super-high-density olive" }, fit: 90, price: "€7.85 / kg", src: "POOLred" },
      { n: "Helianthus annuus 'SY Bacardi'", c: { es: "Girasol alto oleico", en: "High-oleic sunflower" }, fit: 84, price: "€520 / t", src: "MATIF" },
      { n: "Cicer arietinum 'Pedrosillano'", c: { es: "Garbanzo de secano", en: "Rainfed chickpea" }, fit: 76, price: "€1,150 / t", src: "Lonja" },
    ],
  },
  cordoba: {
    label: "Río Cuarto, Córdoba", country: "Argentina", cc: "AR", coord: "33°08′S 64°21′O", tz: "UTC−3", lat: -33.13, lng: -64.35,
    shape: SHAPE_B, ha: 480, elev: 421, crop: { es: "Soja / Maíz", en: "Soybean / Corn" },
    zones: [0.79, 0.71, 0.54, 0.36, 0.63, 0.19],
    zoneCrop: [["Soja — R3", "Soybean — R3"], ["Soja — R3", "Soybean — R3"], ["Maíz — V8", "Corn — V8"], ["Maíz — V8", "Corn — V8"], ["Pastura", "Pasture"], ["Barbecho", "Fallow"]],
    risks: { fire: 74, drought: 58, flood: 12, pest: 37, frost: 21, wind: 46 },
    base: { t: 33, p: 3, h: 31, w: 38 },
    crops: [
      { n: "Glycine max 'DM 4670'", c: { es: "Soja grupo IV corto", en: "Soybean group IV short" }, fit: 93, price: "US$318 / t", src: "MATBA" },
      { n: "Zea mays 'DK 7220'", c: { es: "Maíz tardío", en: "Late-planted corn" }, fit: 86, price: "US$196 / t", src: "MATBA" },
      { n: "Sorghum bicolor 'ACA 558'", c: { es: "Sorgo granífero", en: "Grain sorghum" }, fit: 81, price: "US$183 / t", src: "MATBA" },
    ],
  },
};
const FARM_KEYS = Object.keys(FARMS);

// Formatea coordenadas numéricas a texto (para campos guardados por el usuario).
function fmtCoord(lat, lng) {
  if (lat == null || lng == null) return "—";
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "O"}`;
}

// Construye un campo tipo-FARMS a partir de uno guardado por el usuario:
// coordenadas reales (para clima/incendios en vivo) + agronomía demo determinista.
function synthFarm(saved) {
  const key = String(saved.id || saved.name || "x");
  const seed = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (i) => Math.abs(Math.sin(seed * 9301 + i * 49297)) % 1;
  const zones = Array.from({ length: 6 }, (_, i) => Math.round((0.28 + rnd(i) * 0.6) * 100) / 100);
  return {
    label: saved.name,
    country: saved.country || "—",
    cc: "",
    coord: fmtCoord(saved.lat, saved.lng),
    tz: "",
    shape: seed % 2 ? SHAPE_B : SHAPE_A,
    ha: saved.hectares || 100,
    elev: Math.round(50 + rnd(7) * 900),
    crop: { es: "Tu cultivo", en: "Your crop" },
    zones,
    zoneCrop: zones.map(() => ["Cultivo", "Crop"]),
    risks: {
      fire: Math.round(20 + rnd(1) * 70), drought: Math.round(15 + rnd(2) * 70),
      flood: Math.round(5 + rnd(3) * 60), pest: Math.round(15 + rnd(4) * 55),
      frost: Math.round(2 + rnd(5) * 40), wind: Math.round(15 + rnd(6) * 55),
    },
    base: { t: Math.round(18 + rnd(8) * 18), p: Math.round(rnd(9) * 30), h: Math.round(30 + rnd(10) * 50), w: Math.round(8 + rnd(11) * 30) },
    crops: [{ n: "—", c: { es: "Recomendación pendiente", en: "Recommendation pending" }, fit: Math.round(70 + rnd(12) * 25), price: "—", src: "—" }],
    lat: saved.lat,
    lng: saved.lng,
    saved: true,
    id: saved.id,
  };
}

/* Clima determinista por campo */
const buildWeather = (f) => {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const daysEn = ["M", "T", "W", "T", "F", "S", "S"];
  return Array.from({ length: 10 }, (_, i) => {
    const s = Math.sin(i * 1.1 + f.base.t);
    return {
      d: days[i % 7], de: daysEn[i % 7], n: i,
      tmax: Math.round(f.base.t + s * 4),
      tmin: Math.round(f.base.t - 9 + s * 3),
      p: Math.max(0, Math.round(f.base.p * (0.4 + Math.sin(i * 1.7) * 0.8))),
      w: Math.round(f.base.w + Math.cos(i * 0.9) * 9),
      h: Math.round(f.base.h + Math.sin(i * 0.6) * 11),
    };
  });
};

/* ══ Panel de parcela con sub-zonas ══ */
const ParcelScan = ({ farm, es, layer = "ndvi", onZone, selected, compact }) => {
  const [hover, setHover] = useState(null);
  const S = farm.shape;
  const zones = farm.zones.map((v, i) => ({
    id: "ABCDEF"[i], ndvi: v, pts: S.zones[i],
    ha: Math.round((farm.ha / 6) * (0.7 + (i % 3) * 0.3)),
    crop: farm.zoneCrop[i],
    fire: Math.min(97, Math.round(farm.risks.fire * (1.35 - v))),
    soil: Math.round(v * 100 * 0.55 + 12),
  }));
  const val = (z) => (layer === "ndvi" ? z.ndvi : layer === "fire" ? z.fire : z.soil);
  const col = (z) => (layer === "ndvi" ? ndviColor(z.ndvi) : layer === "fire" ? riskColor(z.fire) : ndviColor(z.soil / 60));
  const fmt = (z) => (layer === "ndvi" ? z.ndvi.toFixed(2) : layer === "fire" ? z.fire + "%" : z.soil + "%");
  const act = zones.find((z) => z.id === (hover || selected));

  return (
    <div className="scanwrap">
      <div className="scanhead">
        <span className="mono lbl"><Ic d={ic.pin} s={11} c={C.t3} /> {farm.coord}</span>
        <span className="mono lbl"><span className="dot" /> {es ? "Sentinel-2 · pasada 10:42" : "Sentinel-2 · pass 10:42"}</span>
      </div>
      <svg viewBox="0 0 520 360" className="scansvg" role="img" aria-label={es ? "Parcela dividida en zonas" : "Field split into zones"}>
        <defs>
          <clipPath id="pc"><polygon points={S.hull} /></clipPath>
          <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="55%" stopColor="#B9FFD8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <pattern id="gd" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0V26" fill="none" stroke="rgba(120,190,150,0.13)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="520" height="360" fill="url(#gd)" />
        {zones.map((z) => (
          <polygon key={z.id} points={z.pts} fill={col(z)} fillOpacity={hover === z.id || selected === z.id ? 0.88 : 0.55}
            stroke={col(z)} strokeWidth={selected === z.id ? 2.5 : 1}
            onMouseEnter={() => setHover(z.id)} onMouseLeave={() => setHover(null)}
            onClick={() => onZone && onZone(z.id === selected ? null : z.id)}
            style={{ cursor: "pointer", transition: "fill-opacity .18s" }} />
        ))}
        <polygon points={S.hull} fill="none" stroke={C.t1} strokeWidth="2" strokeOpacity="0.6" />
        {zones.map((z) => {
          const p = z.pts.split(" ").map((q) => q.split(",").map(Number));
          const cx = p.reduce((a, q) => a + q[0], 0) / p.length;
          const cy = p.reduce((a, q) => a + q[1], 0) / p.length;
          return (
            <g key={z.id} pointerEvents="none">
              <text x={cx} y={cy - 2} textAnchor="middle" fontSize="13" fontWeight="700" fill="#061009" opacity="0.75">{z.id}</text>
              <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#061009" opacity="0.68" fontFamily="ui-monospace,monospace">{fmt(z)}</text>
            </g>
          );
        })}
        {farm.risks.fire > 50 && (
          <g clipPath="url(#pc)" pointerEvents="none">
            <circle cx={S.hot[0]} cy={S.hot[1]} r="16" fill={C.n1} opacity="0.18" className="pulse" />
            <circle cx={S.hot[0]} cy={S.hot[1]} r="4.5" fill={C.n1} />
          </g>
        )}
        <g clipPath="url(#pc)" pointerEvents="none">
          <rect className="sweep" x="-160" y="0" width="160" height="360" fill="url(#sw)" />
        </g>
      </svg>
      <div className="scanfoot">
        <div className="ramp" aria-hidden="true">{RAMP.map((c, i) => <span key={i} style={{ background: layer === "fire" ? RAMP[4 - i] : c }} />)}</div>
        <span className="mono lbl" style={{ marginRight: "auto", color: C.t3 }}>
          {layer === "ndvi" ? (es ? "seco → sano" : "dry → healthy") : layer === "fire" ? (es ? "bajo → crítico" : "low → critical") : (es ? "seco → húmedo" : "dry → wet")}
        </span>
        <span className="mono lbl">{farm.ha} ha · 6 {es ? "zonas" : "zones"}</span>
      </div>
      {!compact && (
        <div className="readout">
          {act ? (
            <>
              <div className="ro-t" style={{ color: col(act) }}>{es ? "Zona" : "Zone"} {act.id} · {act.crop[es ? 0 : 1]}</div>
              <div className="ro-s">{act.ha} ha · NDVI {act.ndvi.toFixed(2)} · {es ? "riesgo incendio" : "fire risk"} {act.fire}% · {es ? "humedad suelo" : "soil moisture"} {act.soil}%</div>
            </>
          ) : (
            <>
              <div className="ro-t">{es ? "Toca una zona para ver su detalle" : "Tap a zone for detail"}</div>
              <div className="ro-s">{farm.label} · {farm.country} · {farm.tz}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Piezas reutilizables ── */
const Metric = ({ icon, c, label, value, unit, sub }) => (
  <div className="card" style={{ padding: 15 }}>
    <div className="mono lbl" style={{ marginBottom: 9 }}><Ic d={icon} s={12} c={c || C.t3} /> {label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-.02em", color: c || C.t1 }}>{value}</span>
      {unit && <span style={{ fontSize: 11.5, color: C.t3 }}>{unit}</span>}
    </div>
    {sub && <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 5 }}>{sub}</div>}
  </div>
);

const Bar = ({ label, v, c, threshold }) => (
  <div style={{ marginBottom: 13 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 12.5, color: C.t2 }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: c }}>{v}%</span>
    </div>
    <div style={{ height: 5, background: `${c}18`, borderRadius: 3, position: "relative" }}>
      <div style={{ height: "100%", width: `${v}%`, background: c, borderRadius: 3, transition: "width .7s" }} />
      {threshold != null && <div style={{ position: "absolute", left: `${threshold}%`, top: -3, width: 1, height: 11, background: C.t2 }} title={`umbral ${threshold}%`} />}
    </div>
  </div>
);

const AlertRow = ({ type, level, title, desc, time, channels }) => {
  const cfg = { fire: C.n1, drought: C.n2, flood: C.blue, pest: C.violet, frost: C.t2, wind: C.blue, ok: C.green };
  const icn = { fire: ic.fire, drought: ic.drought, flood: ic.water, pest: ic.bug, frost: ic.frost, wind: ic.wind, ok: ic.chk };
  const c = cfg[type] || C.green;
  return (
    <div style={{ display: "flex", gap: 12, padding: "13px 14px", background: `${c}0d`, border: `1px solid ${c}26`, borderRadius: 10, alignItems: "flex-start" }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: `${c}1f`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic d={icn[type]} s={15} c={c} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: c }}>{title}</span>
          {level && <span className="mono" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: c, border: `1px solid ${c}44`, borderRadius: 4, padding: "2px 5px" }}>{level}</span>}
        </div>
        <div style={{ fontSize: 12.3, color: C.t2, marginTop: 4, lineHeight: 1.55 }}>{desc}</div>
        {channels && <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 7 }}>{channels}</div>}
      </div>
      <span className="mono" style={{ fontSize: 10, color: C.t4, whiteSpace: "nowrap" }}>{time}</span>
    </div>
  );
};

const Toggle = ({ on, set, label, sub }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>{sub}</div>}
    </div>
    <button onClick={() => set(!on)} aria-pressed={on} aria-label={label} style={{ width: 40, height: 22, borderRadius: 12, border: "none", cursor: "pointer", background: on ? C.green : C.s3, position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: on ? "#04140B" : C.t3, transition: "left .2s" }} />
    </button>
  </div>
);

const Slider = ({ label, v, set, min, max, unit, c }) => (
  <div style={{ padding: "13px 0", borderBottom: `1px solid ${C.line}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: c }}>{v}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} style={{ accentColor: c }} aria-label={label} />
  </div>
);

/* ══════════════════ LANDING ══════════════════ */
const Landing = ({ es, lang, setLang, onEnter, live, setLive, onAdmin }) => {
  const t = (esS, enS, ptS) => pick(lang, esS, enS, ptS);
  const [wl, setWl] = useState(""); const [wlSent, setWlSent] = useState(false); const [wlErr, setWlErr] = useState(""); const [wlBusy, setWlBusy] = useState(false);
  const [nl, setNl] = useState(""); const [nlSent, setNlSent] = useState(false); const [nlErr, setNlErr] = useState("");
  const [ha, setHa] = useState(200);
  const [demo, setDemo] = useState("iowa");
  const [stats, setStats] = useState(null);
  const price = (9 + ha * 0.15).toFixed(2);
  const farm = FARMS[demo];

  useEffect(() => { fetchLeadStats().then(setStats).catch(() => {}); }, []);

  const submitWaitlist = async () => {
    if (!wl.includes("@") || wlBusy) return;
    setWlErr(""); setWlBusy(true);
    try { await postLead({ email: wl, kind: "waitlist", hectares: ha }); setWlSent(true); }
    catch (e) { setWlErr(e.message); }
    finally { setWlBusy(false); }
  };
  const submitNewsletter = async () => {
    if (!nl.includes("@")) return;
    setNlErr("");
    try { await postLead({ email: nl, kind: "newsletter" }); setNlSent(true); }
    catch (e) { setNlErr(e.message); }
  };

  const risks = [
    { i: ic.fire, c: C.n1, t: es ? "Incendios" : "Wildfires", d: es ? "Focos activos de NASA FIRMS, refrescados cada 6 h" : "Active fire spots from NASA FIRMS, refreshed every 6 h" },
    { i: ic.drought, c: C.n2, t: es ? "Sequías" : "Droughts", d: es ? "Déficit hídrico acumulado y NDVI en caída, zona por zona" : "Accumulated water deficit and falling NDVI, zone by zone" },
    { i: ic.water, c: C.blue, t: es ? "Inundaciones" : "Floods", d: es ? "Precipitación prevista cruzada con topografía SRTM" : "Forecast rainfall crossed with SRTM topography" },
    { i: ic.wind, c: C.blue, t: es ? "Viento y granizo" : "Wind and hail", d: es ? "Ráfagas por encima del umbral que tú configuras" : "Gusts above the threshold you set" },
    { i: ic.bug, c: C.violet, t: es ? "Plagas" : "Pests", d: es ? "Ventanas climáticas que favorecen un brote" : "Climate windows that favor an outbreak" },
    { i: ic.frost, c: C.t2, t: es ? "Heladas" : "Frost", d: es ? "Mínimas a nivel de suelo con 72 h de anticipación" : "Ground-level minimums, 72 h ahead" },
  ];
  const steps = [
    { n: "01", t: es ? "Dibujas tu campo una vez" : "Draw your farm once", d: es ? "Un polígono sobre el mapa o pegas las coordenadas. El sistema lo divide en zonas de manejo según lo que ve el satélite." : "One polygon on the map, or paste coordinates. The system splits it into management zones based on what the satellite sees." },
    { n: "02", t: es ? "Cada 6 horas bajamos datos frescos" : "Every 6 hours we pull fresh data", d: es ? "NASA FIRMS, Sentinel-2, ERA5, SoilGrids y Open-Meteo. Recalculamos el riesgo de cada zona, no del campo entero." : "NASA FIRMS, Sentinel-2, ERA5, SoilGrids and Open-Meteo. We recompute risk per zone, not for the whole farm." },
    { n: "03", t: es ? "Te avisamos antes, estés donde estés" : "You get the warning first, wherever you are", d: es ? "Si un riesgo cruza tu umbral sale un WhatsApp, un SMS y un correo al instante, con un PDF que sirve para el seguro." : "If a risk crosses your threshold, a WhatsApp, SMS and email go out at once, with a PDF your insurer can use." },
  ];
  const compare = [
    [es ? "Precio de entrada" : "Entry price", "$9 + $0.15/ha", es ? "~$25.000/mes" : "~$25,000/mo", es ? "Por ha/año" : "Per ha/year"],
    [es ? "Incendios en tiempo casi real" : "Near real-time wildfires", "on", "on", "on"],
    [es ? "Sequía por zona, no por campo" : "Drought per zone, not per farm", "on", "off", "off"],
    [es ? "Variedad recomendada con nombre científico" : "Recommended variety, scientific name", "on", "off", "half"],
    [es ? "Precio de mercado del cultivo" : "Crop market price", "on", "off", "off"],
    [es ? "Alertas por WhatsApp y SMS" : "WhatsApp and SMS alerts", "on", "off", "on"],
    [es ? "PDF con evidencia para el seguro" : "PDF evidence for insurance", "on", "off", "off"],
    [es ? "Idiomas" : "Languages", "ES · EN · PT · HI", "EN", "EN · ES"],
  ];
  const sources = ["NASA FIRMS", "ESA Copernicus Sentinel-2", "NOAA / ERA5", "SoilGrids ISRIC", "NASA SRTM", "Open-Meteo"];

  return (
    <>
      <div className="wrap">
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: `1px solid ${C.line}`, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" />
              <circle cx="12" cy="10.5" r="2.6" fill={C.green} />
            </svg>
            <span style={{ fontSize: 18.5, fontWeight: 700, letterSpacing: "-.02em" }}>{BRAND}</span>
            {!live && <span className="mono pill">{es ? "Beta global" : "Global beta"}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn ghost sm mono" onClick={() => setLive(!live)} style={{ fontSize: 10, color: C.t3 }}>
              {live ? (es ? "modo: activo" : "mode: live") : (es ? "modo: pre-lanzamiento" : "mode: pre-launch")}
            </button>
            <button className="btn ghost sm" onClick={() => setLang(nextLang(lang))} aria-label="Cambiar idioma">{langLabel(lang)}</button>
            <button className="btn sm" onClick={onEnter}>{live ? t("Entrar", "Log in", "Entrar") : t("Ver demo", "See demo", "Ver demonstração")}</button>
          </div>
        </nav>
      </div>

      {/* HERO */}
      <div className="wrap">
        <div className="hero">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>{t("Inteligencia climática satelital · cobertura mundial", "Satellite climate intelligence · worldwide coverage", "Inteligência climática por satélite · cobertura mundial")}</div>
            <h1 className="h1">
              {lang === "pt"
                ? <>O incêndio começa<br /><span style={{ color: C.green }}>seis horas</span> antes de<br />você ver.</>
                : es
                ? <>El incendio empieza<br /><span style={{ color: C.green }}>seis horas</span> antes de<br />que lo veas.</>
                : <>The fire starts<br /><span style={{ color: C.green }}>six hours</span> before<br />you see it.</>}
            </h1>
            <p className="lead" style={{ marginTop: 18, maxWidth: 470 }}>
              {t(
                `${BRAND} vigila tu campo desde el satélite y te avisa por WhatsApp cuando el riesgo de incendio, sequía, inundación, plaga o helada cruza tu umbral. Zona por zona, en cualquier país del mundo.`,
                `${BRAND} watches your farm from orbit and messages you on WhatsApp when wildfire, drought, flood, pest or frost risk crosses your threshold. Zone by zone, in any country on Earth.`,
                `A ${BRAND} vigia sua lavoura desde o satélite e avisa por WhatsApp quando o risco de incêndio, seca, enchente, praga ou geada cruza seu limite. Zona por zona, em qualquer país do mundo.`
              )}
            </p>

            {live ? (
              <div style={{ display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
                <button className="btn" onClick={onEnter} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {es ? "Analizar mi campo gratis" : "Analyze my farm free"} <Ic d={ic.arrow} s={15} c="#04140B" />
                </button>
                <button className="btn ghost">{es ? "Ver precios" : "See pricing"}</button>
              </div>
            ) : (
              <div style={{ marginTop: 26, maxWidth: 460 }}>
                {wlSent ? (
                  <div className="card" style={{ borderColor: `${C.green}44`, display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <Ic d={ic.chk} s={17} c={C.green} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{es ? "Estás en la lista" : "You're on the list"}</div>
                      <div style={{ fontSize: 12.5, color: C.t2, marginTop: 3, lineHeight: 1.55 }}>
                        {es ? "Te escribimos con tu acceso y el precio base congelado por un año. Si tienes campos en más de un país, respóndenos y los cargamos juntos." : "We'll write with your access and the base price locked for a year. If you farm in more than one country, reply and we'll load them together."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={wl} onChange={(e) => setWl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitWaitlist()} placeholder={es ? "tu@correo.com" : "you@email.com"} aria-label="Email" />
                      <button className="btn" onClick={submitWaitlist} disabled={wlBusy} style={{ whiteSpace: "nowrap", opacity: wlBusy ? 0.6 : 1 }}>{wlBusy ? t("Enviando…", "Sending…", "Enviando…") : t("Pedir acceso", "Request access", "Pedir acesso")}</button>
                    </div>
                    {wlErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 8 }}>{wlErr}</div>}
                    <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 10, lineHeight: 1.7 }}>
                      {es ? "El satélite ya cubre el planeta entero: si tu campo tiene coordenadas, lo monitoreamos." : "The satellites already cover the whole planet: if your farm has coordinates, we monitor it."}
                      <br />{stats
                        ? (es
                            ? `${stats.total} en lista · ${stats.countries} ${stats.countries === 1 ? "país" : "países"} · 6 continentes`
                            : `${stats.total} on the list · ${stats.countries} ${stats.countries === 1 ? "country" : "countries"} · 6 continents`)
                        : (es ? "Súmate a la lista global de campos monitoreados." : "Join the global list of monitored farms.")}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <ParcelScan farm={farm} es={es} />
        </div>

        {/* Selector de campo demo — cobertura global explícita */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", paddingBottom: 8 }}>
          <span className="mono lbl" style={{ marginRight: 4 }}><Ic d={ic.globe} s={12} c={C.t3} /> {es ? "Ver un campo real en:" : "See a real farm in:"}</span>
          {FARM_KEYS.map((k) => (
            <button key={k} onClick={() => setDemo(k)} className="mono chipbtn" style={{ borderColor: demo === k ? C.green : C.line, color: demo === k ? C.green : C.t2 }}>
              {FARMS[k].cc} · {FARMS[k].country}
            </button>
          ))}
        </div>
      </div>

      {/* RIESGOS */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{t("Qué vigila", "What it watches", "O que vigia")}</div>
        <h2 className="h2" style={{ marginTop: 12, maxWidth: 620 }}>{t("Seis amenazas, un solo umbral que tú defines", "Six threats, one threshold you set yourself", "Seis ameaças, um único limite que você define")}</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", marginTop: 26 }}>
          {risks.map((r, i) => (
            <div key={i} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: `${r.c}1a`, display: "grid", placeItems: "center" }}><Ic d={r.i} s={15} c={r.c} /></span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.t}</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55, margin: "11px 0 0" }}>{r.d}</p>
            </div>
          ))}
        </div>
      </section></div>

      {/* CICLO */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{es ? "El ciclo, cada 6 horas" : "The cycle, every 6 hours"}</div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", marginTop: 26, gap: 22 }}>
          {steps.map((s) => (
            <div key={s.n}>
              <div className="mono" style={{ fontSize: 11, color: C.green, letterSpacing: ".14em", paddingBottom: 12, borderBottom: `1px solid ${C.line2}` }}>{s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 650, margin: "14px 0 8px", letterSpacing: "-.015em" }}>{s.t}</h3>
              <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 34, borderColor: `${C.n1}33`, background: C.s2, display: "flex", gap: 14, alignItems: "flex-start", maxWidth: 640 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: `${C.n1}1f`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic d={ic.chat} s={17} c={C.n1} /></span>
          <div>
            <div className="mono" style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".1em" }}>{es ? "WhatsApp · hoy 04:12" : "WhatsApp · today 04:12"}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "8px 0 0" }}>
              {es ? `${BRAND}: riesgo de incendio 74% en la zona F de tu campo (16 ha, barbecho). Foco de calor a 2,3 km al noreste, viento 38 km/h hacia tu lote. Adjunto PDF con coordenadas y hora satelital.`
                : `${BRAND}: 74% wildfire risk in zone F of your farm (16 ha, fallow). Heat spot 2.3 km northeast, wind 38 km/h toward your block. PDF attached with coordinates and satellite timestamp.`}
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
              <span className="mono lbl"><Ic d={ic.file} s={12} c={C.t3} /> {es ? "reporte-incendio.pdf" : "wildfire-report.pdf"}</span>
              <span className="mono lbl"><Ic d={ic.clock} s={12} c={C.t3} /> {es ? "enviado en 40 s" : "sent in 40 s"}</span>
            </div>
          </div>
        </div>
      </section></div>

      {/* PRECIOS */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{es ? "Precio" : "Pricing"}</div>
        <h2 className="h2" style={{ marginTop: 12 }}>{es ? "$9 al mes, más $0.15 por hectárea" : "$9 a month, plus $0.15 per hectare"}</h2>
        <p className="lead" style={{ marginTop: 10, maxWidth: 570 }}>
          {es ? "El mismo precio en Iowa, en Punjab o en Mato Grosso. Sin contrato anual, sin mínimo de hectáreas, sin llamada de ventas." : "Same price in Iowa, Punjab or Mato Grosso. No annual contract, no hectare minimum, no sales call."}
        </p>
        <div className="grid" style={{ gridTemplateColumns: "1.05fr .95fr", marginTop: 28, gap: 18 }}>
          <div className="card" style={{ borderColor: C.line2 }}>
            <div className="mono lbl" style={{ marginBottom: 16 }}>{es ? "Calcula tu mensualidad" : "Work out your monthly bill"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-.03em", color: C.green }}>${price}</span>
              <span style={{ fontSize: 13, color: C.t3 }}>{es ? "/ mes" : "/ month"}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>$9 + $0.15 × {ha} ha</div>
            <input type="range" min="10" max="2500" step="10" value={ha} onChange={(e) => setHa(Number(e.target.value))} aria-label="ha" style={{ marginTop: 20 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span className="mono lbl">10 ha</span><span className="mono lbl" style={{ color: C.t1 }}>{ha} ha</span><span className="mono lbl">2500 ha</span>
            </div>
            <button className="btn" style={{ width: "100%", marginTop: 20 }} onClick={onEnter}>{live ? (es ? `Empezar con ${ha} ha` : `Start with ${ha} ha`) : (es ? "Reservar este precio" : "Lock this price")}</button>
            <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 10, textAlign: "center" }}>{es ? "Pago con Stripe · cancelas cuando quieras" : "Stripe checkout · cancel anytime"}</div>
          </div>
          <div className="card">
            <div className="mono lbl" style={{ marginBottom: 14 }}>{es ? "Incluido en cualquier tamaño y país" : "Included at any size, any country"}</div>
            {[es ? "Análisis cada 6 horas de todas tus zonas" : "Every zone re-analyzed every 6 hours",
              es ? "Alertas por WhatsApp, SMS y correo" : "WhatsApp, SMS and email alerts",
              es ? "Umbrales configurables por tipo de riesgo" : "Configurable thresholds per risk type",
              es ? "PDF con evidencia satelital para el seguro" : "PDF with satellite evidence for your insurer",
              es ? "Variedad recomendada y precio de mercado local" : "Recommended variety and local market price",
              es ? "Español, inglés, portugués e hindi" : "Spanish, English, Portuguese and Hindi"].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 0", borderBottom: i < 5 ? `1px solid ${C.line}` : "none" }}>
                <Ic d={ic.chk} s={14} c={C.green} /><span style={{ fontSize: 12.8, color: C.t2, lineHeight: 1.45 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", marginTop: 18 }}>
          {[50, 200, 640, 2100].map((t) => (
            <button key={t} onClick={() => setHa(t)} className="card" style={{ textAlign: "left", cursor: "pointer", borderColor: ha === t ? C.green : C.line, background: ha === t ? "rgba(61,220,132,.06)" : C.s1, color: C.t1, font: "inherit" }}>
              <div className="mono lbl">{t} ha</div>
              <div style={{ fontSize: 23, fontWeight: 700, marginTop: 6, letterSpacing: "-.02em" }}>${(9 + t * 0.15).toFixed(2)}<span style={{ fontSize: 11.5, fontWeight: 400, color: C.t3 }}>{es ? "/mes" : "/mo"}</span></div>
            </button>
          ))}
        </div>
      </section></div>

      {/* COMPARATIVA */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{es ? "Frente a lo que ya existe" : "Against what already exists"}</div>
        <div style={{ marginTop: 22, overflowX: "auto" }}>
          <table>
            <thead><tr><th style={{ minWidth: 220 }}></th><th style={{ color: C.green }}>{BRAND}</th><th>{es ? "Plataformas enterprise" : "Enterprise platforms"}</th><th>{es ? "Suites agronómicas" : "Agronomy suites"}</th></tr></thead>
            <tbody>
              {compare.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: C.t2 }}>{row[0]}</td>
                  {row.slice(1).map((cell, j) => (
                    <td key={j} style={{ color: j === 0 ? C.t1 : C.t3, fontWeight: j === 0 ? 600 : 400 }}>
                      {cell === "on" ? <Ic d={ic.chk} s={15} c={j === 0 ? C.green : C.t3} /> : cell === "off" ? <span style={{ color: C.t4 }}>—</span> : cell === "half" ? <span style={{ color: C.n3 }}>{es ? "parcial" : "partial"}</span> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section></div>

      {/* DATOS + PRIVACIDAD */}
      <div className="wrap"><section className="sec">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          <div>
            <div className="eyebrow">{es ? "De dónde salen los datos" : "Where the data comes from"}</div>
            <p className="lead" style={{ marginTop: 12, fontSize: 13.5 }}>
              {es ? "Todo viene de constelaciones y modelos públicos que cubren el planeta completo. No vendemos imágenes: vendemos la lectura de tu campo, ya cruzada y traducida a una decisión." : "Everything comes from public constellations and models that cover the entire planet. We don't sell imagery: we sell the reading of your farm, cross-checked and turned into a decision."}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16 }}>
              {sources.map((s) => <span key={s} className="mono" style={{ fontSize: 10.5, color: C.t2, border: `1px solid ${C.line}`, borderRadius: 6, padding: "5px 9px" }}>{s}</span>)}
            </div>
          </div>
          <div>
            <div className="eyebrow">{es ? "Tus coordenadas son tuyas" : "Your coordinates stay yours"}</div>
            <p className="lead" style={{ marginTop: 12, fontSize: 13.5 }}>
              {es ? "La ubicación exacta viaja cifrada y se guarda cifrada. No la compartimos con nadie, ni con aseguradoras, salvo que tú envíes el reporte. Exportas o borras todo desde Configuración." : "Your exact location travels encrypted and is stored encrypted. We share it with no one, insurers included, unless you send the report yourself. Export or delete everything from Settings."}
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              <span className="mono lbl"><Ic d={ic.lock} s={12} c={C.t3} /> AES-256</span>
              <span className="mono lbl"><Ic d={ic.lock} s={12} c={C.t3} /> TLS 1.3</span>
              <span className="mono lbl"><Ic d={ic.eye} s={12} c={C.t3} /> GDPR · LGPD · CCPA</span>
            </div>
          </div>
        </div>
      </section></div>

      {/* NEWSLETTER */}
      <div className="wrap"><section className="sec">
        <div className="card" style={{ borderColor: C.line2, background: C.s2, padding: 26 }}>
          <div className="grid" style={{ gridTemplateColumns: "1.15fr 1fr", gap: 26, alignItems: "center" }}>
            <div>
              <div className="eyebrow"><Ic d={ic.mail} s={12} c={C.t3} /> {es ? "Boletín semanal" : "Weekly briefing"}</div>
              <h2 className="h2" style={{ marginTop: 12, fontSize: 22 }}>{es ? "El parte climático de tu región, cada lunes" : "Your region's climate briefing, every Monday"}</h2>
              <p className="lead" style={{ marginTop: 9, fontSize: 13.3 }}>
                {es ? "Anomalías de El Niño y La Niña, ventanas de siembra, precios de commodities y qué está pasando con el clima en las zonas agrícolas del mundo. Sin costo y sin ser cliente." : "El Niño and La Niña anomalies, planting windows, commodity prices and what the weather is doing across the world's farming belts. Free, no account needed."}
              </p>
            </div>
            <div>
              {nlSent ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 16px", background: `${C.green}12`, border: `1px solid ${C.green}44`, borderRadius: 10 }}>
                  <Ic d={ic.chk} s={16} c={C.green} />
                  <span style={{ fontSize: 13 }}>{es ? "Suscrito. El primer parte llega el lunes." : "Subscribed. First briefing arrives Monday."}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={nl} onChange={(e) => setNl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitNewsletter()} placeholder={es ? "tu@correo.com" : "you@email.com"} aria-label={es ? "Correo para el boletín" : "Newsletter email"} />
                    <button className="btn" onClick={submitNewsletter} style={{ whiteSpace: "nowrap" }}>{es ? "Suscribirme" : "Subscribe"}</button>
                  </div>
                  {nlErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 8 }}>{nlErr}</div>}
                  <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 9 }}>{es ? "Un correo por semana. Te das de baja en un clic." : "One email a week. Unsubscribe in one click."}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section></div>

      {/* CIERRE */}
      <div className="wrap"><section className="sec" style={{ textAlign: "center", paddingBottom: 40 }}>
        <h2 className="h2" style={{ maxWidth: 570, margin: "0 auto" }}>{t("¿Cuánto perdiste la última vez que el clima te agarró desprevenido?", "What did it cost you last time the weather caught you off guard?", "Quanto você perdeu da última vez que o clima te pegou de surpresa?")}</h2>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn" onClick={onEnter} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {live ? (es ? "Analizar mi campo gratis" : "Analyze my farm free") : (es ? "Pedir acceso a la beta" : "Request beta access")} <Ic d={ic.arrow} s={15} c="#04140B" />
          </button>
          <button className="btn ghost">{es ? "Hablar con nosotros" : "Talk to us"}</button>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 18 }}>{es ? "Disponible para campos en cualquier país · soporte en 4 idiomas" : "Available for farms in any country · support in 4 languages"}</div>
      </section></div>

      <div className="wrap">
        <footer style={{ borderTop: `1px solid ${C.line}`, padding: "22px 0 34px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 10.5, color: C.t4 }}>{BRAND} © 2026 · {DOMAIN}</span>
          <span style={{ display: "flex", gap: 14 }}>
            <button onClick={onAdmin} className="mono" style={{ fontSize: 10.5, color: C.t4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{es ? "Administrador" : "Admin"}</button>
            <span className="mono" style={{ fontSize: 10.5, color: C.t4 }}>{es ? "Datos: NASA · ESA · NOAA · ISRIC" : "Data: NASA · ESA · NOAA · ISRIC"}</span>
          </span>
        </footer>
      </div>
    </>
  );
};

/* ══════════════════ LOGIN ══════════════════ */
const Login = ({ es, onDone, onBack }) => {
  const [tab, setTab] = useState("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      if (tab === "up") await userAuth("signup", { email, password, name });
      else await userAuth("login", { email, password });
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 22 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 22 }}>← {es ? "Volver" : "Back"}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" /><circle cx="12" cy="10.5" r="2.6" fill={C.green} /></svg>
          <span style={{ fontSize: 19, fontWeight: 700 }}>{BRAND}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {[["in", es ? "Entrar" : "Log in"], ["up", es ? "Crear cuenta" : "Sign up"]].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setErr(""); }} className="mono chipbtn" style={{ borderColor: tab === k ? C.green : C.line, color: tab === k ? C.green : C.t3 }}>{l}</button>
          ))}
        </div>
        <form className="card" style={{ padding: 20 }} onSubmit={submit}>
          {tab === "up" && <><label className="mono lbl">{es ? "Nombre" : "Name"}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder={es ? "María Fernández" : "Jane Doe"} style={{ margin: "7px 0 14px" }} /></>}
          <label className="mono lbl">{es ? "Correo" : "Email"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" style={{ margin: "7px 0 14px" }} />
          <label className="mono lbl">{es ? "Contraseña" : "Password"}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ margin: "7px 0 4px" }} />
          {tab === "up" && <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 10, lineHeight: 1.6 }}>{es ? "Mínimo 6 caracteres. Al crear la cuenta aceptas el tratamiento cifrado de las coordenadas de tu campo." : "At least 6 characters. By signing up you accept encrypted processing of your field coordinates."}</div>}
          {err && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 12 }}>{err}</div>}
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 16, opacity: busy ? 0.6 : 1 }}>{busy ? (es ? "Un momento…" : "One moment…") : tab === "in" ? (es ? "Entrar" : "Log in") : (es ? "Crear cuenta" : "Create account")}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.line }} /><span className="mono" style={{ fontSize: 10, color: C.t4 }}>{es ? "o" : "or"}</span><div style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          <button className="btn ghost" type="button" style={{ width: "100%" }} onClick={onDone}>{es ? "Continuar sin cuenta (demo)" : "Continue without account (demo)"}</button>
        </form>
        <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 16, textAlign: "center" }}>{es ? "Tu cuenta guarda tus campos de verdad." : "Your account saves your fields for real."}</div>
      </div>
    </div>
  );
};

/* ══════════════════ DASHBOARD ══════════════════ */
const Dashboard = ({ es, lang, setLang, onLogout }) => {
  const [tab, setTab] = useState("overview");
  const [farmKey, setFarmKey] = useState("cordoba");
  const [layer, setLayer] = useState("ndvi");
  const [zone, setZone] = useState(null);
  const [nav, setNav] = useState(false);
  const [me, setMe] = useState(null);
  const savedFarms = me?.farms || [];
  // Resuelve el campo activo: uno guardado del usuario (saved:<id>) o uno demo.
  const savedFarm = farmKey.startsWith("saved:") ? savedFarms.find((s) => `saved:${s.id}` === farmKey) : null;
  const farm = savedFarm ? synthFarm(savedFarm) : (FARMS[farmKey] || FARMS.cordoba);
  const weatherDemo = useMemo(() => buildWeather(farm), [farmKey]);
  const [liveWeather, setLiveWeather] = useState(null);
  useEffect(() => {
    let active = true;
    setLiveWeather(null);
    fetchWeather(farm.lat, farm.lng).then((d) => { if (active) setLiveWeather(d); });
    return () => { active = false; };
  }, [farmKey]);
  const weather = liveWeather ?? weatherDemo;
  const weatherLive = !!liveWeather;

  const [fires, setFires] = useState(null);
  useEffect(() => {
    let active = true;
    setFires(null);
    fetchFires(farm.lat, farm.lng).then((d) => { if (active) setFires(d); });
    return () => { active = false; };
  }, [farmKey]);

  // Cuenta de usuario: carga el perfil y sus campos guardados.
  const [savedMsg, setSavedMsg] = useState("");
  useEffect(() => { fetchMe().then(setMe); }, []);

  // Resumen real de la cuenta (nº de campos, hectáreas, etc.), solo con sesión.
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!me) { setStats(null); return; }
    fetchUserStats().then(setStats);
  }, [me]);
  const persistFarm = async () => {
    setSavedMsg("");
    try {
      await saveFarm({ name: farm.label, lat: farm.lat, lng: farm.lng, hectares: farm.ha });
      setMe(await fetchMe());
      setSavedMsg(es ? "Campo guardado" : "Field saved");
    } catch (e) { setSavedMsg(e.message); }
  };
  const removeFarm = async () => {
    setSavedMsg("");
    try {
      await deleteFarm(farm.id);
      setMe(await fetchMe());
      setFarmKey("cordoba");
      setZone(null);
      setSavedMsg(es ? "Campo quitado" : "Field removed");
    } catch (e) { setSavedMsg(e.message); }
  };

  // Edición de un campo propio (nombre y, opcionalmente, hectáreas).
  const [renameOpen, setRenameOpen] = useState(false);
  const [rf, setRf] = useState({ name: "", ha: "" });
  const [rfBusy, setRfBusy] = useState(false);
  const [rfErr, setRfErr] = useState("");
  const openRename = () => {
    setRfErr("");
    setRf({ name: savedFarm?.name || farm.label, ha: savedFarm?.hectares != null ? String(savedFarm.hectares) : "" });
    setRenameOpen(true);
  };
  const submitRename = async (e) => {
    e.preventDefault();
    if (rfBusy) return;
    if (!rf.name.trim()) { setRfErr(es ? "El nombre es obligatorio" : "Name is required"); return; }
    setRfBusy(true);
    setRfErr("");
    try {
      const payload = { name: rf.name.trim() };
      if (rf.ha !== "") payload.hectares = rf.ha;
      await updateFarm(savedFarm?.id || farm.id, payload);
      setMe(await fetchMe());
      setRenameOpen(false);
      setSavedMsg(es ? "Campo actualizado" : "Field updated");
    } catch (e2) { setRfErr(e2.message); }
    finally { setRfBusy(false); }
  };

  // Alta de un campo nuevo por coordenadas.
  const [addOpen, setAddOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", lat: "", lng: "", ha: "" });
  const [nfErr, setNfErr] = useState("");
  const [nfBusy, setNfBusy] = useState(false);
  const createNewFarm = async (e) => {
    e.preventDefault();
    if (nfBusy) return;
    setNfBusy(true);
    setNfErr("");
    try {
      const created = await saveFarm({
        name: nf.name,
        lat: nf.lat === "" ? undefined : nf.lat,
        lng: nf.lng === "" ? undefined : nf.lng,
        hectares: nf.ha === "" ? undefined : nf.ha,
      });
      setMe(await fetchMe());
      setFarmKey(`saved:${created.id}`);
      setZone(null);
      setSavedMsg("");
      setAddOpen(false);
      setNf({ name: "", lat: "", lng: "", ha: "" });
    } catch (e2) { setNfErr(e2.message); }
    finally { setNfBusy(false); }
  };

  /* settings */
  const [wa, setWa] = useState(true), [sms, setSms] = useState(true), [mail, setMail] = useState(true), [push, setPush] = useState(false);
  const [daily, setDaily] = useState(true), [weekly, setWeekly] = useState(true), [autoPdf, setAutoPdf] = useState(true), [insCopy, setInsCopy] = useState(false);
  const [thFire, setThFire] = useState(60), [thFlood, setThFlood] = useState(50), [thDrought, setThDrought] = useState(40), [thWind, setThWind] = useState(50);

  // Carga las preferencias guardadas del usuario (si tiene sesión).
  const [settingsMsg, setSettingsMsg] = useState("");
  useEffect(() => {
    fetchSettings().then((s) => {
      if (!s) return;
      setWa(s.wa); setSms(s.sms); setMail(s.mail); setPush(s.push);
      setDaily(s.daily); setWeekly(s.weekly); setAutoPdf(s.autoPdf); setInsCopy(s.insCopy);
      setThFire(s.thFire); setThFlood(s.thFlood); setThDrought(s.thDrought); setThWind(s.thWind);
    });
  }, []);
  const saveSettings = async () => {
    setSettingsMsg("");
    try {
      await putSettings({ thFire, thFlood, thDrought, thWind, wa, sms, mail, push, daily, weekly, autoPdf, insCopy });
      setSettingsMsg(es ? "Configuración guardada" : "Settings saved");
    } catch (e) { setSettingsMsg(e.message); }
  };

  /* cambio de contraseña real (conectado al backend) */
  const [pwCur, setPwCur] = useState(""), [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState(""), [pwBusy, setPwBusy] = useState(false);
  const submitPassword = async () => {
    if (pwBusy) return;
    setPwMsg("");
    if (String(pwNew).length < 6) {
      setPwMsg(es ? "La nueva contraseña debe tener al menos 6 caracteres" : "New password must be at least 6 characters");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(pwCur, pwNew);
      setPwMsg(es ? "Contraseña actualizada" : "Password updated");
      setPwCur(""); setPwNew("");
    } catch (e) { setPwMsg(e.message); }
    finally { setPwBusy(false); }
  };

  /* perfil real: el nombre se carga de la sesión y se guarda en el backend */
  const [profName, setProfName] = useState("");
  const [profMsg, setProfMsg] = useState(""), [profBusy, setProfBusy] = useState(false);
  useEffect(() => { setProfName(me?.user?.name || ""); }, [me]);
  const submitProfile = async () => {
    if (profBusy) return;
    setProfMsg("");
    setProfBusy(true);
    try {
      const r = await updateProfile(profName.trim());
      setMe((prev) => (prev ? { ...prev, user: { ...prev.user, ...r.user } } : prev));
      setProfMsg(es ? "Perfil actualizado" : "Profile updated");
    } catch (e) { setProfMsg(e.message); }
    finally { setProfBusy(false); }
  };

  /* privacidad y datos: exportación y borrado reales de la cuenta */
  const [privMsg, setPrivMsg] = useState("");
  const doExport = async () => {
    setPrivMsg("");
    try { await exportData(); }
    catch (e) { setPrivMsg(e.message); }
  };
  const doDeleteAccount = async () => {
    setPrivMsg("");
    const msg = es
      ? "¿Eliminar tu cuenta y todos tus campos? Esta acción es irreversible."
      : "Delete your account and all your fields? This action cannot be undone.";
    if (typeof window !== "undefined" && !window.confirm(msg)) return;
    try {
      await deleteAccount(); // borra en el backend y limpia el token
      setMe(null);
      onLogout(); // vuelve al landing
    } catch (e) { setPrivMsg(e.message); }
  };

  const zones = farm.zones.map((v, i) => ({
    id: "ABCDEF"[i], ndvi: v, ha: Math.round((farm.ha / 6) * (0.7 + (i % 3) * 0.3)),
    crop: farm.zoneCrop[i], fire: Math.min(97, Math.round(farm.risks.fire * (1.35 - v))), soil: Math.round(v * 100 * 0.55 + 12),
  }));
  const avgNdvi = (zones.reduce((a, z) => a + z.ndvi * z.ha, 0) / zones.reduce((a, z) => a + z.ha, 0)).toFixed(2);
  const worst = Math.max(...Object.values(farm.risks));
  const cost = (9 + farm.ha * 0.15).toFixed(2);

  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState("");
  const generateReport = async () => {
    if (genBusy) return;
    setGenBusy(true);
    setGenErr("");
    try {
      await downloadReport({
        lang: es ? "es" : "en",
        generatedAt: new Date().toISOString(),
        farm: { label: farm.label, country: farm.country, coord: farm.coord, hectares: farm.ha, elev: farm.elev },
        risks: farm.risks,
        zones: zones.map((z) => ({ id: z.id, crop: z.crop[es ? 0 : 1], ndvi: z.ndvi, ha: z.ha, fire: z.fire, soil: z.soil })),
      });
    } catch (e) {
      setGenErr(e.message);
    } finally {
      setGenBusy(false);
    }
  };

  const tabs = [
    { id: "overview", l: es ? "Vista general" : "Overview", i: ic.grid },
    { id: "geomap", l: es ? "Geomapa" : "Geomap", i: ic.map },
    { id: "weather", l: es ? "Clima" : "Weather", i: ic.sun },
    { id: "drought", l: es ? "Sequías" : "Droughts", i: ic.drought },
    { id: "crops", l: es ? "Cultivos" : "Crops", i: ic.leaf },
    { id: "pests", l: es ? "Plagas" : "Pests", i: ic.bug },
    { id: "alerts", l: es ? "Alertas" : "Alerts", i: ic.bell },
    { id: "reports", l: es ? "Reportes" : "Reports", i: ic.file },
    { id: "settings", l: es ? "Configuración" : "Settings", i: ic.gear },
  ];

  const alerts = [
    { type: "fire", level: es ? "urgente" : "urgent", title: es ? "Riesgo de incendio 74% — zona F" : "74% wildfire risk — zone F", desc: es ? "Foco de calor VIIRS a 2,3 km al noreste. Viento 38 km/h en dirección al lote. Barbecho seco, NDVI 0.19." : "VIIRS heat spot 2.3 km northeast. Wind 38 km/h toward the block. Dry fallow, NDVI 0.19.", time: "04:12", ch: es ? "Enviado por WhatsApp · SMS · correo · PDF adjunto" : "Sent via WhatsApp · SMS · email · PDF attached" },
    { type: "drought", level: es ? "alta" : "high", title: es ? "Déficit hídrico 58% — zonas C y D" : "58% water deficit — zones C and D", desc: es ? "Sin precipitación efectiva hace 24 días. NDVI cayó 0.14 puntos en dos pasadas satelitales." : "No effective rainfall for 24 days. NDVI dropped 0.14 points across two satellite passes.", time: es ? "ayer" : "yesterday", ch: es ? "Enviado por WhatsApp · correo" : "Sent via WhatsApp · email" },
    { type: "wind", level: es ? "media" : "medium", title: es ? "Ráfagas de 46 km/h previstas" : "46 km/h gusts forecast", desc: es ? "Mañana entre 14:00 y 19:00. Por debajo de tu umbral de 50 km/h, registrado sin notificación push." : "Tomorrow between 14:00 and 19:00. Below your 50 km/h threshold, logged without push.", time: "2 d", ch: es ? "Solo registrado en el panel" : "Logged in dashboard only" },
    { type: "ok", level: null, title: es ? "Zonas A, B y E dentro de parámetros" : "Zones A, B and E within range", desc: es ? "NDVI estable, humedad de suelo sobre el mínimo, sin focos activos en 40 km." : "Stable NDVI, soil moisture above minimum, no active fire spots within 40 km.", time: "6 h", ch: null },
  ];

  const maxT = Math.max(...weather.map((d) => d.tmax));
  const maxP = Math.max(...weather.map((d) => d.p), 1);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside className={"side" + (nav ? " open" : "")}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 4px 20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" /><circle cx="12" cy="10.5" r="2.6" fill={C.green} /></svg>
          <span style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-.02em" }}>{BRAND}</span>
        </div>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setNav(false); }} className="navbtn" style={{ background: tab === t.id ? C.s2 : "transparent", color: tab === t.id ? C.t1 : C.t3, borderLeft: `2px solid ${tab === t.id ? C.green : "transparent"}` }}>
            <Ic d={t.i} s={15} c={tab === t.id ? C.green : C.t3} /> {t.l}
          </button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
          <div className="mono lbl" style={{ padding: "0 10px 8px" }}>{es ? "Plan activo" : "Active plan"}</div>
          <div style={{ padding: "0 10px 12px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.green }}>${cost}<span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>{es ? "/mes" : "/mo"}</span></div>
            <div className="mono" style={{ fontSize: 10, color: C.t4 }}>{farm.ha} ha · {farm.country}</div>
          </div>
          <button className="navbtn" onClick={onLogout} style={{ color: C.t3 }}><Ic d={ic.out} s={15} c={C.t3} /> {es ? "Cerrar sesión" : "Log out"}</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", position: "sticky", top: 0, background: C.bg, zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn ghost sm burger" onClick={() => setNav(!nav)} aria-label="menu">☰</button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-.015em" }}>{tabs.find((t) => t.id === tab).l}</div>
              <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{farm.label} · {farm.country} · {farm.coord}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={farmKey} onChange={(e) => { setFarmKey(e.target.value); setZone(null); setSavedMsg(""); setRenameOpen(false); }} className="mono sel" aria-label={es ? "Campo" : "Farm"}>
              {savedFarms.length > 0 && (
                <optgroup label={es ? "Mis campos" : "My fields"}>
                  {savedFarms.map((f) => <option key={f.id} value={`saved:${f.id}`}>{f.name}</option>)}
                </optgroup>
              )}
              <optgroup label={es ? "Campos demo" : "Demo fields"}>
                {FARM_KEYS.map((k) => <option key={k} value={k}>{FARMS[k].label} — {FARMS[k].country}</option>)}
              </optgroup>
            </select>
            <button className="btn ghost sm" onClick={() => setLang(nextLang(lang))} aria-label="Cambiar idioma">{langLabel(lang)}</button>
            {me && !farm.saved && (
              <button className="btn ghost sm" onClick={persistFarm} title={me.user?.email} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ic d={ic.pin} s={12} /> {savedMsg || (es ? "Guardar campo" : "Save field")}
              </button>
            )}
            {me && farm.saved && (
              <button className="btn ghost sm" onClick={openRename} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ic d={ic.gear} s={12} /> {es ? "Editar campo" : "Edit field"}
              </button>
            )}
            {me && farm.saved && (
              <button className="btn ghost sm" onClick={removeFarm} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.n1 }}>
                {savedMsg || (es ? "Quitar campo" : "Remove field")}
              </button>
            )}
            {me && (
              <button className="btn ghost sm" onClick={() => { setAddOpen((v) => !v); setNfErr(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Ic d={ic.plus} s={12} /> {es ? "Nuevo campo" : "New field"}
              </button>
            )}
            <span className="mono lbl" style={{ color: C.green }}><span className="dot" /> {es ? "próximo análisis 4h 12m" : "next analysis 4h 12m"}</span>
          </div>
        </header>

        <div style={{ padding: 24, maxWidth: 1180 }}>
          {addOpen && me && (
            <form className="card" onSubmit={createNewFarm} style={{ marginBottom: 14 }}>
              <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Nuevo campo" : "New field"}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label style={{ flex: "2 1 200px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{es ? "Nombre" : "Name"}</div>
                  <input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder={es ? "Lote Norte" : "North field"} required />
                </label>
                <label style={{ flex: "1 1 110px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{es ? "Latitud" : "Latitude"}</div>
                  <input value={nf.lat} onChange={(e) => setNf({ ...nf, lat: e.target.value })} placeholder="-33.13" inputMode="decimal" />
                </label>
                <label style={{ flex: "1 1 110px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{es ? "Longitud" : "Longitude"}</div>
                  <input value={nf.lng} onChange={(e) => setNf({ ...nf, lng: e.target.value })} placeholder="-64.35" inputMode="decimal" />
                </label>
                <label style={{ flex: "1 1 90px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>ha</div>
                  <input value={nf.ha} onChange={(e) => setNf({ ...nf, ha: e.target.value })} placeholder="480" inputMode="numeric" />
                </label>
                <button className="btn sm" type="submit" disabled={nfBusy} style={{ opacity: nfBusy ? 0.6 : 1 }}>{nfBusy ? (es ? "Creando…" : "Creating…") : es ? "Crear" : "Create"}</button>
                <button className="btn ghost sm" type="button" onClick={() => setAddOpen(false)}>{es ? "Cancelar" : "Cancel"}</button>
              </div>
              {nfErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 10 }}>{nfErr}</div>}
            </form>
          )}
          {renameOpen && me && farm.saved && (
            <form className="card" onSubmit={submitRename} style={{ marginBottom: 14 }}>
              <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Editar campo" : "Edit field"}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label style={{ flex: "2 1 200px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{es ? "Nombre" : "Name"}</div>
                  <input value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} placeholder={es ? "Lote Norte" : "North field"} required />
                </label>
                <label style={{ flex: "1 1 90px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>ha</div>
                  <input value={rf.ha} onChange={(e) => setRf({ ...rf, ha: e.target.value })} placeholder="480" inputMode="numeric" />
                </label>
                <button className="btn sm" type="submit" disabled={rfBusy} style={{ opacity: rfBusy ? 0.6 : 1 }}>{rfBusy ? (es ? "Guardando…" : "Saving…") : es ? "Guardar" : "Save"}</button>
                <button className="btn ghost sm" type="button" onClick={() => setRenameOpen(false)}>{es ? "Cancelar" : "Cancel"}</button>
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 10 }}>
                {es ? "La ubicación del campo se conserva." : "The field location is preserved."}
              </div>
              {rfErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 8 }}>{rfErr}</div>}
            </form>
          )}
          {/* ── VISTA GENERAL ── */}
          {tab === "overview" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.fire} c={riskColor(farm.risks.fire)} label={es ? "Riesgo mayor" : "Top risk"} value={worst} unit="%" sub={es ? "incendio · zona F" : "wildfire · zone F"} />
                <Metric icon={ic.leaf} c={ndviColor(Number(avgNdvi))} label="NDVI" value={avgNdvi} sub={es ? "promedio ponderado" : "weighted average"} />
                <Metric icon={ic.map} label={es ? "Superficie" : "Area"} value={farm.ha} unit="ha" sub={es ? "6 zonas de manejo" : "6 management zones"} />
                <Metric icon={ic.water} c={C.blue} label={es ? "Lluvia 10 d" : "Rain 10 d"} value={weather.reduce((a, d) => a + d.p, 0)} unit="mm" sub={es ? "pronóstico Open-Meteo" : "Open-Meteo forecast"} />
                <Metric icon={ic.bell} c={C.n2} label={es ? "Alertas 7 d" : "Alerts 7 d"} value="3" sub={es ? "1 urgente · 1 alta" : "1 urgent · 1 high"} />
              </div>

              {fires && (fires.count > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <AlertRow type="fire" level={es ? "en vivo" : "live"}
                    title={es ? `${fires.count} foco(s) de calor a menos de 50 km` : `${fires.count} heat spot(s) within 50 km`}
                    desc={es ? `Datos NASA FIRMS (VIIRS). El más cercano a ${fires.fires?.[0]?.distanceKm ?? "—"} km del campo.` : `NASA FIRMS data (VIIRS). Nearest ${fires.fires?.[0]?.distanceKm ?? "—"} km from the field.`}
                    time="FIRMS" channels={null} />
                </div>
              ) : (
                <div className="mono lbl" style={{ marginTop: 14, color: C.green }}>
                  <span className="dot" /> {es ? "Sin focos activos cerca · NASA FIRMS en vivo" : "No active fire spots nearby · NASA FIRMS live"}
                </div>
              ))}

              <div className="grid" style={{ gridTemplateColumns: "1.25fr 1fr", marginTop: 14, gap: 14 }}>
                <div>
                  <ParcelScan farm={farm} es={es} layer={layer} onZone={setZone} selected={zone} />
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {[["ndvi", es ? "Vigor NDVI" : "NDVI vigor"], ["fire", es ? "Riesgo incendio" : "Fire risk"], ["soil", es ? "Humedad suelo" : "Soil moisture"]].map(([k, l]) => (
                      <button key={k} onClick={() => setLayer(k)} className="mono chipbtn" style={{ borderColor: layer === k ? C.green : C.line, color: layer === k ? C.green : C.t3 }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 16 }}>{es ? "Riesgo del campo · umbral marcado" : "Farm risk · threshold marked"}</div>
                  <Bar label={es ? "Incendio" : "Wildfire"} v={farm.risks.fire} c={riskColor(farm.risks.fire)} threshold={thFire} />
                  <Bar label={es ? "Sequía" : "Drought"} v={farm.risks.drought} c={riskColor(farm.risks.drought)} threshold={thDrought} />
                  <Bar label={es ? "Inundación" : "Flood"} v={farm.risks.flood} c={riskColor(farm.risks.flood)} threshold={thFlood} />
                  <Bar label={es ? "Plagas" : "Pests"} v={farm.risks.pest} c={riskColor(farm.risks.pest)} />
                  <Bar label={es ? "Viento" : "Wind"} v={farm.risks.wind} c={riskColor(farm.risks.wind)} threshold={thWind} />
                  <Bar label={es ? "Helada" : "Frost"} v={farm.risks.frost} c={riskColor(farm.risks.frost)} />
                </div>
              </div>

              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Últimas alertas" : "Latest alerts"}</div>
                <div style={{ display: "grid", gap: 9 }}>
                  {alerts.slice(0, 3).map((a, i) => <AlertRow key={i} type={a.type} level={a.level} title={a.title} desc={a.desc} time={a.time} channels={a.ch} />)}
                </div>
              </div>
            </>
          )}

          {/* ── GEOMAPA ── */}
          {tab === "geomap" && (
            <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
              <div>
                <ParcelScan farm={farm} es={es} layer={layer} onZone={setZone} selected={zone} />
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {[["ndvi", es ? "Vigor NDVI" : "NDVI vigor"], ["fire", es ? "Riesgo incendio" : "Fire risk"], ["soil", es ? "Humedad suelo" : "Soil moisture"]].map(([k, l]) => (
                    <button key={k} onClick={() => setLayer(k)} className="mono chipbtn" style={{ borderColor: layer === k ? C.green : C.line, color: layer === k ? C.green : C.t3 }}>{l}</button>
                  ))}
                  <button className="mono chipbtn" style={{ marginLeft: "auto" }}><Ic d={ic.plus} s={11} /> {es ? "Editar polígono" : "Edit polygon"}</button>
                </div>
                <div className="card" style={{ marginTop: 12 }}>
                  <div className="mono lbl" style={{ marginBottom: 10 }}>{es ? "Contexto del terreno" : "Terrain context"}</div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
                    {[[es ? "Elevación" : "Elevation", farm.elev + " m", "SRTM"], [es ? "Pendiente media" : "Mean slope", "2.4°", "SRTM"], [es ? "Textura suelo" : "Soil texture", es ? "Franco arcilloso" : "Clay loam", "SoilGrids"], [es ? "pH del suelo" : "Soil pH", "6.4", "SoilGrids"]].map(([l, v, s]) => (
                      <div key={l}>
                        <div className="mono lbl">{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{v}</div>
                        <div className="mono" style={{ fontSize: 9.5, color: C.t4 }}>{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Zonas de manejo" : "Management zones"}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {zones.map((z) => (
                    <button key={z.id} onClick={() => setZone(z.id === zone ? null : z.id)} style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: C.t1, background: zone === z.id ? C.s3 : C.s2, border: `1px solid ${zone === z.id ? ndviColor(z.ndvi) : C.line}`, borderRadius: 9, padding: "11px 13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 3, background: ndviColor(z.ndvi) }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{es ? "Zona" : "Zone"} {z.id}</span>
                          <span style={{ fontSize: 11.5, color: C.t3 }}>{z.crop[es ? 0 : 1]}</span>
                        </span>
                        <span className="mono" style={{ fontSize: 11.5, color: ndviColor(z.ndvi), fontWeight: 600 }}>{z.ndvi.toFixed(2)}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 6 }}>
                        {z.ha} ha · {es ? "incendio" : "fire"} {z.fire}% · {es ? "humedad" : "moisture"} {z.soil}%
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 14, lineHeight: 1.6 }}>
                  {es ? "Un solo campo, seis zonas derivadas de la variabilidad NDVI de las últimas 4 pasadas de Sentinel-2." : "One farm, six zones derived from NDVI variability across the last 4 Sentinel-2 passes."}
                </div>
              </div>
            </div>
          )}

          {/* ── CLIMA ── */}
          {tab === "weather" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.sun} c={C.n2} label={es ? "Máxima hoy" : "High today"} value={weather[0].tmax} unit="°C" sub={es ? `mínima ${weather[0].tmin}°C` : `low ${weather[0].tmin}°C`} />
                <Metric icon={ic.water} c={C.blue} label={es ? "Lluvia 48 h" : "Rain 48 h"} value={weather[0].p + weather[1].p} unit="mm" />
                <Metric icon={ic.wind} c={C.blue} label={es ? "Viento" : "Wind"} value={weather[0].w} unit="km/h" sub={es ? `umbral ${thWind} km/h` : `threshold ${thWind} km/h`} />
                <Metric icon={ic.drought} c={C.t2} label={es ? "Humedad rel." : "Humidity"} value={weather[0].h} unit="%" />
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span>{es ? "Pronóstico 10 días · Open-Meteo" : "10-day forecast · Open-Meteo"}</span>
                  <span style={{ color: weatherLive ? C.green : C.t4 }}>
                    {weatherLive ? (es ? "● datos en vivo" : "● live data") : (es ? "demo (sin conexión)" : "demo (offline)")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 150 }}>
                  {weather.map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: 10, color: C.t2, marginBottom: 5 }}>{d.tmax}°</div>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 96, gap: 2 }}>
                        <div style={{ height: `${(d.p / maxP) * 46}%`, background: C.blue, borderRadius: "3px 3px 0 0", opacity: 0.85 }} title={`${d.p} mm`} />
                        <div style={{ height: `${(d.tmax / maxT) * 52}%`, background: riskColor(d.tmax * 2.2), borderRadius: "3px 3px 0 0" }} />
                      </div>
                      <div className="mono" style={{ fontSize: 9.5, color: C.t4, marginTop: 6 }}>{es ? d.d : d.de}</div>
                      <div className="mono" style={{ fontSize: 9, color: C.blue }}>{d.p}mm</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                  <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n2, borderRadius: 2, display: "inline-block" }} /> {es ? "temp. máxima" : "high temp"}</span>
                  <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.blue, borderRadius: 2, display: "inline-block" }} /> {es ? "precipitación" : "rainfall"}</span>
                </div>
              </div>
            </>
          )}

          {/* ── SEQUÍAS ── */}
          {tab === "drought" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.drought} c={riskColor(farm.risks.drought)} label={es ? "Déficit hídrico" : "Water deficit"} value={farm.risks.drought} unit="%" sub={es ? `umbral ${thDrought}%` : `threshold ${thDrought}%`} />
                <Metric icon={ic.clock} c={C.n3} label={es ? "Sin lluvia efectiva" : "No effective rain"} value="24" unit={es ? "días" : "days"} />
                <Metric icon={ic.leaf} c={C.n2} label={es ? "Caída de NDVI" : "NDVI drop"} value="-0.14" sub={es ? "últimas 2 pasadas" : "last 2 passes"} />
                <Metric icon={ic.water} c={C.blue} label={es ? "Índice SPI-3" : "SPI-3 index"} value="-1.6" sub={es ? "sequía moderada" : "moderate drought"} />
              </div>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 14 }}>{es ? "Estrés hídrico por zona" : "Water stress by zone"}</div>
                  {zones.map((z) => (
                    <Bar key={z.id} label={`${es ? "Zona" : "Zone"} ${z.id} · ${z.crop[es ? 0 : 1]}`} v={100 - z.soil} c={riskColor(100 - z.soil)} threshold={thDrought} />
                  ))}
                  <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 8, lineHeight: 1.6 }}>
                    {es ? "Humedad de suelo estimada con SoilGrids + balance hídrico ERA5. La línea marca tu umbral de alerta." : "Soil moisture estimated with SoilGrids + ERA5 water balance. The line marks your alert threshold."}
                  </div>
                </div>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 14 }}>{es ? "NDVI de las últimas 8 pasadas" : "NDVI over the last 8 passes"}</div>
                  <svg viewBox="0 0 300 130" style={{ width: "100%" }} role="img">
                    {[0, 1, 2, 3].map((i) => <line key={i} x1="0" y1={12 + i * 34} x2="300" y2={12 + i * 34} stroke={C.line} strokeWidth="1" />)}
                    {[[C.n5, [0.79, 0.78, 0.8, 0.77, 0.75, 0.76, 0.74, 0.73]], [C.n3, [0.62, 0.6, 0.58, 0.55, 0.52, 0.5, 0.47, 0.44]], [C.n1, [0.4, 0.38, 0.35, 0.31, 0.28, 0.25, 0.22, 0.19]]].map(([col, series], si) => (
                      <polyline key={si} fill="none" stroke={col} strokeWidth="2" points={series.map((v, i) => `${i * 42 + 6},${120 - v * 130}`).join(" ")} />
                    ))}
                  </svg>
                  <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                    <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n5, borderRadius: 2, display: "inline-block" }} /> {es ? "zonas A-B estables" : "zones A-B stable"}</span>
                    <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n3, borderRadius: 2, display: "inline-block" }} /> {es ? "zonas C-D en caída" : "zones C-D falling"}</span>
                    <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n1, borderRadius: 2, display: "inline-block" }} /> {es ? "zona F crítica" : "zone F critical"}</span>
                  </div>
                </div>
              </div>
              <div className="card" style={{ marginTop: 14, borderColor: `${C.n2}33` }}>
                <div className="mono lbl" style={{ marginBottom: 10 }}>{es ? "Qué hacer con esto" : "What to do about it"}</div>
                <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, margin: 0 }}>
                  {es ? "Las zonas C y D concentran el 42% de la superficie y llevan tres pasadas consecutivas de NDVI descendente sin lluvia efectiva. Si el pronóstico de 10 días se cumple, el déficit cruza tu umbral del 40% en aproximadamente 6 días. Priorizar riego en D antes que en C: D tiene menor retención por textura de suelo."
                    : "Zones C and D hold 42% of the area and have logged three consecutive NDVI declines with no effective rain. If the 10-day forecast holds, the deficit crosses your 40% threshold in roughly 6 days. Prioritize irrigation in D over C: D retains less water due to soil texture."}
                </p>
              </div>
            </>
          )}

          {/* ── CULTIVOS ── */}
          {tab === "crops" && (
            <>
              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 6 }}>{es ? "Variedades recomendadas para esta ubicación" : "Recommended varieties for this location"}</div>
                <p style={{ fontSize: 12.5, color: C.t3, margin: "0 0 16px", lineHeight: 1.55 }}>
                  {es ? `Cruzando clima de 40 años, suelo SoilGrids y elevación ${farm.elev} m. El precio proviene del mercado de referencia de tu país.` : `Cross-referencing 40 years of climate, SoilGrids soil data and ${farm.elev} m elevation. Price comes from your country's reference market.`}
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead><tr><th style={{ minWidth: 200 }}>{es ? "Variedad" : "Variety"}</th><th>{es ? "Aptitud" : "Fit"}</th><th>{es ? "Precio" : "Price"}</th><th>{es ? "Mercado" : "Market"}</th></tr></thead>
                    <tbody>
                      {farm.crops.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.c[es ? "es" : "en"]}</div>
                            <div className="mono" style={{ fontSize: 10.5, color: C.t3, fontStyle: "italic", marginTop: 3 }}>{c.n}</div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center" }}>
                              <div style={{ width: 48, height: 4, background: `${C.green}22`, borderRadius: 2 }}><div style={{ width: `${c.fit}%`, height: "100%", background: riskColor(100 - c.fit), borderRadius: 2 }} /></div>
                              <span className="mono" style={{ fontSize: 11.5, fontWeight: 600 }}>{c.fit}%</span>
                            </div>
                          </td>
                          <td className="mono" style={{ color: C.green, fontWeight: 600 }}>{c.price}</td>
                          <td className="mono" style={{ fontSize: 10.5, color: C.t3 }}>{c.src}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Ventana de siembra sugerida" : "Suggested planting window"}</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => {
                    const ok = i >= 8 || i <= 1;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ height: 26, borderRadius: 5, background: ok ? `${C.green}33` : C.s2, border: `1px solid ${ok ? C.green + "55" : C.line}` }} />
                        <div className="mono" style={{ fontSize: 9.5, color: ok ? C.green : C.t4, marginTop: 5 }}>{m}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── PLAGAS ── */}
          {tab === "pests" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.bug} c={riskColor(farm.risks.pest)} label={es ? "Riesgo de brote" : "Outbreak risk"} value={farm.risks.pest} unit="%" />
                <Metric icon={ic.sun} c={C.n3} label={es ? "Grados-día acum." : "Growing degree days"} value="842" sub={es ? "desde siembra" : "since planting"} />
                <Metric icon={ic.drought} c={C.t2} label={es ? "Humedad favorable" : "Favorable humidity"} value={weather[0].h > 70 ? (es ? "Sí" : "Yes") : "No"} sub={`${weather[0].h}%`} />
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 14 }}>{es ? "Plagas con ventana climática abierta" : "Pests with an open climate window"}</div>
                <div style={{ display: "grid", gap: 9 }}>
                  {[
                    { n: "Spodoptera frugiperda", c: { es: "Gusano cogollero", en: "Fall armyworm" }, r: farm.risks.pest, w: { es: "Temperaturas de 24-30 °C sostenidas 5 días", en: "24-30 °C sustained for 5 days" } },
                    { n: "Helicoverpa armigera", c: { es: "Oruga bolillera", en: "Cotton bollworm" }, r: Math.round(farm.risks.pest * 0.7), w: { es: "Humedad sobre 60% en floración", en: "Humidity above 60% at flowering" } },
                    { n: "Puccinia triticina", c: { es: "Roya de la hoja", en: "Leaf rust" }, r: Math.round(farm.risks.pest * 0.5), w: { es: "Rocío nocturno + 15-22 °C", en: "Night dew + 15-22 °C" } },
                  ].map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 13px", background: C.s2, borderRadius: 9, border: `1px solid ${C.line}` }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: `${C.violet}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic d={ic.bug} s={15} c={C.violet} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.c[es ? "es" : "en"]}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: C.t3, fontStyle: "italic" }}>{p.n}</div>
                        <div style={{ fontSize: 11.5, color: C.t2, marginTop: 5 }}>{p.w[es ? "es" : "en"]}</div>
                      </div>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: riskColor(p.r) }}>{p.r}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── ALERTAS ── */}
          {tab === "alerts" && (
            <>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div className="mono lbl">{es ? "Historial de alertas" : "Alert history"}</div>
                  <button className="mono chipbtn" onClick={() => setTab("settings")}><Ic d={ic.gear} s={11} /> {es ? "Ajustar umbrales" : "Adjust thresholds"}</button>
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {alerts.map((a, i) => <AlertRow key={i} type={a.type} level={a.level} title={a.title} desc={a.desc} time={a.time} channels={a.ch} />)}
                </div>
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Cómo se disparan" : "How they trigger"}</div>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
                  {[[es ? "Urgente" : "Urgent", C.n1, es ? "WhatsApp + SMS + correo al instante, más PDF automático." : "WhatsApp + SMS + email immediately, plus automatic PDF."],
                    [es ? "Alta" : "High", C.n2, es ? "WhatsApp y correo al instante, sin SMS." : "WhatsApp and email immediately, no SMS."],
                    [es ? "Media" : "Medium", C.n3, es ? "Se agrupa en el resumen de las próximas 12 h." : "Batched into the next 12 h digest."]].map(([l, c, d]) => (
                    <div key={l}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: c }}>{l}</div>
                      <div style={{ fontSize: 11.5, color: C.t2, marginTop: 5, lineHeight: 1.55 }}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── REPORTES ── */}
          {tab === "reports" && (
            <>
              <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 650 }}>{es ? "Generar reporte con evidencia satelital" : "Generate a report with satellite evidence"}</div>
                  <div style={{ fontSize: 12.3, color: C.t2, marginTop: 5, lineHeight: 1.55, maxWidth: 520 }}>
                    {es ? "Incluye coordenadas GPS del polígono, hora exacta de la pasada satelital, imagen NDVI de la zona afectada y la serie meteorológica. Formato aceptado por aseguradoras." : "Includes the polygon's GPS coordinates, exact satellite pass time, NDVI image of the affected zone and the weather series. Format accepted by insurers."}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button className="btn" onClick={generateReport} disabled={genBusy} style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", opacity: genBusy ? 0.6 : 1 }}><Ic d={ic.file} s={15} c="#04140B" /> {genBusy ? (es ? "Generando…" : "Generating…") : es ? "Generar ahora" : "Generate now"}</button>
                  {genErr && <div style={{ fontSize: 11, color: C.n1, marginTop: 6 }}>{genErr}</div>}
                </div>
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Reportes generados" : "Generated reports"}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { t: es ? "Incendio — zona F" : "Wildfire — zone F", d: "2026-07-18 04:12", s: es ? "Automático · alerta urgente" : "Automatic · urgent alert", c: C.n1 },
                    { t: es ? "Sequía — zonas C y D" : "Drought — zones C and D", d: "2026-07-17 09:00", s: es ? "Automático · alerta alta" : "Automatic · high alert", c: C.n2 },
                    { t: es ? "Resumen mensual del campo" : "Monthly farm summary", d: "2026-07-01 08:00", s: es ? "Programado" : "Scheduled", c: C.green },
                    { t: es ? "Inundación — zona B" : "Flood — zone B", d: "2026-06-11 21:40", s: es ? "Manual · enviado a aseguradora" : "Manual · sent to insurer", c: C.blue },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 13px", background: C.s2, borderRadius: 9, border: `1px solid ${C.line}` }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: `${r.c}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic d={ic.file} s={15} c={r.c} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{r.t}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 3 }}>{r.d} · {r.s}</div>
                      </div>
                      <button className="mono chipbtn"><Ic d={ic.down} s={11} /> PDF</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── CONFIGURACIÓN ── */}
          {tab === "settings" && (
            <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <div className="mono lbl">
                {me ? (es ? "Tus preferencias se guardan en tu cuenta" : "Your preferences are saved to your account")
                    : (es ? "Inicia sesión para guardar tu configuración" : "Log in to save your settings")}
              </div>
              {me && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {settingsMsg && <span className="mono lbl" style={{ color: C.green }}>{settingsMsg}</span>}
                  <button className="btn sm" onClick={saveSettings}>{es ? "Guardar configuración" : "Save settings"}</button>
                </div>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {me && stats && (
                <div className="card" style={{ gridColumn: "1 / -1" }}>
                  <div className="mono lbl" style={{ marginBottom: 14 }}>{es ? "Tu cuenta" : "Your account"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{stats.farms}</div>
                      <div className="mono lbl">{es ? "Campos" : "Fields"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{stats.hectares}</div>
                      <div className="mono lbl">{es ? "Hectáreas totales" : "Total hectares"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{stats.located}</div>
                      <div className="mono lbl">{es ? "Con ubicación" : "With location"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{stats.memberSince ? new Date(stats.memberSince).toLocaleDateString(es ? "es" : "en") : "—"}</div>
                      <div className="mono lbl">{es ? "Miembro desde" : "Member since"}</div>
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 12 }}>
                    {es ? "Datos reales de tu cuenta." : "Real data from your account."}
                  </div>
                </div>
              )}
              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 14 }}>{es ? "Perfil" : "Profile"}</div>
                <label className="mono lbl">{es ? "Nombre" : "Name"}</label>
                <input
                  value={me ? profName : "María Fernández"}
                  onChange={(e) => setProfName(e.target.value)}
                  readOnly={!me}
                  placeholder={es ? "Tu nombre" : "Your name"}
                  style={{ margin: "6px 0 8px" }}
                />
                {me && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px", flexWrap: "wrap" }}>
                    <button className="btn sm" onClick={submitProfile} disabled={profBusy}>
                      {profBusy ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar perfil" : "Save profile")}
                    </button>
                    {profMsg && <span className="mono lbl" style={{ color: /actualiz|updated/i.test(profMsg) ? C.green : C.n1 }}>{profMsg}</span>}
                  </div>
                )}
                <label className="mono lbl">{es ? "Correo" : "Email"}</label>
                <input value={me ? (me.user?.email || "") : "maria@campo.ar"} readOnly style={{ margin: "6px 0 12px", opacity: 0.75 }} />
                <label className="mono lbl">{es ? "Teléfono (WhatsApp y SMS)" : "Phone (WhatsApp and SMS)"}</label>
                <input defaultValue="+54 358 412 7788" style={{ margin: "6px 0 12px" }} />
                <label className="mono lbl">{es ? "Idioma de las alertas" : "Alert language"}</label>
                <select className="mono sel" defaultValue="es" style={{ width: "100%", margin: "6px 0 0" }}>
                  <option value="es">Español</option><option value="en">English</option><option value="pt">Português</option><option value="hi">हिन्दी</option>
                </select>
              </div>

              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 4 }}>{es ? "Canales de notificación" : "Notification channels"}</div>
                <Toggle on={wa} set={setWa} label="WhatsApp" sub="+54 358 412 7788" />
                <Toggle on={sms} set={setSms} label="SMS" sub={es ? "funciona sin datos móviles" : "works without mobile data"} />
                <Toggle on={mail} set={setMail} label={es ? "Correo" : "Email"} sub="maria@campo.ar" />
                <Toggle on={push} set={setPush} label={es ? "Notificación web" : "Web push"} />
                <div className="mono lbl" style={{ margin: "18px 0 4px" }}>{es ? "Frecuencia" : "Frequency"}</div>
                <Toggle on={daily} set={setDaily} label={es ? "Resumen diario" : "Daily digest"} sub={es ? "todos los días a las 06:00" : "every day at 06:00"} />
                <Toggle on={weekly} set={setWeekly} label={es ? "Reporte semanal" : "Weekly report"} sub={es ? "lunes a las 08:00" : "Mondays at 08:00"} />
              </div>

              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 4 }}>{es ? "Umbrales de alerta" : "Alert thresholds"}</div>
                <Slider label={es ? "Incendio: avisar si el riesgo supera" : "Wildfire: alert above"} v={thFire} set={setThFire} min={20} max={95} unit="%" c={C.n1} />
                <Slider label={es ? "Inundación: precipitación en 48 h" : "Flood: rainfall in 48 h"} v={thFlood} set={setThFlood} min={10} max={200} unit=" mm" c={C.blue} />
                <Slider label={es ? "Sequía: déficit hídrico" : "Drought: water deficit"} v={thDrought} set={setThDrought} min={10} max={90} unit="%" c={C.n2} />
                <Slider label={es ? "Viento: ráfagas máximas" : "Wind: peak gusts"} v={thWind} set={setThWind} min={20} max={120} unit=" km/h" c={C.blue} />
                <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 12, lineHeight: 1.6 }}>
                  {es ? "Las emergencias urgentes se envían siempre, aunque bajes el umbral." : "Urgent emergencies always go out, even if you lower the threshold."}
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 4 }}>{es ? "Reportes automáticos" : "Automatic reports"}</div>
                  <Toggle on={autoPdf} set={setAutoPdf} label={es ? "Generar PDF en cada alerta urgente" : "Generate PDF on every urgent alert"} />
                  <Toggle on={insCopy} set={setInsCopy} label={es ? "Enviar copia a la aseguradora" : "Send a copy to my insurer"} sub={insCopy ? "claims@aseguradora.com" : es ? "sin destinatario configurado" : "no recipient set"} />
                </div>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="mono lbl" style={{ marginBottom: 12 }}>{es ? "Suscripción" : "Subscription"}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: C.green }}>${cost}<span style={{ fontSize: 12, color: C.t3, fontWeight: 400 }}>{es ? "/mes" : "/mo"}</span></span>
                    <span className="mono" style={{ fontSize: 10.5, color: C.t3 }}>$9 + $0.15 × {farm.ha} ha</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 6 }}>{es ? "Próximo cobro: 1 de agosto de 2026" : "Next charge: August 1, 2026"}</div>
                  <button className="btn ghost" style={{ width: "100%", marginTop: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Ic d={ic.dollar} s={14} c={C.t1} /> {es ? "Gestionar pago en Stripe" : "Manage billing in Stripe"}
                  </button>
                </div>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="mono lbl" style={{ marginBottom: 10 }}>{es ? "Privacidad y datos" : "Privacy and data"}</div>
                  <p style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, margin: "0 0 12px" }}>
                    {es ? "Las coordenadas de tu campo están cifradas con AES-256 y no se comparten con terceros." : "Your field coordinates are AES-256 encrypted and never shared with third parties."}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="mono chipbtn" onClick={doExport} disabled={!me}>{es ? "Exportar mis datos" : "Export my data"}</button>
                    <button className="mono chipbtn" onClick={doDeleteAccount} disabled={!me} style={{ color: C.n1, borderColor: `${C.n1}44` }}>{es ? "Eliminar cuenta" : "Delete account"}</button>
                  </div>
                  {privMsg && <div className="mono lbl" style={{ marginTop: 10, color: C.n1 }}>{privMsg}</div>}
                  {!me && <div className="mono lbl" style={{ marginTop: 10, color: C.t4 }}>{es ? "Inicia sesión para exportar tus datos reales." : "Log in to export your real data."}</div>}
                </div>
                {me && (
                  <div className="card" style={{ marginTop: 14 }}>
                    <div className="mono lbl" style={{ marginBottom: 10 }}>{es ? "Cambiar contraseña" : "Change password"}</div>
                    <label className="mono lbl">{es ? "Contraseña actual" : "Current password"}</label>
                    <input type="password" autoComplete="current-password" value={pwCur} onChange={(e) => setPwCur(e.target.value)} style={{ margin: "6px 0 12px" }} />
                    <label className="mono lbl">{es ? "Nueva contraseña" : "New password"}</label>
                    <input type="password" autoComplete="new-password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder={es ? "mínimo 6 caracteres" : "at least 6 characters"} style={{ margin: "6px 0 12px" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn sm" onClick={submitPassword} disabled={pwBusy}>
                        {pwBusy ? (es ? "Guardando…" : "Saving…") : (es ? "Actualizar contraseña" : "Update password")}
                      </button>
                      {pwMsg && <span className="mono lbl" style={{ color: /actualiz|updated/i.test(pwMsg) ? C.green : C.n1 }}>{pwMsg}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

/* ══════════════════ ADMIN — LEADS ══════════════════ */
const AdminLeads = ({ es, onBack }) => {
  const [token, setToken] = useState(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [kind, setKind] = useState("");

  const load = async (tk, k) => {
    setLoading(true); setErr("");
    try { setLeads(await fetchLeads(tk, k)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { const tk = await adminLogin(pw); setToken(tk); await load(tk, kind); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };
  const changeKind = (k) => { setKind(k); if (token) load(token, k); };
  const exportCsv = () => {
    const head = ["email", "kind", "name", "country", "hectares", "lat", "lng", "created_at"];
    const rows = [head, ...leads.map((l) => [l.email, l.kind, l.name || "", l.country || "", l.hectares ?? "", l.lat ?? "", l.lng ?? "", l.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "vigia-leads.csv"; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const kinds = [["", es ? "Todos" : "All"], ["waitlist", es ? "Lista de espera" : "Waitlist"], ["newsletter", es ? "Boletín" : "Newsletter"]];

  return (
    <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 18 }}>← {es ? "Volver" : "Back"}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" /><circle cx="12" cy="10.5" r="2.6" fill={C.green} /></svg>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{BRAND}</span>
        <span className="mono pill">{es ? "Administrador" : "Admin"}</span>
      </div>

      {!token ? (
        <form onSubmit={login} className="card" style={{ maxWidth: 360, padding: 20 }}>
          <div className="mono lbl" style={{ marginBottom: 10 }}>{es ? "Acceso de administrador" : "Admin access"}</div>
          <label className="mono lbl">{es ? "Contraseña" : "Password"}</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={{ margin: "7px 0 4px" }} autoFocus />
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, opacity: busy ? 0.6 : 1 }}>
            {busy ? (es ? "Entrando…" : "Signing in…") : es ? "Entrar" : "Log in"}
          </button>
          {err && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 10 }}>{err}</div>}
        </form>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {kinds.map(([k, l]) => (
              <button key={k} onClick={() => changeKind(k)} className="mono chipbtn" style={{ borderColor: kind === k ? C.green : C.line, color: kind === k ? C.green : C.t3 }}>{l}</button>
            ))}
            <span className="mono lbl" style={{ marginLeft: "auto" }}>{leads.length} {es ? "registros" : "records"}</span>
            <button className="btn ghost sm" onClick={exportCsv} disabled={!leads.length}><Ic d={ic.down} s={12} /> CSV</button>
            <button className="btn ghost sm" onClick={() => { setToken(null); setLeads([]); setPw(""); }}>{es ? "Salir" : "Log out"}</button>
          </div>
          <div className="card" style={{ overflowX: "auto" }}>
            {loading ? (
              <div className="mono lbl" style={{ padding: 12 }}>{es ? "Cargando…" : "Loading…"}</div>
            ) : leads.length ? (
              <table>
                <thead><tr>
                  <th>Email</th><th>{es ? "Tipo" : "Kind"}</th><th>{es ? "Nombre" : "Name"}</th>
                  <th>{es ? "País" : "Country"}</th><th>ha</th><th>{es ? "Fecha" : "Date"}</th>
                </tr></thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td style={{ color: C.t1 }}>{l.email}</td>
                      <td><span className="mono" style={{ color: l.kind === "waitlist" ? C.green : C.blue }}>{l.kind}</span></td>
                      <td style={{ color: C.t2 }}>{l.name || "—"}</td>
                      <td style={{ color: C.t2 }}>{l.country || "—"}</td>
                      <td className="mono" style={{ color: C.t2 }}>{l.hectares ?? "—"}</td>
                      <td className="mono" style={{ color: C.t3, fontSize: 10.5 }}>{String(l.created_at).slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mono lbl" style={{ padding: 12 }}>{es ? "Sin registros" : "No records"}</div>
            )}
          </div>
          {err && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 10 }}>{err}</div>}
        </>
      )}
    </div>
  );
};

/* ══════════════════ ROOT ══════════════════ */
export default function VigiaApp() {
  const [view, setView] = useState("landing");
  const [lang, setLang] = useState("es");
  const [live, setLive] = useState(false);
  const es = lang === "es";

  // Refleja el idioma en <html lang> para lectores de pantalla.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div style={{ background: C.bg, color: C.t1, minHeight: "100vh", fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}
        .wrap{max-width:1080px;margin:0 auto;padding:0 22px}
        .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}
        .lbl{font-size:10.5px;text-transform:uppercase;color:${C.t2};display:inline-flex;align-items:center;gap:5px}
        .eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:${C.t3};display:flex;align-items:center;gap:6px}
        h1,h2,h3{margin:0}
        .h1{font-size:clamp(30px,4.6vw,50px);line-height:1.04;letter-spacing:-.035em;font-weight:700}
        .h2{font-size:clamp(21px,2.6vw,29px);line-height:1.12;letter-spacing:-.025em;font-weight:650}
        .lead{font-size:15.5px;line-height:1.62;color:${C.t2}}
        .sec{padding:60px 0;border-top:1px solid ${C.line}}
        .btn{background:${C.green};color:#04140B;border:none;padding:12px 22px;border-radius:9px;font-weight:650;font-size:13.5px;cursor:pointer;transition:filter .15s;font-family:inherit}
        .btn:hover{filter:brightness(1.08)}
        .btn.ghost{background:transparent;color:${C.t1};border:1px solid ${C.line2}}
        .btn.ghost:hover{background:rgba(61,220,132,.07);filter:none}
        .btn.sm{padding:7px 14px;font-size:12px;font-weight:550}
        .chipbtn{background:transparent;border:1px solid ${C.line};border-radius:7px;padding:6px 11px;font-size:10.5px;cursor:pointer;color:${C.t2};display:inline-flex;align-items:center;gap:5px;transition:border-color .15s}
        .chipbtn:hover{border-color:${C.line2}}
        .pill{font-size:9.5px;color:${C.n3};border:1px solid ${C.n3}44;border-radius:20px;padding:3px 8px;text-transform:uppercase;letter-spacing:.1em}
        input,select,textarea{font-family:inherit;background:${C.s1};border:1px solid ${C.line};border-radius:9px;padding:11px 13px;color:${C.t1};font-size:13px;outline:none;width:100%}
        input:focus,select:focus{border-color:${C.line2};box-shadow:0 0 0 3px rgba(61,220,132,.10)}
        .sel{width:auto;padding:7px 10px;font-size:11px;cursor:pointer}
        :focus-visible{outline:2px solid ${C.green};outline-offset:2px}
        .card{background:${C.s1};border:1px solid ${C.line};border-radius:13px;padding:18px}
        .grid{display:grid;gap:12px}
        .hero{display:grid;grid-template-columns:1.02fr 1fr;gap:44px;align-items:center;padding:56px 0 26px}
        .scanwrap{background:${C.s1};border:1px solid ${C.line2};border-radius:14px;padding:12px}
        .scanhead{display:flex;justify-content:space-between;align-items:center;padding:2px 4px 10px;gap:8px;flex-wrap:wrap}
        .scansvg{width:100%;height:auto;display:block;background:${C.bg};border-radius:9px}
        .scanfoot{display:flex;align-items:center;gap:9px;padding:10px 4px 2px;flex-wrap:wrap}
        .ramp{display:flex;height:6px;width:104px;border-radius:3px;overflow:hidden}
        .ramp span{flex:1}
        .dot{width:6px;height:6px;border-radius:50%;background:${C.green};display:inline-block;animation:blink 2.4s infinite}
        .readout{margin-top:8px;background:${C.s2};border:1px solid ${C.line};border-radius:9px;padding:11px 13px;min-height:56px}
        .ro-t{font-size:13px;font-weight:600}
        .ro-s{font-size:11.5px;color:${C.t2};margin-top:3px;font-family:ui-monospace,monospace}
        .sweep{animation:sweep 5.5s linear infinite}
        .pulse{animation:pulse 2.2s ease-out infinite}
        @keyframes sweep{0%{transform:translateX(0)}100%{transform:translateX(690px)}}
        @keyframes pulse{0%{r:6;opacity:.5}100%{r:26;opacity:0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        @media(prefers-reduced-motion:reduce){.sweep,.pulse,.dot{animation:none}}
        table{width:100%;border-collapse:collapse;font-size:12.5px}
        th,td{text-align:left;padding:11px 10px;border-bottom:1px solid ${C.line}}
        th{color:${C.t3};font-weight:500;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;font-family:ui-monospace,monospace}
        td:not(:first-child),th:not(:first-child){text-align:center}
        input[type=range]{padding:0;background:transparent;border:none;accent-color:${C.green}}
        input[type=range]:focus{box-shadow:none}
        .side{width:214px;flex-shrink:0;border-right:1px solid ${C.line};padding:20px 10px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;background:${C.bg}}
        .navbtn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 11px;border:none;border-radius:0 8px 8px 0;font-size:12.8px;font-family:inherit;cursor:pointer;text-align:left;margin-bottom:2px;transition:background .15s}
        .navbtn:hover{background:${C.s2}}
        .burger{display:none}
        @media(max-width:880px){
          .hero{grid-template-columns:1fr;gap:30px;padding-top:32px}
          .grid{grid-template-columns:1fr !important}
          .side{position:fixed;left:-230px;z-index:20;transition:left .2s;box-shadow:0 0 40px rgba(0,0,0,.6)}
          .side.open{left:0}
          .burger{display:inline-block}
        }
      `}</style>

      {view === "landing" && <Landing es={es} lang={lang} setLang={setLang} live={live} setLive={setLive} onEnter={() => setView("login")} onAdmin={() => setView("admin")} />}
      {view === "login" && <Login es={es} onDone={() => setView("app")} onBack={() => setView("landing")} />}
      {view === "app" && <Dashboard es={es} lang={lang} setLang={setLang} onLogout={() => setView("landing")} />}
      {view === "admin" && <AdminLeads es={es} onBack={() => setView("landing")} />}
    </div>
  );
}
