import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 24,
        background: "#080d0b",
        color: "#E8F2EA",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21c-4.5-2-7-6-7-10a7 7 0 0114 0c0 4-2.5 8-7 10z" stroke="#3DDC84" strokeWidth="1.6" />
          <circle cx="12" cy="10.5" r="2.6" fill="#3DDC84" />
        </svg>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Vigia</span>
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, color: "#3DDC84", lineHeight: 1 }}>404</div>
      <p style={{ fontSize: 15, color: "#93AC9C", maxWidth: 420, lineHeight: 1.55, margin: 0 }}>
        Esta página no existe o se movió. El satélite sigue vigilando tu campo — volvamos al inicio.
        <br />
        <span style={{ fontSize: 13 }}>This page doesn&apos;t exist. Let&apos;s head back home. · Esta página não existe. Voltar ao início.</span>
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 18px",
          borderRadius: 10,
          background: "#3DDC84",
          color: "#04140B",
          fontSize: 14,
          fontWeight: 650,
          textDecoration: "none",
        }}
      >
        Volver al inicio · Home · Início
      </Link>
    </main>
  );
}
