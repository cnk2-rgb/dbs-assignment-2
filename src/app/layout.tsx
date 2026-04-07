import type { Metadata } from "next";
import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import Navigation from "@/components/Navigation";
import SpotifyBar from "@/components/SpotifyBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Productivity App",
  description: "Todo list, journal, and ingredient tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f5f0e8] text-stone-900 font-sans">
        <Navigation />
        <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-8">
          {children}
        </main>
        <SpotifyBar />
      </body>
    </html>
  );
}
