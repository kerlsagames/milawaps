import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["500", "600", "700", "800"],
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Operation: Teacher Takeover",
  description:
    "Sunny yard tidy tracker for Milawa Primary. Three units, seventy-five squares each, and secret teacher takedowns.",
  applicationName: "Teacher Takeover",
  appleWebApp: {
    capable: true,
    title: "Teacher Takeover",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff6e4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
