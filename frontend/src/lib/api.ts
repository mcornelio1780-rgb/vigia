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
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
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
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  abierto: "Abierto",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};
