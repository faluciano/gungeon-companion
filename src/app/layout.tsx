import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PwaSetup from "@/components/PwaSetup";
import "./globals.css";

// Only the weights the UI actually uses (regular, semibold, bold).
const display = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#100e0c",
  // Let the app paint under the notch/home bar; safe-area insets pad it back.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gungeoncompanion.com"),
  title: {
    default: "Ammonomicon — Enter the Gungeon Run Companion",
    template: "%s · Ammonomicon",
  },
  description:
    "Track the guns and items of your current Enter the Gungeon run and discover synergies the moment you find them.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Ammonomicon",
    title: "Ammonomicon — Enter the Gungeon Run Companion",
    description:
      "Track the guns and items of your current Enter the Gungeon run and discover synergies the moment you find them.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Ammonomicon — Enter the Gungeon Run Companion",
    description:
      "Track the guns and items of your current Enter the Gungeon run and discover synergies the moment you find them.",
  },
  appleWebApp: {
    title: "Ammonomicon",
    // The layout already paints under the notch; keep the status bar transparent.
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="pointer-events-none fixed inset-0 z-0 bg-grid" aria-hidden />
        <div className="pointer-events-none fixed inset-0 z-0 bg-vignette" aria-hidden />
        <div className="pointer-events-none fixed inset-0 z-0 bg-noise" aria-hidden />
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
        <PwaSetup />
        <Analytics />
      </body>
    </html>
  );
}
