import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App-only surfaces with no search value.
      disallow: ["/api/", "/run", "/share", "/offline"],
    },
    sitemap: "https://gungeoncompanion.com/sitemap.xml",
  };
}
