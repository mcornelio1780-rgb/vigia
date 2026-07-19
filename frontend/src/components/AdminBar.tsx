"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type Props = {
  isAdmin: boolean;
  onChange: (isAdmin: boolean) => void;
};

// Control de sesión de administrador. Un ciudadano solo consulta; un
// administrador autenticado puede cambiar el estado de los reportes.
export default function AdminBar({ isAdmin, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(password);
      setPassword("");
      setOpen(false);
      onChange(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  if (isAdmin) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
          Admin
        </span>
        <button
          type="button"
          onClick={() => {
            api.logout();
            onChange(false);
          }}
          className="text-neutral-500 hover:text-neutral-800 hover:underline"
        >
          Salir
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 hover:text-neutral-800 hover:underline"
      >
        Entrar como admin
      </button>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex items-center gap-1">
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-28 rounded border border-neutral-300 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Entrar
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="px-1 text-xs text-neutral-500 hover:text-neutral-800"
        aria-label="Cancelar"
      >
        ✕
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
