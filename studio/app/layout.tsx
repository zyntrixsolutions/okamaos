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
  title: "Okama Studio — AI Game Engine in Your Browser",
  description: "Free AI-powered browser game engine. Build Python/pygame games, earn OKToken, export .ok packages, and publish to OkamaOS — no install required.",
  metadataBase: new URL("https://okamaos.zyntrix.solutions"),
  icons: {
    icon: "/zyntrix-favicon.svg",
    shortcut: "/zyntrix-favicon.svg",
    apple: "/zyntrix-favicon.svg",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://okamaos.zyntrix.solutions",
    title: "Okama Studio — AI Game Engine in Your Browser",
    description: "Build Python/pygame games with AI assistance, export .ok packages, and publish to OkamaOS. Free, no install required.",
    siteName: "Okama Studio",
    images: [{ url: "/okama-labs-logo.svg", width: 512, height: 512, alt: "Okama Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Okama Studio — AI Game Engine in Your Browser",
    description: "Build Python/pygame games with AI, publish to OkamaOS. Free, browser-based.",
    images: ["/okama-labs-logo.svg"],
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
