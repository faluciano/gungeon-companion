import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
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
  title: "Ammonomicon — Gungeon Run Companion",
  description:
    "Track the guns and items of your current Enter the Gungeon run and discover synergies the moment you find them.",
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
      </body>
    </html>
  );
}
