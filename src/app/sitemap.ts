import type { MetadataRoute } from "next";
import { SHRINES } from "@/lib/data/shrines";
import { getGameData } from "@/lib/game-data";

const BASE = "https://gungeoncompanion.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/shrines`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/items`, changeFrequency: "monthly", priority: 0.9 },
    ...SHRINES.map((s) => ({
      url: `${BASE}/shrines/${s.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getGameData().items.map((i) => ({
      url: `${BASE}/items/${i.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
