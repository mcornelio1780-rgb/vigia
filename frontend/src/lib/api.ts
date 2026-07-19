const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Category = {
  id: number;
  slug: string;
  name: string;
  color: string;
};

export type ReportStatus = "abierto" | "en_proceso" | "resuelto";

export type Report = {
  id: string;
  title: string;
  description: string | null;
  status: ReportStatus;
  reporter_name: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  lat: number;
  lng: number;
  category: Category;
};

export type Stats = {
  total: number;
  by_status: { status: ReportStatus; count: number }[];
  by_category: { slug: string; name: string; color: string; count: number }[];
};

export type ReportFilters = {
  category?: string;
  status?: string;
};

export type NewReport = {
  title: string;
  description?: string;
  category: string;
  lat: number;
  lng: number;
  reporter_name?: string;
  photo_url?: string;
};

const TOKEN_KEY = "vigia_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// Convierte una ruta relativa (/uploads/...) en URL absoluta hacia la API.
export function assetUrl(path: string): string {
  return path.startsWith("/uploads") ? `${API_URL}${path}` : path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  categories: () => request<Category[]>("/api/categories"),

  reports: (filters: ReportFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    const qs = params.toString();
    return request<Report[]>(`/api/reports${qs ? `?${qs}` : ""}`);
  },

  stats: () => request<Stats>("/api/stats"),

  createReport: (input: NewReport) =>
    request<Report>("/api/reports", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateStatus: (id: string, status: ReportStatus) =>
    request<Report>(`/api/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Sube una imagen (multipart) y devuelve su ruta relativa en la API.
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${API_URL}/api/uploads`, { method: "POST", body: form });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? "No se pudo subir la imagen");
    return body.url as string;
  },

  async login(password: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? "No se pudo iniciar sesión");
    setToken(body.token);
  },

  logout: () => clearToken(),

  // Verifica que el token guardado siga siendo válido.
  async verify(): Promise<boolean> {
    if (!getToken()) return false;
    try {
      await request("/api/auth/me");
      return true;
    } catch {
      clearToken();
      return false;
    }
  },
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  abierto: "Abierto",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};
