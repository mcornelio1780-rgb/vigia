import type { MetadataRoute } from "next";

// Vigia es una landing de una sola página (secciones con anclas en "/").
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://vigia.ag/", changeFrequency: "weekly", priority: 1 },
  ];
}
