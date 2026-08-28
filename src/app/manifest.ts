import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ammonomicon — Gungeon Run Companion",
    short_name: "Ammonomicon",
    description:
      "Track the guns and items of your current Enter the Gungeon run and discover synergies the moment you find them.",
    // Installed launches carry a utm tag so they show up as their own source
    // in Vercel Analytics, alongside the Chromium install events.
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#100e0c",
    theme_color: "#100e0c",
    categories: ["games", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
