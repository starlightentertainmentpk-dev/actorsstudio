import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Actor's Studio - Talent Marketplace Pakistan",
  description: "Actor's Studio is Pakistan's premier production-grade talent marketplace, connecting actors, models, voice artists, and performers with top producers and brands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-brand-500/20 selection:text-brand-600 dark:selection:text-brand-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
