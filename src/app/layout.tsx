import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CONFIG } from "@/lib/config";
import { PRODUCT, type ProductDefinition } from "@/products";
import "./globals.css";

/**
 * Fontes self-hosted (SIL OFL 1.1 — src/fonts/LICENSE-OFL.txt). Cada produto tem a sua:
 *  - Frédy: Plus Jakarta Sans (títulos e corpo)
 *  - Duda:  Archivo (títulos) + Inter (corpo)
 */
const jakarta = localFont({
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-wght-normal.woff2", style: "normal", weight: "200 800" },
    { path: "../fonts/plus-jakarta-sans-latin-wght-italic.woff2", style: "italic", weight: "200 800" },
    { path: "../fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2", style: "normal", weight: "200 800" },
    { path: "../fonts/plus-jakarta-sans-latin-ext-wght-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-jakarta",
  display: "swap",
  preload: false,
});
const archivo = localFont({
  src: [
    { path: "../fonts/archivo-latin-wght-normal.woff2", style: "normal", weight: "100 900" },
    { path: "../fonts/archivo-latin-ext-wght-normal.woff2", style: "normal", weight: "100 900" },
  ],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
});
const inter = localFont({
  src: [
    { path: "../fonts/inter-latin-wght-normal.woff2", style: "normal", weight: "100 900" },
    { path: "../fonts/inter-latin-ext-wght-normal.woff2", style: "normal", weight: "100 900" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

/** Mapeia as fontes do produto pros tokens genéricos --font-heading / --font-body */
const FONT_SETUP: Record<ProductDefinition["key"], { className: string; vars: React.CSSProperties }> = {
  fredy: {
    className: jakarta.variable,
    vars: { "--font-heading": "var(--font-jakarta)", "--font-body": "var(--font-jakarta)" } as React.CSSProperties,
  },
  duda: {
    className: `${archivo.variable} ${inter.variable}`,
    vars: { "--font-heading": "var(--font-archivo)", "--font-body": "var(--font-inter)" } as React.CSSProperties,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(CONFIG.siteUrl),
  title: {
    default: `${CONFIG.siteName} — Maturidade em IA para ${CONFIG.audience}`,
    template: `%s · ${CONFIG.siteName}`,
  },
  description: CONFIG.description,
  // canonical e og:url no domínio oficial (os endereços *.vercel.app apontam pra ele)
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    locale: "pt_BR",
    siteName: CONFIG.siteName,
    title: `${CONFIG.siteName} — Maturidade em IA para ${CONFIG.audience}`,
    description: CONFIG.description,
  },
  robots: { index: true, follow: true },
  icons: { icon: `/favicon-${PRODUCT.key}.svg` },
};

export const viewport: Viewport = {
  themeColor: PRODUCT.key === "duda" ? "#0f172a" : "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-product={PRODUCT.key} className={FONT_SETUP[PRODUCT.key].className} style={FONT_SETUP[PRODUCT.key].vars}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
