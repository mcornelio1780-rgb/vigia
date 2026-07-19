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
const ParcelScan = ({ farm, es, lang = es ? "es" : "en", layer = "ndvi", onZone, selected, compact }) => {
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
        <span className="mono lbl"><span className="dot" /> {pick(lang, "Sentinel-2 · pasada 10:42", "Sentinel-2 · pass 10:42", "Sentinel-2 · passagem 10:42")}</span>
      </div>
      <svg viewBox="0 0 520 360" className="scansvg" role="img" aria-label={pick(lang, "Parcela dividida en zonas", "Field split into zones", "Parcela dividida em zonas")}>
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
          {layer === "ndvi" ? pick(lang, "seco → sano", "dry → healthy", "seco → saudável") : layer === "fire" ? pick(lang, "bajo → crítico", "low → critical", "baixo → crítico") : pick(lang, "seco → húmedo", "dry → wet", "seco → úmido")}
        </span>
        <span className="mono lbl">{Number(farm.ha).toLocaleString(pick(lang, "es", "en", "pt"))} ha · 6 {pick(lang, "zonas", "zones", "zonas")}</span>
      </div>
      {!compact && (
        <div className="readout">
          {act ? (
            <>
              <div className="ro-t" style={{ color: col(act) }}>{pick(lang, "Zona", "Zone", "Zona")} {act.id} · {act.crop[lang === "es" ? 0 : 1]}</div>
              <div className="ro-s">{act.ha} ha · NDVI {act.ndvi.toFixed(2)} · {pick(lang, "riesgo incendio", "fire risk", "risco incêndio")} {act.fire}% · {pick(lang, "humedad suelo", "soil moisture", "umidade do solo")} {act.soil}%</div>
            </>
          ) : (
            <>
              <div className="ro-t">{pick(lang, "Toca una zona para ver su detalle", "Tap a zone for detail", "Toque em uma zona para ver o detalhe")}</div>
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
    { i: ic.fire, c: C.n1, t: t("Incendios", "Wildfires", "Incêndios"), d: t("Focos activos de NASA FIRMS, refrescados cada 6 h", "Active fire spots from NASA FIRMS, refreshed every 6 h", "Focos ativos da NASA FIRMS, atualizados a cada 6 h") },
    { i: ic.drought, c: C.n2, t: t("Sequías", "Droughts", "Secas"), d: t("Déficit hídrico acumulado y NDVI en caída, zona por zona", "Accumulated water deficit and falling NDVI, zone by zone", "Déficit hídrico acumulado e NDVI em queda, zona por zona") },
    { i: ic.water, c: C.blue, t: t("Inundaciones", "Floods", "Enchentes"), d: t("Precipitación prevista cruzada con topografía SRTM", "Forecast rainfall crossed with SRTM topography", "Precipitação prevista cruzada com topografia SRTM") },
    { i: ic.wind, c: C.blue, t: t("Viento y granizo", "Wind and hail", "Vento e granizo"), d: t("Ráfagas por encima del umbral que tú configuras", "Gusts above the threshold you set", "Rajadas acima do limite que você configura") },
    { i: ic.bug, c: C.violet, t: t("Plagas", "Pests", "Pragas"), d: t("Ventanas climáticas que favorecen un brote", "Climate windows that favor an outbreak", "Janelas climáticas que favorecem um surto") },
    { i: ic.frost, c: C.t2, t: t("Heladas", "Frost", "Geadas"), d: t("Mínimas a nivel de suelo con 72 h de anticipación", "Ground-level minimums, 72 h ahead", "Mínimas ao nível do solo com 72 h de antecedência") },
  ];
  const steps = [
    { n: "01", t: t("Dibujas tu campo una vez", "Draw your farm once", "Você desenha seu campo uma vez"), d: t("Un polígono sobre el mapa o pegas las coordenadas. El sistema lo divide en zonas de manejo según lo que ve el satélite.", "One polygon on the map, or paste coordinates. The system splits it into management zones based on what the satellite sees.", "Um polígono no mapa ou você cola as coordenadas. O sistema o divide em zonas de manejo conforme o que o satélite vê.") },
    { n: "02", t: t("Cada 6 horas bajamos datos frescos", "Every 6 hours we pull fresh data", "A cada 6 horas baixamos dados novos"), d: t("NASA FIRMS, Sentinel-2, ERA5, SoilGrids y Open-Meteo. Recalculamos el riesgo de cada zona, no del campo entero.", "NASA FIRMS, Sentinel-2, ERA5, SoilGrids and Open-Meteo. We recompute risk per zone, not for the whole farm.", "NASA FIRMS, Sentinel-2, ERA5, SoilGrids e Open-Meteo. Recalculamos o risco de cada zona, não do campo inteiro.") },
    { n: "03", t: t("Te avisamos antes, estés donde estés", "You get the warning first, wherever you are", "Avisamos antes, onde quer que você esteja"), d: t("Si un riesgo cruza tu umbral sale un WhatsApp, un SMS y un correo al instante, con un PDF que sirve para el seguro.", "If a risk crosses your threshold, a WhatsApp, SMS and email go out at once, with a PDF your insurer can use.", "Se um risco cruza seu limite, sai um WhatsApp, um SMS e um e-mail na hora, com um PDF que serve para o seguro.") },
  ];
  const compare = [
    [t("Precio de entrada", "Entry price", "Preço de entrada"), "$9 + $0.15/ha", t("~$25.000/mes", "~$25,000/mo", "~$25.000/mês"), t("Por ha/año", "Per ha/year", "Por ha/ano")],
    [t("Incendios en tiempo casi real", "Near real-time wildfires", "Incêndios quase em tempo real"), "on", "on", "on"],
    [t("Sequía por zona, no por campo", "Drought per zone, not per farm", "Seca por zona, não por campo"), "on", "off", "off"],
    [t("Variedad recomendada con nombre científico", "Recommended variety, scientific name", "Variedade recomendada com nome científico"), "on", "off", "half"],
    [t("Precio de mercado del cultivo", "Crop market price", "Preço de mercado da cultura"), "on", "off", "off"],
    [t("Alertas por WhatsApp y SMS", "WhatsApp and SMS alerts", "Alertas por WhatsApp e SMS"), "on", "off", "on"],
    [t("PDF con evidencia para el seguro", "PDF evidence for insurance", "PDF com evidência para o seguro"), "on", "off", "off"],
    [t("Idiomas", "Languages", "Idiomas"), "ES · EN · PT · HI", "EN", "EN · ES"],
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
            {!live && <span className="mono pill">{t("Beta global", "Global beta", "Beta global")}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn ghost sm mono" onClick={() => setLive(!live)} style={{ fontSize: 10, color: C.t3 }}>
              {live ? t("modo: activo", "mode: live", "modo: ativo") : t("modo: pre-lanzamiento", "mode: pre-launch", "modo: pré-lançamento")}
            </button>
            <button className="btn ghost sm" onClick={() => setLang(nextLang(lang))} aria-label={pick(lang, "Cambiar idioma", "Change language", "Mudar idioma")}>{langLabel(lang)}</button>
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
                  {t("Analizar mi campo gratis", "Analyze my farm free", "Analisar meu campo grátis")} <Ic d={ic.arrow} s={15} c="#04140B" />
                </button>
                <button className="btn ghost">{t("Ver precios", "See pricing", "Ver preços")}</button>
              </div>
            ) : (
              <div style={{ marginTop: 26, maxWidth: 460 }}>
                {wlSent ? (
                  <div className="card" style={{ borderColor: `${C.green}44`, display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <Ic d={ic.chk} s={17} c={C.green} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Estás en la lista", "You're on the list", "Você está na lista")}</div>
                      <div style={{ fontSize: 12.5, color: C.t2, marginTop: 3, lineHeight: 1.55 }}>
                        {t("Te escribimos con tu acceso y el precio base congelado por un año. Si tienes campos en más de un país, respóndenos y los cargamos juntos.", "We'll write with your access and the base price locked for a year. If you farm in more than one country, reply and we'll load them together.", "Escrevemos com o seu acesso e o preço base congelado por um ano. Se você tem campos em mais de um país, responda e os carregamos juntos.")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={wl} onChange={(e) => setWl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitWaitlist()} placeholder={t("tu@correo.com", "you@email.com", "seu@email.com")} aria-label="Email" />
                      <button className="btn" onClick={submitWaitlist} disabled={wlBusy} style={{ whiteSpace: "nowrap", opacity: wlBusy ? 0.6 : 1 }}>{wlBusy ? t("Enviando…", "Sending…", "Enviando…") : t("Pedir acceso", "Request access", "Pedir acesso")}</button>
                    </div>
                    {wlErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 8 }}>{wlErr}</div>}
                    <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 10, lineHeight: 1.7 }}>
                      {t("El satélite ya cubre el planeta entero: si tu campo tiene coordenadas, lo monitoreamos.", "The satellites already cover the whole planet: if your farm has coordinates, we monitor it.", "O satélite já cobre o planeta inteiro: se o seu campo tem coordenadas, nós o monitoramos.")}
                      <br />{stats
                        ? t(
                            `${stats.total} en lista · ${stats.countries} ${stats.countries === 1 ? "país" : "países"} · 6 continentes`,
                            `${stats.total} on the list · ${stats.countries} ${stats.countries === 1 ? "country" : "countries"} · 6 continents`,
                            `${stats.total} na lista · ${stats.countries} ${stats.countries === 1 ? "país" : "países"} · 6 continentes`)
                        : t("Súmate a la lista global de campos monitoreados.", "Join the global list of monitored farms.", "Entre para a lista global de campos monitorados.")}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 12, letterSpacing: ".02em" }}>
                      {t("Con datos de la ESA · Sentinel-2, la NASA · FIRMS y Open-Meteo", "Powered by ESA · Sentinel-2, NASA · FIRMS and Open-Meteo", "Com dados da ESA · Sentinel-2, NASA · FIRMS e Open-Meteo")}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <ParcelScan farm={farm} es={es} lang={lang} />
        </div>

        {/* Selector de campo demo — cobertura global explícita */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", paddingBottom: 8 }}>
          <span className="mono lbl" style={{ marginRight: 4 }}><Ic d={ic.globe} s={12} c={C.t3} /> {t("Ver un campo real en:", "See a real farm in:", "Ver um campo real em:")}</span>
          {FARM_KEYS.map((k) => (
            <button key={k} onClick={() => setDemo(k)} className="mono chipbtn" style={{ borderColor: demo === k ? C.green : C.line, color: demo === k ? C.green : C.t2 }}>
              {FARMS[k].cc} · {FARMS[k].country}
            </button>
          ))}
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <div className="wrap"><section className="sec" id="como-funciona">
        <div className="eyebrow">{t("Cómo funciona", "How it works", "Como funciona")}</div>
        <h2 className="h2" style={{ marginTop: 12, maxWidth: 640 }}>{t("De un punto en el mapa a una alerta que salva tu cosecha", "From a point on the map to an alert that saves your harvest", "De um ponto no mapa a um alerta que salva sua colheita")}</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", marginTop: 26, gap: 18 }}>
          {[
            { n: "01", i: ic.pin, ti: t("Marca tu campo", "Mark your field", "Marque seu campo"), d: t("Ingresa las coordenadas de tu parcela — una o varias. Sin hardware ni sensores: basta un punto en el mapa.", "Enter your field's coordinates — one or many. No hardware or sensors: a point on the map is enough.", "Insira as coordenadas do seu campo — um ou vários. Sem hardware nem sensores: basta um ponto no mapa.") },
            { n: "02", i: ic.map, ti: t("El satélite lo analiza", "The satellite analyzes it", "O satélite o analisa"), d: t("Cada pasada de Sentinel-2 mide el vigor (NDVI), la humedad y el estrés de tu campo, zona por zona.", "Each Sentinel-2 pass measures vigor (NDVI), moisture and stress across your field, zone by zone.", "Cada passagem do Sentinel-2 mede o vigor (NDVI), a umidade e o estresse do seu campo, zona por zona.") },
            { n: "03", i: ic.gear, ti: t("Defines tus umbrales", "Set your thresholds", "Defina seus limites"), d: t("Eliges cuándo quieres que te avise: incendio, sequía, inundación, plaga, helada o viento — a tu medida.", "Choose when to be alerted: wildfire, drought, flood, pest, frost or wind — on your terms.", "Escolha quando quer ser avisado: incêndio, seca, enchente, praga, geada ou vento — do seu jeito.") },
            { n: "04", i: ic.bell, ti: t("Recibes la alerta y actúas", "Get the alert and act", "Receba o alerta e aja"), d: t("Cuando un riesgo cruza tu umbral, te llega por WhatsApp, SMS o correo con el PDF de evidencia y las coordenadas.", "When a risk crosses your threshold, it reaches you by WhatsApp, SMS or email with the evidence PDF and coordinates.", "Quando um risco cruza seu limite, chega por WhatsApp, SMS ou e-mail com o PDF de evidência e as coordenadas.") },
          ].map((s) => (
            <div key={s.n} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: `${C.green}1a`, display: "grid", placeItems: "center" }}><Ic d={s.i} s={16} c={C.green} /></span>
                <span className="mono" style={{ fontSize: 11, color: C.green, letterSpacing: ".14em" }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 650, margin: "13px 0 7px", letterSpacing: "-.015em" }}>{s.ti}</h3>
              <p style={{ fontSize: 12.8, color: C.t2, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section></div>

      {/* RIESGOS */}
      <div className="wrap"><section className="sec" id="riesgos">
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

      {/* PARA QUIÉN ES */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{t("Para quién es", "Who it's for", "Para quem é")}</div>
        <h2 className="h2" style={{ marginTop: 12, maxWidth: 640 }}>{t("Del productor individual a la cartera de miles de hectáreas", "From the individual grower to a portfolio of thousands of hectares", "Do produtor individual à carteira de milhares de hectares")}</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 26, gap: 18 }}>
          {[
            { i: ic.leaf, ti: t("Productores", "Growers", "Produtores"), d: t("Protege tu cosecha zona por zona: sabes qué lote está en riesgo antes de que se vea a simple vista, y recibes el aviso donde ya miras — WhatsApp.", "Protect your harvest zone by zone: know which block is at risk before it's visible, and get the alert where you already look — WhatsApp.", "Proteja sua colheita zona a zona: saiba qual lote está em risco antes de ser visível e receba o aviso onde você já olha — WhatsApp.") },
            { i: ic.grid, ti: t("Cooperativas y asociaciones", "Co-ops and associations", "Cooperativas e associações"), d: t("Monitorea muchos campos desde un solo panel y prioriza dónde actuar primero cuando el clima aprieta a toda la región.", "Monitor many fields from a single dashboard and prioritize where to act first when the weather hits the whole region.", "Monitore muitos campos em um único painel e priorize onde agir primeiro quando o clima aperta a região toda.") },
            { i: ic.file, ti: t("Aseguradoras y bancos agrícolas", "Insurers and ag lenders", "Seguradoras e bancos agrícolas"), d: t("Evidencia satelital con PDF, coordenadas y hora de pasada para peritaje de siniestros y decisiones de crédito, sin visitas a campo.", "Satellite evidence with PDF, coordinates and pass time for claims assessment and credit decisions — without field visits.", "Evidência de satélite com PDF, coordenadas e hora da passagem para perícia de sinistros e decisões de crédito, sem visitas a campo.") },
          ].map((s, i) => (
            <div key={i} className="card">
              <span style={{ width: 34, height: 34, borderRadius: 9, background: `${C.green}1a`, display: "grid", placeItems: "center" }}><Ic d={s.i} s={17} c={C.green} /></span>
              <h3 style={{ fontSize: 15.5, fontWeight: 650, margin: "14px 0 8px", letterSpacing: "-.015em" }}>{s.ti}</h3>
              <p style={{ fontSize: 12.8, color: C.t2, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section></div>

      {/* CICLO */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{t("El ciclo, cada 6 horas", "The cycle, every 6 hours", "O ciclo, a cada 6 horas")}</div>
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
            <div className="mono" style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".1em" }}>{t("WhatsApp · hoy 04:12", "WhatsApp · today 04:12", "WhatsApp · hoje 04:12")}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: "8px 0 0" }}>
              {t(
                `${BRAND}: riesgo de incendio 74% en la zona F de tu campo (16 ha, barbecho). Foco de calor a 2,3 km al noreste, viento 38 km/h hacia tu lote. Adjunto PDF con coordenadas y hora satelital.`,
                `${BRAND}: 74% wildfire risk in zone F of your farm (16 ha, fallow). Heat spot 2.3 km northeast, wind 38 km/h toward your block. PDF attached with coordinates and satellite timestamp.`,
                `${BRAND}: risco de incêndio 74% na zona F do seu campo (16 ha, pousio). Foco de calor a 2,3 km a nordeste, vento 38 km/h em direção ao seu lote. Anexo PDF com coordenadas e hora do satélite.`)}
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
              <span className="mono lbl"><Ic d={ic.file} s={12} c={C.t3} /> {t("reporte-incendio.pdf", "wildfire-report.pdf", "relatorio-incendio.pdf")}</span>
              <span className="mono lbl"><Ic d={ic.clock} s={12} c={C.t3} /> {t("enviado en 40 s", "sent in 40 s", "enviado em 40 s")}</span>
            </div>
          </div>
        </div>
      </section></div>

      {/* PRECIOS */}
      <div className="wrap"><section className="sec" id="precio">
        <div className="eyebrow">{t("Precio", "Pricing", "Preço")}</div>
        <h2 className="h2" style={{ marginTop: 12 }}>{t("$9 al mes, más $0.15 por hectárea", "$9 a month, plus $0.15 per hectare", "$9 por mês, mais $0.15 por hectare")}</h2>
        <p className="lead" style={{ marginTop: 10, maxWidth: 570 }}>
          {t("El mismo precio en Iowa, en Punjab o en Mato Grosso. Sin contrato anual, sin mínimo de hectáreas, sin llamada de ventas.", "Same price in Iowa, Punjab or Mato Grosso. No annual contract, no hectare minimum, no sales call.", "O mesmo preço em Iowa, no Punjab ou no Mato Grosso. Sem contrato anual, sem mínimo de hectares, sem ligação de vendas.")}
        </p>
        <div className="grid" style={{ gridTemplateColumns: "1.05fr .95fr", marginTop: 28, gap: 18 }}>
          <div className="card" style={{ borderColor: C.line2 }}>
            <div className="mono lbl" style={{ marginBottom: 16 }}>{t("Calcula tu mensualidad", "Work out your monthly bill", "Calcule sua mensalidade")}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-.03em", color: C.green }}>${price}</span>
              <span style={{ fontSize: 13, color: C.t3 }}>{t("/ mes", "/ month", "/ mês")}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>$9 + $0.15 × {ha} ha</div>
            <input type="range" min="10" max="2500" step="10" value={ha} onChange={(e) => setHa(Number(e.target.value))} aria-label="ha" style={{ marginTop: 20 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span className="mono lbl">10 ha</span><span className="mono lbl" style={{ color: C.t1 }}>{ha} ha</span><span className="mono lbl">2500 ha</span>
            </div>
            <button className="btn" style={{ width: "100%", marginTop: 20 }} onClick={onEnter}>{live ? t(`Empezar con ${ha} ha`, `Start with ${ha} ha`, `Começar com ${ha} ha`) : t("Reservar este precio", "Lock this price", "Reservar este preço")}</button>
            <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 10, textAlign: "center" }}>{t("Pago con Stripe · cancelas cuando quieras", "Stripe checkout · cancel anytime", "Pagamento com Stripe · cancele quando quiser")}</div>
          </div>
          <div className="card">
            <div className="mono lbl" style={{ marginBottom: 14 }}>{t("Incluido en cualquier tamaño y país", "Included at any size, any country", "Incluído em qualquer tamanho e país")}</div>
            {[t("Análisis cada 6 horas de todas tus zonas", "Every zone re-analyzed every 6 hours", "Análise a cada 6 horas de todas as suas zonas"),
              t("Alertas por WhatsApp, SMS y correo", "WhatsApp, SMS and email alerts", "Alertas por WhatsApp, SMS e e-mail"),
              t("Umbrales configurables por tipo de riesgo", "Configurable thresholds per risk type", "Limites configuráveis por tipo de risco"),
              t("PDF con evidencia satelital para el seguro", "PDF with satellite evidence for your insurer", "PDF com evidência de satélite para o seguro"),
              t("Variedad recomendada y precio de mercado local", "Recommended variety and local market price", "Variedade recomendada e preço de mercado local"),
              t("Español, inglés, portugués e hindi", "Spanish, English, Portuguese and Hindi", "Espanhol, inglês, português e hindi")].map((f, i) => (
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
              <div style={{ fontSize: 23, fontWeight: 700, marginTop: 6, letterSpacing: "-.02em" }}>${(9 + t * 0.15).toFixed(2)}<span style={{ fontSize: 11.5, fontWeight: 400, color: C.t3 }}>{pick(lang, "/mes", "/mo", "/mês")}</span></div>
            </button>
          ))}
        </div>
      </section></div>

      {/* COMPARATIVA */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{t("Frente a lo que ya existe", "Against what already exists", "Frente ao que já existe")}</div>
        <div style={{ marginTop: 22, overflowX: "auto" }}>
          <table>
            <thead><tr><th style={{ minWidth: 220 }}></th><th style={{ color: C.green }}>{BRAND}</th><th>{t("Plataformas enterprise", "Enterprise platforms", "Plataformas enterprise")}</th><th>{t("Suites agronómicas", "Agronomy suites", "Suítes agronômicas")}</th></tr></thead>
            <tbody>
              {compare.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: C.t2 }}>{row[0]}</td>
                  {row.slice(1).map((cell, j) => (
                    <td key={j} style={{ color: j === 0 ? C.t1 : C.t3, fontWeight: j === 0 ? 600 : 400 }}>
                      {cell === "on" ? <Ic d={ic.chk} s={15} c={j === 0 ? C.green : C.t3} /> : cell === "off" ? <span style={{ color: C.t4 }}>—</span> : cell === "half" ? <span style={{ color: C.n3 }}>{t("parcial", "partial", "parcial")}</span> : cell}
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
            <div className="eyebrow">{t("De dónde salen los datos", "Where the data comes from", "De onde vêm os dados")}</div>
            <p className="lead" style={{ marginTop: 12, fontSize: 13.5 }}>
              {t("Todo viene de constelaciones y modelos públicos que cubren el planeta completo. No vendemos imágenes: vendemos la lectura de tu campo, ya cruzada y traducida a una decisión.", "Everything comes from public constellations and models that cover the entire planet. We don't sell imagery: we sell the reading of your farm, cross-checked and turned into a decision.", "Tudo vem de constelações e modelos públicos que cobrem o planeta inteiro. Não vendemos imagens: vendemos a leitura do seu campo, já cruzada e traduzida em uma decisão.")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16 }}>
              {sources.map((s) => <span key={s} className="mono" style={{ fontSize: 10.5, color: C.t2, border: `1px solid ${C.line}`, borderRadius: 6, padding: "5px 9px" }}>{s}</span>)}
            </div>
          </div>
          <div>
            <div className="eyebrow">{t("Tus coordenadas son tuyas", "Your coordinates stay yours", "Suas coordenadas são suas")}</div>
            <p className="lead" style={{ marginTop: 12, fontSize: 13.5 }}>
              {t("La ubicación exacta viaja cifrada y se guarda cifrada. No la compartimos con nadie, ni con aseguradoras, salvo que tú envíes el reporte. Exportas o borras todo desde Configuración.", "Your exact location travels encrypted and is stored encrypted. We share it with no one, insurers included, unless you send the report yourself. Export or delete everything from Settings.", "A localização exata viaja criptografada e é armazenada criptografada. Não a compartilhamos com ninguém, nem com seguradoras, a menos que você envie o relatório. Exporte ou apague tudo em Configurações.")}
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              <span className="mono lbl"><Ic d={ic.lock} s={12} c={C.t3} /> AES-256</span>
              <span className="mono lbl"><Ic d={ic.lock} s={12} c={C.t3} /> TLS 1.3</span>
              <span className="mono lbl"><Ic d={ic.eye} s={12} c={C.t3} /> GDPR · LGPD · CCPA</span>
            </div>
          </div>
        </div>
      </section></div>

      {/* FAQ */}
      <div className="wrap"><section className="sec">
        <div className="eyebrow">{t("Preguntas frecuentes", "FAQ", "Perguntas frequentes")}</div>
        <h2 className="h2" style={{ marginTop: 12 }}>{t("Lo que suelen preguntar", "What people usually ask", "O que costumam perguntar")}</h2>
        <div style={{ marginTop: 24, maxWidth: 760, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { q: t("¿Necesito instalar hardware o sensores?", "Do I need to install hardware or sensors?", "Preciso instalar hardware ou sensores?"), a: t("No. Vigia es 100% satelital: con las coordenadas de tu campo basta. Nada que comprar, instalar ni mantener.", "No. Vigia is 100% satellite-based: your field's coordinates are enough. Nothing to buy, install or maintain.", "Não. A Vigia é 100% via satélite: as coordenadas do seu campo bastam. Nada para comprar, instalar ou manter.") },
            { q: t("¿En qué países funciona?", "Which countries does it work in?", "Em quais países funciona?"), a: t("En cualquiera. El satélite ya cubre el planeta entero: si tu campo tiene coordenadas, lo monitoreamos.", "Anywhere. The satellite already covers the whole planet: if your field has coordinates, we monitor it.", "Em qualquer um. O satélite já cobre o planeta inteiro: se o seu campo tem coordenadas, nós o monitoramos.") },
            { q: t("¿Qué datos usa Vigia?", "What data does Vigia use?", "Quais dados a Vigia usa?"), a: t("Sentinel-2 para el vigor (NDVI) zona por zona, NASA FIRMS para focos de calor y Open-Meteo para el pronóstico. Estamos integrando más fuentes (ERA5, SoilGrids).", "Sentinel-2 for vigor (NDVI) zone by zone, NASA FIRMS for heat spots and Open-Meteo for forecasts. We're integrating more sources (ERA5, SoilGrids).", "Sentinel-2 para o vigor (NDVI) zona a zona, NASA FIRMS para focos de calor e Open-Meteo para a previsão. Estamos integrando mais fontes (ERA5, SoilGrids).") },
            { q: t("¿Cuánto cuesta?", "How much does it cost?", "Quanto custa?"), a: t("Según las hectáreas de tu campo: una base mensual más una parte por hectárea. Usa la calculadora de arriba para ver tu precio exacto.", "Based on your field's hectares: a monthly base plus a per-hectare part. Use the calculator above to see your exact price.", "Conforme os hectares do seu campo: uma base mensal mais uma parte por hectare. Use a calculadora acima para ver seu preço exato.") },
            { q: t("¿Las alertas son en tiempo real?", "Are the alerts real-time?", "Os alertas são em tempo real?"), a: t("Combinamos pasadas satelitales frecuentes con clima diario. Las alertas urgentes (como un foco de incendio cercano) se envían siempre, apenas se detectan.", "We combine frequent satellite passes with daily weather. Urgent alerts (like a nearby wildfire spot) always go out the moment they're detected.", "Combinamos passagens de satélite frequentes com clima diário. Alertas urgentes (como um foco de incêndio próximo) sempre são enviados assim que detectados.") },
          ].map((f, i) => (
            <details key={i} className="card" style={{ padding: "14px 16px" }}>
              <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.t1 }}>{f.q}</summary>
              <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section></div>

      {/* NEWSLETTER */}
      <div className="wrap"><section className="sec">
        <div className="card" style={{ borderColor: C.line2, background: C.s2, padding: 26 }}>
          <div className="grid" style={{ gridTemplateColumns: "1.15fr 1fr", gap: 26, alignItems: "center" }}>
            <div>
              <div className="eyebrow"><Ic d={ic.mail} s={12} c={C.t3} /> {t("Boletín semanal", "Weekly briefing", "Boletim semanal")}</div>
              <h2 className="h2" style={{ marginTop: 12, fontSize: 22 }}>{t("El parte climático de tu región, cada lunes", "Your region's climate briefing, every Monday", "O boletim climático da sua região, toda segunda")}</h2>
              <p className="lead" style={{ marginTop: 9, fontSize: 13.3 }}>
                {t("Anomalías de El Niño y La Niña, ventanas de siembra, precios de commodities y qué está pasando con el clima en las zonas agrícolas del mundo. Sin costo y sin ser cliente.", "El Niño and La Niña anomalies, planting windows, commodity prices and what the weather is doing across the world's farming belts. Free, no account needed.", "Anomalias de El Niño e La Niña, janelas de plantio, preços de commodities e o que está acontecendo com o clima nas regiões agrícolas do mundo. Grátis e sem ser cliente.")}
              </p>
            </div>
            <div>
              {nlSent ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 16px", background: `${C.green}12`, border: `1px solid ${C.green}44`, borderRadius: 10 }}>
                  <Ic d={ic.chk} s={16} c={C.green} />
                  <span style={{ fontSize: 13 }}>{t("Suscrito. El primer parte llega el lunes.", "Subscribed. First briefing arrives Monday.", "Inscrito. O primeiro boletim chega na segunda.")}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={nl} onChange={(e) => setNl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitNewsletter()} placeholder={t("tu@correo.com", "you@email.com", "seu@email.com")} aria-label={t("Correo para el boletín", "Newsletter email", "E-mail para o boletim")} />
                    <button className="btn" onClick={submitNewsletter} style={{ whiteSpace: "nowrap" }}>{t("Suscribirme", "Subscribe", "Inscrever-me")}</button>
                  </div>
                  {nlErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 8 }}>{nlErr}</div>}
                  <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 9 }}>{t("Un correo por semana. Te das de baja en un clic.", "One email a week. Unsubscribe in one click.", "Um e-mail por semana. Cancele em um clique.")}</div>
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
            {live ? t("Analizar mi campo gratis", "Analyze my farm free", "Analisar meu campo grátis") : t("Pedir acceso a la beta", "Request beta access", "Pedir acesso à beta")} <Ic d={ic.arrow} s={15} c="#04140B" />
          </button>
          <button className="btn ghost">{t("Hablar con nosotros", "Talk to us", "Fale conosco")}</button>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 18 }}>{t("Disponible para campos en cualquier país · soporte en 4 idiomas", "Available for farms in any country · support in 4 languages", "Disponível para campos em qualquer país · suporte em 4 idiomas")}</div>
      </section></div>

      <div className="wrap">
        <footer style={{ borderTop: `1px solid ${C.line}`, marginTop: 20, paddingTop: 36, paddingBottom: 40 }}>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" /><circle cx="12" cy="10.5" r="2.6" fill={C.green} /></svg>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{BRAND}</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.t3, lineHeight: 1.6, margin: "12px 0 0" }}>{t("Inteligencia climática satelital para el campo. Te avisamos antes de que veas el problema, zona por zona, en cualquier país.", "Satellite climate intelligence for farms. We warn you before you see the problem, zone by zone, in any country.", "Inteligência climática por satélite para o campo. Avisamos antes de você ver o problema, zona a zona, em qualquer país.")}</p>
            </div>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{t("Producto", "Product", "Produto")}</div>
                <a href="#como-funciona" className="mono" style={{ display: "block", fontSize: 12, color: C.t2, textDecoration: "none", padding: "5px 0" }}>{t("Cómo funciona", "How it works", "Como funciona")}</a>
                <a href="#riesgos" className="mono" style={{ display: "block", fontSize: 12, color: C.t2, textDecoration: "none", padding: "5px 0" }}>{t("Riesgos", "Risks", "Riscos")}</a>
                <a href="#precio" className="mono" style={{ display: "block", fontSize: 12, color: C.t2, textDecoration: "none", padding: "5px 0" }}>{t("Precio", "Pricing", "Preço")}</a>
              </div>
              <div>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{t("Datos", "Data", "Dados")}</div>
                <span className="mono" style={{ display: "block", fontSize: 12, color: C.t3, padding: "5px 0" }}>Sentinel-2 · ESA</span>
                <span className="mono" style={{ display: "block", fontSize: 12, color: C.t3, padding: "5px 0" }}>NASA FIRMS</span>
                <span className="mono" style={{ display: "block", fontSize: 12, color: C.t3, padding: "5px 0" }}>Open-Meteo</span>
              </div>
              <div>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{t("Empresa", "Company", "Empresa")}</div>
                <button onClick={onEnter} className="mono" style={{ display: "block", fontSize: 12, color: C.t2, background: "none", border: "none", cursor: "pointer", padding: "5px 0", textAlign: "left" }}>{t("Contacto", "Contact", "Contato")}</button>
                <button onClick={onAdmin} aria-label={t("Panel de administrador", "Admin panel", "Painel de administrador")} className="mono" style={{ display: "block", fontSize: 12, color: C.t2, background: "none", border: "none", cursor: "pointer", padding: "5px 0", textAlign: "left" }}>{t("Administrador", "Admin", "Admin")}</button>
                <span className="mono" style={{ display: "block", fontSize: 12, color: C.t3, padding: "5px 0" }}>{t("Beta global", "Global beta", "Beta global")}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.line2}`, marginTop: 28, paddingTop: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 10.5, color: C.t4 }}>{BRAND} © 2026 · {DOMAIN} · {t("Beta global · pre-lanzamiento", "Global beta · pre-launch", "Beta global · pré-lançamento")}</span>
            <span className="mono" style={{ fontSize: 10.5, color: C.t4, maxWidth: 440 }}>{t("Los datos satelitales y agronómicos del panel de demostración son de ejemplo.", "Satellite and agronomic data in the demo dashboard are illustrative.", "Os dados de satélite e agronômicos do painel de demonstração são ilustrativos.")}</span>
          </div>
        </footer>
      </div>
    </>
  );
};

/* ══════════════════ LOGIN ══════════════════ */
const Login = ({ es, lang = es ? "es" : "en", onDone, onBack }) => {
  const t = (esS, enS, ptS) => pick(lang, esS, enS, ptS);
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
        <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 22 }}>← {t("Volver", "Back", "Voltar")}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" /><circle cx="12" cy="10.5" r="2.6" fill={C.green} /></svg>
          <span style={{ fontSize: 19, fontWeight: 700 }}>{BRAND}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {[["in", t("Entrar", "Log in", "Entrar")], ["up", t("Crear cuenta", "Sign up", "Criar conta")]].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setErr(""); }} className="mono chipbtn" style={{ borderColor: tab === k ? C.green : C.line, color: tab === k ? C.green : C.t3 }}>{l}</button>
          ))}
        </div>
        <form className="card" style={{ padding: 20 }} onSubmit={submit}>
          {tab === "up" && <><label className="mono lbl">{t("Nombre", "Name", "Nome")}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("María Fernández", "Jane Doe", "Maria Fernanda")} style={{ margin: "7px 0 14px" }} /></>}
          <label className="mono lbl">{t("Correo", "Email", "E-mail")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tu@correo.com", "you@email.com", "seu@email.com")} style={{ margin: "7px 0 14px" }} />
          <label className="mono lbl">{t("Contraseña", "Password", "Senha")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ margin: "7px 0 4px" }} />
          {tab === "up" && <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 10, lineHeight: 1.6 }}>{t("Mínimo 6 caracteres. Al crear la cuenta aceptas el tratamiento cifrado de las coordenadas de tu campo.", "At least 6 characters. By signing up you accept encrypted processing of your field coordinates.", "Mínimo 6 caracteres. Ao criar a conta você aceita o tratamento criptografado das coordenadas do seu campo.")}</div>}
          {err && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 12 }}>{err}</div>}
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 16, opacity: busy ? 0.6 : 1 }}>{busy ? t("Un momento…", "One moment…", "Um momento…") : tab === "in" ? t("Entrar", "Log in", "Entrar") : t("Crear cuenta", "Create account", "Criar conta")}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.line }} /><span className="mono" style={{ fontSize: 10, color: C.t4 }}>{t("o", "or", "ou")}</span><div style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          <button className="btn ghost" type="button" style={{ width: "100%" }} onClick={onDone}>{t("Continuar sin cuenta (demo)", "Continue without account (demo)", "Continuar sem conta (demo)")}</button>
        </form>
        <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 16, textAlign: "center" }}>{t("Tu cuenta guarda tus campos de verdad.", "Your account saves your fields for real.", "Sua conta guarda seus campos de verdade.")}</div>
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
      setSavedMsg(pick(lang, "Campo guardado", "Field saved", "Campo salvo"));
    } catch (e) { setSavedMsg(e.message); }
  };
  const removeFarm = async () => {
    setSavedMsg("");
    try {
      await deleteFarm(farm.id);
      setMe(await fetchMe());
      setFarmKey("cordoba");
      setZone(null);
      setSavedMsg(pick(lang, "Campo quitado", "Field removed", "Campo removido"));
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
    if (!rf.name.trim()) { setRfErr(pick(lang, "El nombre es obligatorio", "Name is required", "O nome é obrigatório")); return; }
    setRfBusy(true);
    setRfErr("");
    try {
      const payload = { name: rf.name.trim() };
      if (rf.ha !== "") payload.hectares = rf.ha;
      await updateFarm(savedFarm?.id || farm.id, payload);
      setMe(await fetchMe());
      setRenameOpen(false);
      setSavedMsg(pick(lang, "Campo actualizado", "Field updated", "Campo atualizado"));
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
      setSettingsMsg(pick(lang, "Configuración guardada", "Settings saved", "Configurações salvas"));
    } catch (e) { setSettingsMsg(e.message); }
  };

  /* cambio de contraseña real (conectado al backend) */
  const [pwCur, setPwCur] = useState(""), [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState(""), [pwBusy, setPwBusy] = useState(false);
  const submitPassword = async () => {
    if (pwBusy) return;
    setPwMsg("");
    if (String(pwNew).length < 6) {
      setPwMsg(pick(lang, "La nueva contraseña debe tener al menos 6 caracteres", "New password must be at least 6 characters", "A nova senha deve ter pelo menos 6 caracteres"));
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(pwCur, pwNew);
      setPwMsg(pick(lang, "Contraseña actualizada", "Password updated", "Senha atualizada"));
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
      setProfMsg(pick(lang, "Perfil actualizado", "Profile updated", "Perfil atualizado"));
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
        lang,
        generatedAt: new Date().toISOString(),
        farm: { label: farm.label, country: farm.country, coord: farm.coord, hectares: farm.ha, elev: farm.elev },
        risks: farm.risks,
        zones: zones.map((z) => ({ id: z.id, crop: z.crop[lang === "es" ? 0 : 1], ndvi: z.ndvi, ha: z.ha, fire: z.fire, soil: z.soil })),
      });
    } catch (e) {
      setGenErr(e.message);
    } finally {
      setGenBusy(false);
    }
  };

  const tabs = [
    { id: "overview", l: pick(lang, "Vista general", "Overview", "Visão geral"), i: ic.grid },
    { id: "geomap", l: pick(lang, "Geomapa", "Geomap", "Geomapa"), i: ic.map },
    { id: "weather", l: pick(lang, "Clima", "Weather", "Clima"), i: ic.sun },
    { id: "drought", l: pick(lang, "Sequías", "Droughts", "Secas"), i: ic.drought },
    { id: "crops", l: pick(lang, "Cultivos", "Crops", "Culturas"), i: ic.leaf },
    { id: "pests", l: pick(lang, "Plagas", "Pests", "Pragas"), i: ic.bug },
    { id: "alerts", l: pick(lang, "Alertas", "Alerts", "Alertas"), i: ic.bell },
    { id: "reports", l: pick(lang, "Reportes", "Reports", "Relatórios"), i: ic.file },
    { id: "settings", l: pick(lang, "Configuración", "Settings", "Configurações"), i: ic.gear },
  ];

  const alerts = [
    { type: "fire", level: pick(lang, "urgente", "urgent", "urgente"), title: pick(lang, "Riesgo de incendio 74% — zona F", "74% wildfire risk — zone F", "Risco de incêndio 74% — zona F"), desc: pick(lang, "Foco de calor VIIRS a 2,3 km al noreste. Viento 38 km/h en dirección al lote. Barbecho seco, NDVI 0.19.", "VIIRS heat spot 2.3 km northeast. Wind 38 km/h toward the block. Dry fallow, NDVI 0.19.", "Foco de calor VIIRS a 2,3 km a nordeste. Vento 38 km/h em direção ao lote. Pousio seco, NDVI 0.19."), time: "04:12", ch: pick(lang, "Enviado por WhatsApp · SMS · correo · PDF adjunto", "Sent via WhatsApp · SMS · email · PDF attached", "Enviado por WhatsApp · SMS · e-mail · PDF anexo") },
    { type: "drought", level: pick(lang, "alta", "high", "alta"), title: pick(lang, "Déficit hídrico 58% — zonas C y D", "58% water deficit — zones C and D", "Déficit hídrico 58% — zonas C e D"), desc: pick(lang, "Sin precipitación efectiva hace 24 días. NDVI cayó 0.14 puntos en dos pasadas satelitales.", "No effective rainfall for 24 days. NDVI dropped 0.14 points across two satellite passes.", "Sem precipitação efetiva há 24 dias. NDVI caiu 0,14 pontos em duas passagens de satélite."), time: pick(lang, "ayer", "yesterday", "ontem"), ch: pick(lang, "Enviado por WhatsApp · correo", "Sent via WhatsApp · email", "Enviado por WhatsApp · e-mail") },
    { type: "wind", level: pick(lang, "media", "medium", "média"), title: pick(lang, "Ráfagas de 46 km/h previstas", "46 km/h gusts forecast", "Rajadas de 46 km/h previstas"), desc: pick(lang, "Mañana entre 14:00 y 19:00. Por debajo de tu umbral de 50 km/h, registrado sin notificación push.", "Tomorrow between 14:00 and 19:00. Below your 50 km/h threshold, logged without push.", "Amanhã entre 14:00 e 19:00. Abaixo do seu limite de 50 km/h, registrado sem notificação push."), time: "2 d", ch: pick(lang, "Solo registrado en el panel", "Logged in dashboard only", "Apenas registrado no painel") },
    { type: "ok", level: null, title: pick(lang, "Zonas A, B y E dentro de parámetros", "Zones A, B and E within range", "Zonas A, B e E dentro dos parâmetros"), desc: pick(lang, "NDVI estable, humedad de suelo sobre el mínimo, sin focos activos en 40 km.", "Stable NDVI, soil moisture above minimum, no active fire spots within 40 km.", "NDVI estável, umidade do solo acima do mínimo, sem focos ativos em 40 km."), time: "6 h", ch: null },
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
          <div className="mono lbl" style={{ padding: "0 10px 8px" }}>{pick(lang, "Plan activo", "Active plan", "Plano ativo")}</div>
          <div style={{ padding: "0 10px 12px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.green }}>${cost}<span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>{pick(lang, "/mes", "/mo", "/mês")}</span></div>
            <div className="mono" style={{ fontSize: 10, color: C.t4 }}>{Number(farm.ha).toLocaleString(pick(lang, "es", "en", "pt"))} ha · {farm.country}</div>
          </div>
          <button className="navbtn" onClick={onLogout} style={{ color: C.t3 }}><Ic d={ic.out} s={15} c={C.t3} /> {pick(lang, "Cerrar sesión", "Log out", "Sair")}</button>
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
            <select value={farmKey} onChange={(e) => { setFarmKey(e.target.value); setZone(null); setSavedMsg(""); setRenameOpen(false); }} className="mono sel" aria-label={pick(lang, "Campo", "Farm", "Campo")}>
              {savedFarms.length > 0 && (
                <optgroup label={pick(lang, "Mis campos", "My fields", "Meus campos")}>
                  {[...savedFarms]
                    .sort((a, b) => a.name.localeCompare(b.name, pick(lang, "es", "en", "pt"), { sensitivity: "base" }))
                    .map((f) => <option key={f.id} value={`saved:${f.id}`}>{f.name}</option>)}
                </optgroup>
              )}
              <optgroup label={pick(lang, "Campos demo", "Demo fields", "Campos demo")}>
                {FARM_KEYS.map((k) => <option key={k} value={k}>{FARMS[k].label} — {FARMS[k].country}</option>)}
              </optgroup>
            </select>
            {me && savedFarms.length > 0 && (
              <span className="mono lbl" style={{ color: C.t3, whiteSpace: "nowrap" }}>
                {savedFarms.length} {pick(lang, savedFarms.length === 1 ? "campo" : "campos", savedFarms.length === 1 ? "field" : "fields", savedFarms.length === 1 ? "campo" : "campos")}
              </span>
            )}
            <button className="btn ghost sm" onClick={() => setLang(nextLang(lang))} aria-label={pick(lang, "Cambiar idioma", "Change language", "Mudar idioma")}>{langLabel(lang)}</button>
            {me && !farm.saved && (
              <button className="btn ghost sm" onClick={persistFarm} title={me.user?.email} aria-label={pick(lang, "Guardar campo", "Save field", "Salvar campo")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ic d={ic.pin} s={12} /> {savedMsg || pick(lang, "Guardar campo", "Save field", "Salvar campo")}
              </button>
            )}
            {me && farm.saved && (
              <button className="btn ghost sm" onClick={openRename} aria-label={pick(lang, "Editar campo", "Edit field", "Editar campo")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ic d={ic.gear} s={12} /> {pick(lang, "Editar campo", "Edit field", "Editar campo")}
              </button>
            )}
            {me && farm.saved && (
              <button className="btn ghost sm" onClick={removeFarm} aria-label={pick(lang, "Quitar campo", "Remove field", "Remover campo")} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.n1 }}>
                {savedMsg || pick(lang, "Quitar campo", "Remove field", "Remover campo")}
              </button>
            )}
            {me && (
              <button className="btn ghost sm" onClick={() => { setAddOpen((v) => !v); setNfErr(""); }} aria-label={pick(lang, "Nuevo campo", "New field", "Novo campo")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Ic d={ic.plus} s={12} /> {pick(lang, "Nuevo campo", "New field", "Novo campo")}
              </button>
            )}
            <span className="mono lbl" style={{ color: C.green }}><span className="dot" /> {pick(lang, "próximo análisis 4h 12m", "next analysis 4h 12m", "próxima análise 4h 12m")}</span>
          </div>
        </header>

        <div style={{ padding: 24, maxWidth: 1180 }}>
          {addOpen && me && (
            <form className="card" onSubmit={createNewFarm} style={{ marginBottom: 14 }}>
              <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Nuevo campo", "New field", "Novo campo")}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label style={{ flex: "2 1 200px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{pick(lang, "Nombre", "Name", "Nome")}</div>
                  <input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder={pick(lang, "Lote Norte", "North field", "Lote Norte")} required />
                </label>
                <label style={{ flex: "1 1 110px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{pick(lang, "Latitud", "Latitude", "Latitude")}</div>
                  <input value={nf.lat} onChange={(e) => setNf({ ...nf, lat: e.target.value })} placeholder="-33.13" inputMode="decimal" />
                </label>
                <label style={{ flex: "1 1 110px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{pick(lang, "Longitud", "Longitude", "Longitude")}</div>
                  <input value={nf.lng} onChange={(e) => setNf({ ...nf, lng: e.target.value })} placeholder="-64.35" inputMode="decimal" />
                </label>
                <label style={{ flex: "1 1 90px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>ha</div>
                  <input value={nf.ha} onChange={(e) => setNf({ ...nf, ha: e.target.value })} placeholder="480" inputMode="numeric" />
                </label>
                <button className="btn sm" type="submit" disabled={nfBusy} style={{ opacity: nfBusy ? 0.6 : 1 }}>{nfBusy ? pick(lang, "Creando…", "Creating…", "Criando…") : pick(lang, "Crear", "Create", "Criar")}</button>
                <button className="btn ghost sm" type="button" onClick={() => setAddOpen(false)}>{pick(lang, "Cancelar", "Cancel", "Cancelar")}</button>
              </div>
              {nfErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 10 }}>{nfErr}</div>}
            </form>
          )}
          {renameOpen && me && farm.saved && (
            <form className="card" onSubmit={submitRename} style={{ marginBottom: 14 }}>
              <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Editar campo", "Edit field", "Editar campo")}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label style={{ flex: "2 1 200px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>{pick(lang, "Nombre", "Name", "Nome")}</div>
                  <input value={rf.name} onChange={(e) => setRf({ ...rf, name: e.target.value })} placeholder={pick(lang, "Lote Norte", "North field", "Lote Norte")} required />
                </label>
                <label style={{ flex: "1 1 90px" }}>
                  <div className="mono lbl" style={{ marginBottom: 5 }}>ha</div>
                  <input value={rf.ha} onChange={(e) => setRf({ ...rf, ha: e.target.value })} placeholder="480" inputMode="numeric" />
                </label>
                <button className="btn sm" type="submit" disabled={rfBusy} style={{ opacity: rfBusy ? 0.6 : 1 }}>{rfBusy ? pick(lang, "Guardando…", "Saving…", "Salvando…") : pick(lang, "Guardar", "Save", "Salvar")}</button>
                <button className="btn ghost sm" type="button" onClick={() => setRenameOpen(false)}>{pick(lang, "Cancelar", "Cancel", "Cancelar")}</button>
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 10 }}>
                {pick(lang, "La ubicación del campo se conserva.", "The field location is preserved.", "A localização do campo é preservada.")}
              </div>
              {rfErr && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 8 }}>{rfErr}</div>}
            </form>
          )}
          {/* ── VISTA GENERAL ── */}
          {tab === "overview" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.fire} c={riskColor(farm.risks.fire)} label={pick(lang, "Riesgo mayor", "Top risk", "Risco maior")} value={worst} unit="%" sub={pick(lang, "incendio · zona F", "wildfire · zone F", "incêndio · zona F")} />
                <Metric icon={ic.leaf} c={ndviColor(Number(avgNdvi))} label="NDVI" value={avgNdvi} sub={pick(lang, "promedio ponderado", "weighted average", "média ponderada")} />
                <Metric icon={ic.map} label={pick(lang, "Superficie", "Area", "Superfície")} value={Number(farm.ha).toLocaleString(pick(lang, "es", "en", "pt"))} unit="ha" sub={pick(lang, "6 zonas de manejo", "6 management zones", "6 zonas de manejo")} />
                <Metric icon={ic.water} c={C.blue} label={pick(lang, "Lluvia 10 d", "Rain 10 d", "Chuva 10 d")} value={weather.reduce((a, d) => a + d.p, 0)} unit="mm" sub={pick(lang, "pronóstico Open-Meteo", "Open-Meteo forecast", "previsão Open-Meteo")} />
                <Metric icon={ic.bell} c={C.n2} label={pick(lang, "Alertas 7 d", "Alerts 7 d", "Alertas 7 d")} value="3" sub={pick(lang, "1 urgente · 1 alta", "1 urgent · 1 high", "1 urgente · 1 alta")} />
              </div>

              {fires && (fires.count > 0 ? (
                <div style={{ marginTop: 14 }}>
                  <AlertRow type="fire" level={pick(lang, "en vivo", "live", "ao vivo")}
                    title={pick(lang, `${fires.count} foco(s) de calor a menos de 50 km`, `${fires.count} heat spot(s) within 50 km`, `${fires.count} foco(s) de calor a menos de 50 km`)}
                    desc={pick(lang, `Datos NASA FIRMS (VIIRS). El más cercano a ${fires.fires?.[0]?.distanceKm ?? "—"} km del campo.`, `NASA FIRMS data (VIIRS). Nearest ${fires.fires?.[0]?.distanceKm ?? "—"} km from the field.`, `Dados NASA FIRMS (VIIRS). O mais próximo a ${fires.fires?.[0]?.distanceKm ?? "—"} km do campo.`)}
                    time="FIRMS" channels={null} />
                </div>
              ) : (
                <div className="mono lbl" style={{ marginTop: 14, color: C.green }}>
                  <span className="dot" /> {pick(lang, "Sin focos activos cerca · NASA FIRMS en vivo", "No active fire spots nearby · NASA FIRMS live", "Sem focos ativos por perto · NASA FIRMS ao vivo")}
                </div>
              ))}

              <div className="grid" style={{ gridTemplateColumns: "1.25fr 1fr", marginTop: 14, gap: 14 }}>
                <div>
                  <ParcelScan farm={farm} es={es} lang={lang} layer={layer} onZone={setZone} selected={zone} />
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {[["ndvi", pick(lang, "Vigor NDVI", "NDVI vigor", "Vigor NDVI")], ["fire", pick(lang, "Riesgo incendio", "Fire risk", "Risco incêndio")], ["soil", pick(lang, "Humedad suelo", "Soil moisture", "Umidade do solo")]].map(([k, l]) => (
                      <button key={k} onClick={() => setLayer(k)} className="mono chipbtn" style={{ borderColor: layer === k ? C.green : C.line, color: layer === k ? C.green : C.t3 }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 16 }}>{pick(lang, "Riesgo del campo · umbral marcado", "Farm risk · threshold marked", "Risco do campo · limite marcado")}</div>
                  <Bar label={pick(lang, "Incendio", "Wildfire", "Incêndio")} v={farm.risks.fire} c={riskColor(farm.risks.fire)} threshold={thFire} />
                  <Bar label={pick(lang, "Sequía", "Drought", "Seca")} v={farm.risks.drought} c={riskColor(farm.risks.drought)} threshold={thDrought} />
                  <Bar label={pick(lang, "Inundación", "Flood", "Inundação")} v={farm.risks.flood} c={riskColor(farm.risks.flood)} threshold={thFlood} />
                  <Bar label={pick(lang, "Plagas", "Pests", "Pragas")} v={farm.risks.pest} c={riskColor(farm.risks.pest)} />
                  <Bar label={pick(lang, "Viento", "Wind", "Vento")} v={farm.risks.wind} c={riskColor(farm.risks.wind)} threshold={thWind} />
                  <Bar label={pick(lang, "Helada", "Frost", "Geada")} v={farm.risks.frost} c={riskColor(farm.risks.frost)} />
                </div>
              </div>

              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Últimas alertas", "Latest alerts", "Últimos alertas")}</div>
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
                <ParcelScan farm={farm} es={es} lang={lang} layer={layer} onZone={setZone} selected={zone} />
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {[["ndvi", pick(lang, "Vigor NDVI", "NDVI vigor", "Vigor NDVI")], ["fire", pick(lang, "Riesgo incendio", "Fire risk", "Risco incêndio")], ["soil", pick(lang, "Humedad suelo", "Soil moisture", "Umidade do solo")]].map(([k, l]) => (
                    <button key={k} onClick={() => setLayer(k)} className="mono chipbtn" style={{ borderColor: layer === k ? C.green : C.line, color: layer === k ? C.green : C.t3 }}>{l}</button>
                  ))}
                  <button className="mono chipbtn" style={{ marginLeft: "auto" }}><Ic d={ic.plus} s={11} /> {pick(lang, "Editar polígono", "Edit polygon", "Editar polígono")}</button>
                </div>
                <div className="card" style={{ marginTop: 12 }}>
                  <div className="mono lbl" style={{ marginBottom: 10 }}>{pick(lang, "Contexto del terreno", "Terrain context", "Contexto do terreno")}</div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
                    {[[pick(lang, "Elevación", "Elevation", "Elevação"), farm.elev + " m", "SRTM"], [pick(lang, "Pendiente media", "Mean slope", "Declive médio"), "2.4°", "SRTM"], [pick(lang, "Textura suelo", "Soil texture", "Textura do solo"), pick(lang, "Franco arcilloso", "Clay loam", "Franco-argiloso"), "SoilGrids"], [pick(lang, "pH del suelo", "Soil pH", "pH do solo"), "6.4", "SoilGrids"]].map(([l, v, s]) => (
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
                <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Zonas de manejo", "Management zones", "Zonas de manejo")}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {zones.map((z) => (
                    <button key={z.id} onClick={() => setZone(z.id === zone ? null : z.id)} style={{ textAlign: "left", cursor: "pointer", font: "inherit", color: C.t1, background: zone === z.id ? C.s3 : C.s2, border: `1px solid ${zone === z.id ? ndviColor(z.ndvi) : C.line}`, borderRadius: 9, padding: "11px 13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 3, background: ndviColor(z.ndvi) }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{pick(lang, "Zona", "Zone", "Zona")} {z.id}</span>
                          <span style={{ fontSize: 11.5, color: C.t3 }}>{z.crop[lang === "es" ? 0 : 1]}</span>
                        </span>
                        <span className="mono" style={{ fontSize: 11.5, color: ndviColor(z.ndvi), fontWeight: 600 }}>{z.ndvi.toFixed(2)}</span>
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: C.t3, marginTop: 6 }}>
                        {z.ha} ha · {pick(lang, "incendio", "fire", "incêndio")} {z.fire}% · {pick(lang, "humedad", "moisture", "umidade")} {z.soil}%
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 14, lineHeight: 1.6 }}>
                  {pick(lang, "Un solo campo, seis zonas derivadas de la variabilidad NDVI de las últimas 4 pasadas de Sentinel-2.", "One farm, six zones derived from NDVI variability across the last 4 Sentinel-2 passes.", "Um único campo, seis zonas derivadas da variabilidade NDVI das últimas 4 passagens do Sentinel-2.")}
                </div>
              </div>
            </div>
          )}

          {/* ── CLIMA ── */}
          {tab === "weather" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.sun} c={C.n2} label={pick(lang, "Máxima hoy", "High today", "Máxima hoje")} value={weather[0].tmax} unit="°C" sub={pick(lang, `mínima ${weather[0].tmin}°C`, `low ${weather[0].tmin}°C`, `mínima ${weather[0].tmin}°C`)} />
                <Metric icon={ic.water} c={C.blue} label={pick(lang, "Lluvia 48 h", "Rain 48 h", "Chuva 48 h")} value={weather[0].p + weather[1].p} unit="mm" />
                <Metric icon={ic.wind} c={C.blue} label={pick(lang, "Viento", "Wind", "Vento")} value={weather[0].w} unit="km/h" sub={pick(lang, `umbral ${thWind} km/h`, `threshold ${thWind} km/h`, `limite ${thWind} km/h`)} />
                <Metric icon={ic.drought} c={C.t2} label={pick(lang, "Humedad rel.", "Humidity", "Umidade rel.")} value={weather[0].h} unit="%" />
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span>{pick(lang, "Pronóstico 10 días · Open-Meteo", "10-day forecast · Open-Meteo", "Previsão 10 dias · Open-Meteo")}</span>
                  <span style={{ color: weatherLive ? C.green : C.t4 }}>
                    {weatherLive ? pick(lang, "● datos en vivo", "● live data", "● dados ao vivo") : pick(lang, "demo (sin conexión)", "demo (offline)", "demo (sem conexão)")}
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
                      <div className="mono" style={{ fontSize: 9.5, color: C.t4, marginTop: 6 }}>{lang === "es" ? d.d : d.de}</div>
                      <div className="mono" style={{ fontSize: 9, color: C.blue }}>{d.p}mm</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                  <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n2, borderRadius: 2, display: "inline-block" }} /> {pick(lang, "temp. máxima", "high temp", "temp. máxima")}</span>
                  <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.blue, borderRadius: 2, display: "inline-block" }} /> {pick(lang, "precipitación", "rainfall", "precipitação")}</span>
                </div>
              </div>
            </>
          )}

          {/* ── SEQUÍAS ── */}
          {tab === "drought" && (
            <>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))" }}>
                <Metric icon={ic.drought} c={riskColor(farm.risks.drought)} label={pick(lang, "Déficit hídrico", "Water deficit", "Déficit hídrico")} value={farm.risks.drought} unit="%" sub={pick(lang, `umbral ${thDrought}%`, `threshold ${thDrought}%`, `limite ${thDrought}%`)} />
                <Metric icon={ic.clock} c={C.n3} label={pick(lang, "Sin lluvia efectiva", "No effective rain", "Sem chuva efetiva")} value="24" unit={pick(lang, "días", "days", "dias")} />
                <Metric icon={ic.leaf} c={C.n2} label={pick(lang, "Caída de NDVI", "NDVI drop", "Queda do NDVI")} value="-0.14" sub={pick(lang, "últimas 2 pasadas", "last 2 passes", "últimas 2 passagens")} />
                <Metric icon={ic.water} c={C.blue} label={pick(lang, "Índice SPI-3", "SPI-3 index", "Índice SPI-3")} value="-1.6" sub={pick(lang, "sequía moderada", "moderate drought", "seca moderada")} />
              </div>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 14 }}>{pick(lang, "Estrés hídrico por zona", "Water stress by zone", "Estresse hídrico por zona")}</div>
                  {zones.map((z) => (
                    <Bar key={z.id} label={`${pick(lang, "Zona", "Zone", "Zona")} ${z.id} · ${z.crop[lang === "es" ? 0 : 1]}`} v={100 - z.soil} c={riskColor(100 - z.soil)} threshold={thDrought} />
                  ))}
                  <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 8, lineHeight: 1.6 }}>
                    {pick(lang, "Humedad de suelo estimada con SoilGrids + balance hídrico ERA5. La línea marca tu umbral de alerta.", "Soil moisture estimated with SoilGrids + ERA5 water balance. The line marks your alert threshold.", "Umidade do solo estimada com SoilGrids + balanço hídrico ERA5. A linha marca o seu limite de alerta.")}
                  </div>
                </div>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 14 }}>{pick(lang, "NDVI de las últimas 8 pasadas", "NDVI over the last 8 passes", "NDVI das últimas 8 passagens")}</div>
                  <svg viewBox="0 0 300 130" style={{ width: "100%" }} role="img">
                    {[0, 1, 2, 3].map((i) => <line key={i} x1="0" y1={12 + i * 34} x2="300" y2={12 + i * 34} stroke={C.line} strokeWidth="1" />)}
                    {[[C.n5, [0.79, 0.78, 0.8, 0.77, 0.75, 0.76, 0.74, 0.73]], [C.n3, [0.62, 0.6, 0.58, 0.55, 0.52, 0.5, 0.47, 0.44]], [C.n1, [0.4, 0.38, 0.35, 0.31, 0.28, 0.25, 0.22, 0.19]]].map(([col, series], si) => (
                      <polyline key={si} fill="none" stroke={col} strokeWidth="2" points={series.map((v, i) => `${i * 42 + 6},${120 - v * 130}`).join(" ")} />
                    ))}
                  </svg>
                  <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                    <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n5, borderRadius: 2, display: "inline-block" }} /> {pick(lang, "zonas A-B estables", "zones A-B stable", "zonas A-B estáveis")}</span>
                    <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n3, borderRadius: 2, display: "inline-block" }} /> {pick(lang, "zonas C-D en caída", "zones C-D falling", "zonas C-D em queda")}</span>
                    <span className="mono lbl"><span style={{ width: 9, height: 9, background: C.n1, borderRadius: 2, display: "inline-block" }} /> {pick(lang, "zona F crítica", "zone F critical", "zona F crítica")}</span>
                  </div>
                </div>
              </div>
              <div className="card" style={{ marginTop: 14, borderColor: `${C.n2}33` }}>
                <div className="mono lbl" style={{ marginBottom: 10 }}>{pick(lang, "Qué hacer con esto", "What to do about it", "O que fazer com isso")}</div>
                <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, margin: 0 }}>
                  {pick(lang, "Las zonas C y D concentran el 42% de la superficie y llevan tres pasadas consecutivas de NDVI descendente sin lluvia efectiva. Si el pronóstico de 10 días se cumple, el déficit cruza tu umbral del 40% en aproximadamente 6 días. Priorizar riego en D antes que en C: D tiene menor retención por textura de suelo.",
                    "Zones C and D hold 42% of the area and have logged three consecutive NDVI declines with no effective rain. If the 10-day forecast holds, the deficit crosses your 40% threshold in roughly 6 days. Prioritize irrigation in D over C: D retains less water due to soil texture.",
                    "As zonas C e D concentram 42% da superfície e acumulam três passagens consecutivas de NDVI em queda sem chuva efetiva. Se a previsão de 10 dias se confirmar, o déficit cruza o seu limite de 40% em aproximadamente 6 dias. Priorizar irrigação em D antes de C: D tem menor retenção pela textura do solo.")}
                </p>
              </div>
            </>
          )}

          {/* ── CULTIVOS ── */}
          {tab === "crops" && (
            <>
              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 6 }}>{pick(lang, "Variedades recomendadas para esta ubicación", "Recommended varieties for this location", "Variedades recomendadas para este local")}</div>
                <p style={{ fontSize: 12.5, color: C.t3, margin: "0 0 16px", lineHeight: 1.55 }}>
                  {pick(lang, `Cruzando clima de 40 años, suelo SoilGrids y elevación ${farm.elev} m. El precio proviene del mercado de referencia de tu país.`, `Cross-referencing 40 years of climate, SoilGrids soil data and ${farm.elev} m elevation. Price comes from your country's reference market.`, `Cruzando clima de 40 anos, solo SoilGrids e elevação ${farm.elev} m. O preço vem do mercado de referência do seu país.`)}
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead><tr><th style={{ minWidth: 200 }}>{pick(lang, "Variedad", "Variety", "Variedade")}</th><th>{pick(lang, "Aptitud", "Fit", "Aptidão")}</th><th>{pick(lang, "Precio", "Price", "Preço")}</th><th>{pick(lang, "Mercado", "Market", "Mercado")}</th></tr></thead>
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
                <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Ventana de siembra sugerida", "Suggested planting window", "Janela de plantio sugerida")}</div>
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
                <Metric icon={ic.bug} c={riskColor(farm.risks.pest)} label={pick(lang, "Riesgo de brote", "Outbreak risk", "Risco de surto")} value={farm.risks.pest} unit="%" />
                <Metric icon={ic.sun} c={C.n3} label={pick(lang, "Grados-día acum.", "Growing degree days", "Graus-dia acum.")} value="842" sub={pick(lang, "desde siembra", "since planting", "desde o plantio")} />
                <Metric icon={ic.drought} c={C.t2} label={pick(lang, "Humedad favorable", "Favorable humidity", "Umidade favorável")} value={weather[0].h > 70 ? pick(lang, "Sí", "Yes", "Sim") : pick(lang, "No", "No", "Não")} sub={`${weather[0].h}%`} />
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 14 }}>{pick(lang, "Plagas con ventana climática abierta", "Pests with an open climate window", "Pragas com janela climática aberta")}</div>
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
                  <div className="mono lbl">{pick(lang, "Historial de alertas", "Alert history", "Histórico de alertas")}</div>
                  <button className="mono chipbtn" onClick={() => setTab("settings")}><Ic d={ic.gear} s={11} /> {pick(lang, "Ajustar umbrales", "Adjust thresholds", "Ajustar limites")}</button>
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {alerts.map((a, i) => <AlertRow key={i} type={a.type} level={a.level} title={a.title} desc={a.desc} time={a.time} channels={a.ch} />)}
                </div>
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Cómo se disparan", "How they trigger", "Como são disparados")}</div>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
                  {[[pick(lang, "Urgente", "Urgent", "Urgente"), C.n1, pick(lang, "WhatsApp + SMS + correo al instante, más PDF automático.", "WhatsApp + SMS + email immediately, plus automatic PDF.", "WhatsApp + SMS + e-mail na hora, mais PDF automático.")],
                    [pick(lang, "Alta", "High", "Alta"), C.n2, pick(lang, "WhatsApp y correo al instante, sin SMS.", "WhatsApp and email immediately, no SMS.", "WhatsApp e e-mail na hora, sem SMS.")],
                    [pick(lang, "Media", "Medium", "Média"), C.n3, pick(lang, "Se agrupa en el resumen de las próximas 12 h.", "Batched into the next 12 h digest.", "Agrupado no resumo das próximas 12 h.")]].map(([l, c, d]) => (
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
                  <div style={{ fontSize: 14, fontWeight: 650 }}>{pick(lang, "Generar reporte con evidencia satelital", "Generate a report with satellite evidence", "Gerar relatório com evidência de satélite")}</div>
                  <div style={{ fontSize: 12.3, color: C.t2, marginTop: 5, lineHeight: 1.55, maxWidth: 520 }}>
                    {pick(lang, "Incluye coordenadas GPS del polígono, hora exacta de la pasada satelital, imagen NDVI de la zona afectada y la serie meteorológica. Formato aceptado por aseguradoras.", "Includes the polygon's GPS coordinates, exact satellite pass time, NDVI image of the affected zone and the weather series. Format accepted by insurers.", "Inclui as coordenadas GPS do polígono, hora exata da passagem do satélite, imagem NDVI da zona afetada e a série meteorológica. Formato aceito por seguradoras.")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button className="btn" onClick={generateReport} disabled={genBusy} aria-label={pick(lang, "Generar reporte", "Generate report", "Gerar relatório")} style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", opacity: genBusy ? 0.6 : 1 }}><Ic d={ic.file} s={15} c="#04140B" /> {genBusy ? pick(lang, "Generando…", "Generating…", "Gerando…") : pick(lang, "Generar ahora", "Generate now", "Gerar agora")}</button>
                  {genErr && <div style={{ fontSize: 11, color: C.n1, marginTop: 6 }}>{genErr}</div>}
                </div>
              </div>
              <div className="card" style={{ marginTop: 14 }}>
                <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Reportes generados", "Generated reports", "Relatórios gerados")}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { t: pick(lang, "Incendio — zona F", "Wildfire — zone F", "Incêndio — zona F"), d: "2026-07-18 04:12", s: pick(lang, "Automático · alerta urgente", "Automatic · urgent alert", "Automático · alerta urgente"), c: C.n1 },
                    { t: pick(lang, "Sequía — zonas C y D", "Drought — zones C and D", "Seca — zonas C e D"), d: "2026-07-17 09:00", s: pick(lang, "Automático · alerta alta", "Automatic · high alert", "Automático · alerta alta"), c: C.n2 },
                    { t: pick(lang, "Resumen mensual del campo", "Monthly farm summary", "Resumo mensal do campo"), d: "2026-07-01 08:00", s: pick(lang, "Programado", "Scheduled", "Programado"), c: C.green },
                    { t: pick(lang, "Inundación — zona B", "Flood — zone B", "Inundação — zona B"), d: "2026-06-11 21:40", s: pick(lang, "Manual · enviado a aseguradora", "Manual · sent to insurer", "Manual · enviado à seguradora"), c: C.blue },
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
                {me ? pick(lang, "Tus preferencias se guardan en tu cuenta", "Your preferences are saved to your account", "As suas preferências são salvas na sua conta")
                    : pick(lang, "Inicia sesión para guardar tu configuración", "Log in to save your settings", "Faça login para salvar as suas configurações")}
              </div>
              {me && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {settingsMsg && <span className="mono lbl" style={{ color: C.green }}>{settingsMsg}</span>}
                  <button className="btn sm" onClick={saveSettings}>{pick(lang, "Guardar configuración", "Save settings", "Salvar configurações")}</button>
                </div>
              )}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {me && stats && (
                <div className="card" style={{ gridColumn: "1 / -1" }}>
                  <div className="mono lbl" style={{ marginBottom: 14 }}>{pick(lang, "Tu cuenta", "Your account", "Sua conta")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{stats.farms}</div>
                      <div className="mono lbl">{pick(lang, "Campos", "Fields", "Campos")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{Number(stats.hectares).toLocaleString(pick(lang, "es", "en", "pt"))}</div>
                      <div className="mono lbl">{pick(lang, "Hectáreas totales", "Total hectares", "Hectares totais")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{stats.located}</div>
                      <div className="mono lbl">{pick(lang, "Con ubicación", "With location", "Com localização")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{stats.memberSince ? new Date(stats.memberSince).toLocaleDateString(pick(lang, "es", "en", "pt")) : "—"}</div>
                      <div className="mono lbl">{pick(lang, "Miembro desde", "Member since", "Membro desde")}</div>
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 12 }}>
                    {pick(lang, "Datos reales de tu cuenta.", "Real data from your account.", "Dados reais da sua conta.")}
                  </div>
                </div>
              )}
              <div className="card">
                <div className="mono lbl" style={{ display: "flex", marginBottom: 14 }}>{pick(lang, "Perfil", "Profile", "Perfil")}</div>
                <label className="mono lbl" style={{ display: "flex" }}>{pick(lang, "Nombre", "Name", "Nome")}</label>
                <input
                  value={me ? profName : "María Fernández"}
                  onChange={(e) => setProfName(e.target.value)}
                  readOnly={!me}
                  placeholder={pick(lang, "Tu nombre", "Your name", "Seu nome")}
                  style={{ margin: "6px 0 8px" }}
                />
                {me && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px", flexWrap: "wrap" }}>
                    <button className="btn sm" onClick={submitProfile} disabled={profBusy}>
                      {profBusy ? pick(lang, "Guardando…", "Saving…", "Salvando…") : pick(lang, "Guardar perfil", "Save profile", "Salvar perfil")}
                    </button>
                    {profMsg && <span className="mono lbl" style={{ color: /actualiz|updated|atualiz/i.test(profMsg) ? C.green : C.n1 }}>{profMsg}</span>}
                  </div>
                )}
                <label className="mono lbl">{pick(lang, "Correo", "Email", "E-mail")}</label>
                <input value={me ? (me.user?.email || "") : "maria@campo.ar"} readOnly style={{ margin: "6px 0 12px", opacity: 0.75 }} />
                <label className="mono lbl">{pick(lang, "Teléfono (WhatsApp y SMS)", "Phone (WhatsApp and SMS)", "Telefone (WhatsApp e SMS)")}</label>
                <input defaultValue="+54 358 412 7788" style={{ margin: "6px 0 12px" }} />
                <label className="mono lbl">{pick(lang, "Idioma de las alertas", "Alert language", "Idioma dos alertas")}</label>
                <select className="mono sel" defaultValue="es" aria-label={pick(lang, "Idioma de las alertas", "Alert language", "Idioma dos alertas")} style={{ width: "100%", margin: "6px 0 0" }}>
                  <option value="es">Español</option><option value="en">English</option><option value="pt">Português</option><option value="hi">हिन्दी</option>
                </select>
              </div>

              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 4 }}>{pick(lang, "Canales de notificación", "Notification channels", "Canais de notificação")}</div>
                <Toggle on={wa} set={setWa} label="WhatsApp" sub="+54 358 412 7788" />
                <Toggle on={sms} set={setSms} label="SMS" sub={pick(lang, "funciona sin datos móviles", "works without mobile data", "funciona sem dados móveis")} />
                <Toggle on={mail} set={setMail} label={pick(lang, "Correo", "Email", "E-mail")} sub="maria@campo.ar" />
                <Toggle on={push} set={setPush} label={pick(lang, "Notificación web", "Web push", "Notificação web")} />
                <div className="mono lbl" style={{ margin: "18px 0 4px" }}>{pick(lang, "Frecuencia", "Frequency", "Frequência")}</div>
                <Toggle on={daily} set={setDaily} label={pick(lang, "Resumen diario", "Daily digest", "Resumo diário")} sub={pick(lang, "todos los días a las 06:00", "every day at 06:00", "todos os dias às 06:00")} />
                <Toggle on={weekly} set={setWeekly} label={pick(lang, "Reporte semanal", "Weekly report", "Relatório semanal")} sub={pick(lang, "lunes a las 08:00", "Mondays at 08:00", "segundas às 08:00")} />
              </div>

              <div className="card">
                <div className="mono lbl" style={{ marginBottom: 4 }}>{pick(lang, "Umbrales de alerta", "Alert thresholds", "Limites de alerta")}</div>
                <Slider label={pick(lang, "Incendio: avisar si el riesgo supera", "Wildfire: alert above", "Incêndio: avisar se o risco ultrapassar")} v={thFire} set={setThFire} min={20} max={95} unit="%" c={C.n1} />
                <Slider label={pick(lang, "Inundación: precipitación en 48 h", "Flood: rainfall in 48 h", "Inundação: precipitação em 48 h")} v={thFlood} set={setThFlood} min={10} max={200} unit=" mm" c={C.blue} />
                <Slider label={pick(lang, "Sequía: déficit hídrico", "Drought: water deficit", "Seca: déficit hídrico")} v={thDrought} set={setThDrought} min={10} max={90} unit="%" c={C.n2} />
                <Slider label={pick(lang, "Viento: ráfagas máximas", "Wind: peak gusts", "Vento: rajadas máximas")} v={thWind} set={setThWind} min={20} max={120} unit=" km/h" c={C.blue} />
                <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 12, lineHeight: 1.6 }}>
                  {pick(lang, "Las emergencias urgentes se envían siempre, aunque bajes el umbral.", "Urgent emergencies always go out, even if you lower the threshold.", "As emergências urgentes são sempre enviadas, mesmo que você reduza o limite.")}
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="mono lbl" style={{ marginBottom: 4 }}>{pick(lang, "Reportes automáticos", "Automatic reports", "Relatórios automáticos")}</div>
                  <Toggle on={autoPdf} set={setAutoPdf} label={pick(lang, "Generar PDF en cada alerta urgente", "Generate PDF on every urgent alert", "Gerar PDF em cada alerta urgente")} />
                  <Toggle on={insCopy} set={setInsCopy} label={pick(lang, "Enviar copia a la aseguradora", "Send a copy to my insurer", "Enviar cópia à seguradora")} sub={insCopy ? "claims@aseguradora.com" : pick(lang, "sin destinatario configurado", "no recipient set", "sem destinatário configurado")} />
                </div>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="mono lbl" style={{ marginBottom: 12 }}>{pick(lang, "Suscripción", "Subscription", "Assinatura")}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: C.green }}>${cost}<span style={{ fontSize: 12, color: C.t3, fontWeight: 400 }}>{pick(lang, "/mes", "/mo", "/mês")}</span></span>
                    <span className="mono" style={{ fontSize: 10.5, color: C.t3 }}>$9 + $0.15 × {Number(farm.ha).toLocaleString(pick(lang, "es", "en", "pt"))} ha</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: C.t4, marginTop: 6 }}>{pick(lang, "Próximo cobro: 1 de agosto de 2026", "Next charge: August 1, 2026", "Próxima cobrança: 1 de agosto de 2026")}</div>
                  <button className="btn ghost" style={{ width: "100%", marginTop: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Ic d={ic.dollar} s={14} c={C.t1} /> {pick(lang, "Gestionar pago en Stripe", "Manage billing in Stripe", "Gerenciar pagamento no Stripe")}
                  </button>
                </div>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="mono lbl" style={{ marginBottom: 10 }}>{pick(lang, "Privacidad y datos", "Privacy and data", "Privacidade e dados")}</div>
                  <p style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, margin: "0 0 12px" }}>
                    {pick(lang, "Las coordenadas de tu campo están cifradas con AES-256 y no se comparten con terceros.", "Your field coordinates are AES-256 encrypted and never shared with third parties.", "As coordenadas do seu campo são criptografadas com AES-256 e nunca compartilhadas com terceiros.")}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="mono chipbtn" onClick={doExport} disabled={!me}>{pick(lang, "Exportar mis datos", "Export my data", "Exportar meus dados")}</button>
                    <button className="mono chipbtn" onClick={doDeleteAccount} disabled={!me} style={{ color: C.n1, borderColor: `${C.n1}44` }}>{pick(lang, "Eliminar cuenta", "Delete account", "Excluir conta")}</button>
                  </div>
                  {privMsg && <div className="mono lbl" style={{ marginTop: 10, color: C.n1 }}>{privMsg}</div>}
                  {!me && <div className="mono lbl" style={{ marginTop: 10, color: C.t4 }}>{pick(lang, "Inicia sesión para exportar tus datos reales.", "Log in to export your real data.", "Faça login para exportar os seus dados reais.")}</div>}
                </div>
                {me && (
                  <div className="card" style={{ marginTop: 14 }}>
                    <div className="mono lbl" style={{ marginBottom: 10 }}>{pick(lang, "Cambiar contraseña", "Change password", "Alterar senha")}</div>
                    <label className="mono lbl">{pick(lang, "Contraseña actual", "Current password", "Senha atual")}</label>
                    <input type="password" autoComplete="current-password" value={pwCur} onChange={(e) => setPwCur(e.target.value)} style={{ margin: "6px 0 12px" }} />
                    <label className="mono lbl">{pick(lang, "Nueva contraseña", "New password", "Nova senha")}</label>
                    <input type="password" autoComplete="new-password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder={pick(lang, "mínimo 6 caracteres", "at least 6 characters", "mínimo 6 caracteres")} style={{ margin: "6px 0 12px" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn sm" onClick={submitPassword} disabled={pwBusy}>
                        {pwBusy ? pick(lang, "Guardando…", "Saving…", "Salvando…") : pick(lang, "Actualizar contraseña", "Update password", "Atualizar senha")}
                      </button>
                      {pwMsg && <span className="mono lbl" style={{ color: /actualiz|updated|atualiz/i.test(pwMsg) ? C.green : C.n1 }}>{pwMsg}</span>}
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
const AdminLeads = ({ es, lang = es ? "es" : "en", onBack }) => {
  const t = (esS, enS, ptS) => pick(lang, esS, enS, ptS);
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

  const kinds = [["", t("Todos", "All", "Todos")], ["waitlist", t("Lista de espera", "Waitlist", "Lista de espera")], ["newsletter", t("Boletín", "Newsletter", "Boletim")]];

  return (
    <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 18 }}>← {t("Volver", "Back", "Voltar")}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke={C.green} strokeWidth="1.6" /><circle cx="12" cy="10.5" r="2.6" fill={C.green} /></svg>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{BRAND}</span>
        <span className="mono pill">{t("Administrador", "Admin", "Administrador")}</span>
      </div>

      {!token ? (
        <form onSubmit={login} className="card" style={{ maxWidth: 360, padding: 20 }}>
          <div className="mono lbl" style={{ marginBottom: 10 }}>{t("Acceso de administrador", "Admin access", "Acesso de administrador")}</div>
          <label className="mono lbl">{t("Contraseña", "Password", "Senha")}</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={{ margin: "7px 0 4px" }} autoFocus />
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, opacity: busy ? 0.6 : 1 }}>
            {busy ? t("Entrando…", "Signing in…", "Entrando…") : t("Entrar", "Log in", "Entrar")}
          </button>
          {err && <div style={{ fontSize: 11.5, color: C.n1, marginTop: 10 }}>{err}</div>}
        </form>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {kinds.map(([k, l]) => (
              <button key={k} onClick={() => changeKind(k)} className="mono chipbtn" style={{ borderColor: kind === k ? C.green : C.line, color: kind === k ? C.green : C.t3 }}>{l}</button>
            ))}
            <span className="mono lbl" style={{ marginLeft: "auto" }}>{leads.length} {t("registros", "records", "registros")}</span>
            <button className="btn ghost sm" onClick={exportCsv} disabled={!leads.length}><Ic d={ic.down} s={12} /> CSV</button>
            <button className="btn ghost sm" onClick={() => { setToken(null); setLeads([]); setPw(""); }}>{t("Salir", "Log out", "Sair")}</button>
          </div>
          <div className="card" style={{ overflowX: "auto" }}>
            {loading ? (
              <div className="mono lbl" style={{ padding: 12 }}>{t("Cargando…", "Loading…", "Carregando…")}</div>
            ) : leads.length ? (
              <table>
                <thead><tr>
                  <th>Email</th><th>{t("Tipo", "Kind", "Tipo")}</th><th>{t("Nombre", "Name", "Nome")}</th>
                  <th>{t("País", "Country", "País")}</th><th>ha</th><th>{t("Fecha", "Date", "Data")}</th>
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
              <div className="mono lbl" style={{ padding: 12 }}>{t("Sin registros", "No records", "Sem registros")}</div>
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
      {view === "login" && <Login es={es} lang={lang} onDone={() => setView("app")} onBack={() => setView("landing")} />}
      {view === "app" && <Dashboard es={es} lang={lang} setLang={setLang} onLogout={() => setView("landing")} />}
      {view === "admin" && <AdminLeads es={es} lang={lang} onBack={() => setView("landing")} />}
    </div>
  );
}
