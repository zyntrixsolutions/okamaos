import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Okama Studio — OkamaLabs Game Engine Platform",
  description: "AI-collaborative pygame game creation studio for OkamaOS by OkamaLabs. Vibe-code cinematic games, learn Python, export .ok packages, and host from your dev server.",
  icons: {
    icon: "/zyntrix-favicon.svg",
    shortcut: "/zyntrix-favicon.svg",
    apple: "/zyntrix-favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#10120f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex bg-ink text-paper antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
