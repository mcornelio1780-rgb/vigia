import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vigia — Inteligencia climática satelital para tu campo",
  description:
    "Vigia vigila tu campo desde el satélite y te avisa por WhatsApp cuando el riesgo de incendio, sequía, inundación, plaga o helada cruza tu umbral. Zona por zona, en cualquier país.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
