"use client";

import { useState } from "react";
import { api, Category, NewReport, Report } from "@/lib/api";

type Props = {
  categories: Category[];
  draft: { lat: number; lng: number } | null;
  onCreated: (report: Report) => void;
  onCancel: () => void;
};

export default function ReportForm({ categories, draft, onCreated, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [reporterName, setReporterName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) {
      setError("Haz clic en el mapa para marcar la ubicación del reporte.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: NewReport = {
        title,
        category,
        lat: draft.lat,
        lng: draft.lng,
      };
      if (description.trim()) input.description = description.trim();
      if (reporterName.trim()) input.reporter_name = reporterName.trim();
      const created = await api.createReport(input);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el reporte");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <h2 className="font-semibold">Nuevo reporte</h2>

      <div>
        <label htmlFor="nr-title" className="mb-1 block text-xs font-medium text-neutral-600">
          Título *
        </label>
        <input
          id="nr-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué está pasando?"
          className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label htmlFor="nr-category" className="mb-1 block text-xs font-medium text-neutral-600">
          Categoría *
        </label>
        <select
          id="nr-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nr-description" className="mb-1 block text-xs font-medium text-neutral-600">
          Descripción
        </label>
        <textarea
          id="nr-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Detalles adicionales…"
          className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label htmlFor="nr-name" className="mb-1 block text-xs font-medium text-neutral-600">
          Tu nombre (opcional)
        </label>
        <input
          id="nr-name"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>

      <p className="text-xs text-neutral-600">
        {draft
          ? `Ubicación: ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`
          : "Haz clic en el mapa para marcar la ubicación."}
      </p>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Crear reporte"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
