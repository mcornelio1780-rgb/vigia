"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  api,
  assetUrl,
  Category,
  Report,
  ReportStatus,
  Stats,
  STATUS_LABELS,
} from "@/lib/api";
import ReportForm from "@/components/ReportForm";
import AdminBar from "@/components/AdminBar";

const ReportMap = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Cargando mapa…
    </div>
  ),
});

const STATUS_BADGE: Record<ReportStatus, string> = {
  abierto: "bg-red-100 text-red-700",
  en_proceso: "bg-amber-100 text-amber-700",
  resuelto: "bg-emerald-100 text-emerald-700",
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const filters = useMemo(
    () => ({ category: categoryFilter || undefined, status: statusFilter || undefined }),
    [categoryFilter, statusFilter]
  );

  const refresh = useCallback(async () => {
    try {
      const [reportsData, statsData] = await Promise.all([api.reports(filters), api.stats()]);
      setReports(reportsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar con la API");
    }
  }, [filters]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    api.verify().then(setIsAdmin).catch(() => {});
  }, []);

  useEffect(() => {
    // refresh() hace fetch y actualiza el estado tras el await (no es setState síncrono).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function handleStatusChange(report: Report, status: ReportStatus) {
    try {
      await api.updateStatus(report.id, status);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  }

  function handleCreated(report: Report) {
    setCreating(false);
    setDraft(null);
    setSelected(report);
    refresh();
  }

  return (
    <main className="flex h-dvh flex-col bg-white text-neutral-900 md:flex-row">
      <aside className="flex w-full flex-col border-r border-neutral-200 md:w-96">
        <header className="border-b border-neutral-200 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              Vigia <span className="text-sm font-normal text-neutral-500">reportes ciudadanos</span>
            </h1>
            <AdminBar isAdmin={isAdmin} onChange={setIsAdmin} />
          </div>
          {stats && (
            <p className="mt-1 text-xs text-neutral-600">
              {stats.total} reportes ·{" "}
              {stats.by_status.map((s) => `${s.count} ${STATUS_LABELS[s.status].toLowerCase()}`).join(" · ")}
            </p>
          )}
        </header>

        <div className="flex gap-2 border-b border-neutral-200 px-4 py-3">
          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="px-4 py-3">
          {creating ? (
            <ReportForm
              categories={categories}
              draft={draft}
              onCreated={handleCreated}
              onCancel={() => {
                setCreating(false);
                setDraft(null);
              }}
            />
          ) : (
            <button
              onClick={() => {
                setCreating(true);
                setSelected(null);
              }}
              className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              + Nuevo reporte
            </button>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
          {reports.map((r) => (
            <li key={r.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(r);
                }}
                className={`w-full cursor-pointer px-4 py-3 text-left hover:bg-neutral-50 ${
                  selected?.id === r.id ? "bg-neutral-100" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: r.category.color }}
                    />
                    <span className="text-sm font-medium">{r.title}</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="mt-1 pl-[18px] text-xs text-neutral-500">
                  {r.category.name} · {new Date(r.created_at).toLocaleDateString("es-MX")}
                  {r.reporter_name ? ` · ${r.reporter_name}` : ""}
                </p>
                {selected?.id === r.id && (
                  <div className="mt-2 pl-[18px]">
                    {r.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetUrl(r.photo_url)}
                        alt={r.title}
                        className="mb-2 h-40 w-full rounded border border-neutral-200 object-cover"
                      />
                    )}
                    {r.description && <p className="text-xs text-neutral-700">{r.description}</p>}
                    {isAdmin ? (
                      <div className="mt-2 flex gap-1">
                        {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (s !== r.status) handleStatusChange(r, s);
                            }}
                            className={`cursor-pointer rounded border px-2 py-0.5 text-[10px] ${
                              s === r.status
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] italic text-neutral-400">
                        Inicia sesión como admin para cambiar el estado.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
          {!reports.length && !error && (
            <li className="px-4 py-8 text-center text-sm text-neutral-500">
              No hay reportes con estos filtros.
            </li>
          )}
        </ul>
      </aside>

      <section className="min-h-80 flex-1">
        <ReportMap
          reports={reports}
          selected={selected}
          onSelect={setSelected}
          picking={creating}
          draft={draft}
          onPick={(lat, lng) => setDraft({ lat, lng })}
        />
      </section>
    </main>
  );
}
