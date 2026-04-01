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
      <meta name="apple-mobile-web-app-title" content="SeasonPulse" />
      <body className="has-bg min-h-full flex flex-col bg-gray-950 text-gray-100">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
