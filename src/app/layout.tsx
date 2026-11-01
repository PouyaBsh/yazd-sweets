import type { Metadata, Viewport } from "next";
import { NoiseOverlay } from "@/components/ui/NoiseOverlay";
import { HERO_CONTENT } from "@/data/yazd-content";
import "./globals.css";

export const metadata: Metadata = {
  title: "شیرینی‌ها و سوغات اصیل یزد",
  description: HERO_CONTENT.tagline,
  keywords: ["یزد", "شیرینی یزدی", "قطاب", "باقلوا", "پشمک", "لوز", "حاجی بادام", "کیک یزدی", "قهوه یزدی"],
  openGraph: {
    title: "شیرینی‌ها و سوغات اصیل یزد",
    description: HERO_CONTENT.tagline,
    locale: "fa_IR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/misc/Farsi-Digits/Vazirmatn-FD-font-face.css"
        />
      </head>
      <body className="min-h-[100dvh] w-full max-w-full bg-canvas font-sans text-ink antialiased">
        {children}
        <NoiseOverlay />
      </body>
    </html>
  );
}
