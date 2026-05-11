import type { Metadata, Viewport } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";

const mainFont = Manrope({
  variable: "--font-main",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "SeasonPulse",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/web-app-manifest-192x192.png", sizes: "192x192" },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "SeasonPulse",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${mainFont.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="has-bg min-h-full flex flex-col bg-gray-950 text-gray-100">
        {children}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
