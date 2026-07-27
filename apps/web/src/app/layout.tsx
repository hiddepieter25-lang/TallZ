import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ConsentBanner } from "@/components/ConsentBanner";
import "./globals.css";

// Two families only, per DESIGN.md: Archivo for display/UI/body, JetBrains
// Mono reserved for labels/meta/numbers (section markers, tags, prices).
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        {children}
        <Footer />
        <ConsentBanner />
      </body>
    </html>
  );
}
