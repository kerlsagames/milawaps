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
  title: "Term 4 Tidy Challenge",
  description:
    "Sunny yard tidy tracker for Milawa Primary. Three units, sixty tidy squares each, a strikes grid, and a prize path.",
  applicationName: "Term 4 Tidy Challenge",
  appleWebApp: {
    capable: true,
    title: "Term 4 Tidy Challenge",
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
