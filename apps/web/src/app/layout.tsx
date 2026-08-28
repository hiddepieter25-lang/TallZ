import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One family only, per DESIGN.md — Archivo covers headings, body, and
// labels/meta/prices (globals.css points --font-mono at the same variable).
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// The storefront is the mobile app now. What is left here is the admin panel,
// the privacy policy the app stores require at a public URL, and the two auth
// pages Supabase's emails land on — so there is no public nav or footer.
export const metadata: Metadata = {
  title: "TallZ — Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
