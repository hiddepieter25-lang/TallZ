import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import "./globals.css";

// One family only, per DESIGN.md — Archivo covers headings, body, and
// labels/meta/prices (globals.css points --font-mono at the same variable).
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "TallZ — Fashion, in your size",
  description:
    "A discovery-first marketplace for tall people — trending, tall-fit clothing curated from ASOS Tall, Long Tall Sally, American Tall, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        {children}
        <Footer />
        <ConsentBanner />
      </body>
    </html>
  );
}
