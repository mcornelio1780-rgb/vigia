import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vigia — Inteligencia climática satelital",
    short_name: "Vigia",
    description:
      "Vigia vigila tu campo desde el satélite y te avisa cuando el riesgo de incendio, sequía, inundación, plaga o helada cruza tu umbral.",
    start_url: "/",
    display: "standalone",
    background_color: "#080d0b",
    theme_color: "#080d0b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
