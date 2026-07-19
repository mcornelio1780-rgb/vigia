import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Vigia — Inteligencia climática satelital para tu campo";
const description =
  "Vigia vigila tu campo desde el satélite y te avisa por WhatsApp cuando el riesgo de incendio, sequía, inundación, plaga, helada o viento cruza tu umbral. Zona por zona, en cualquier país. 100% satelital, sin hardware.";

export const metadata: Metadata = {
  metadataBase: new URL("https://vigia.ag"),
  title: {
    default: title,
    template: "%s · Vigia",
  },
  description,
  applicationName: "Vigia",
  keywords: [
    "inteligencia climática",
    "satélite",
    "agricultura",
    "incendios",
    "sequía",
    "NDVI",
    "NASA FIRMS",
    "Sentinel-2",
    "Open-Meteo",
    "alertas de campo",
    "alertas por WhatsApp",
    "teledetección",
    "cooperativas agrícolas",
    "aseguradoras agrícolas",
    "agtech",
  ],
  authors: [{ name: "Vigia" }],
  openGraph: {
    type: "website",
    siteName: "Vigia",
    title,
    description,
    url: "https://vigia.ag",
    locale: "es_ES",
    alternateLocale: ["en_US", "pt_BR"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080d0b",
  width: "device-width",
  initialScale: 1,
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
