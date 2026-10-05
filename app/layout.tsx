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
    "Live yard tidy tracker for the school window TV. Three units, one vault, and a principal haircut on the line.",
  applicationName: "Operation: Teacher Takeover",
  appleWebApp: {
    capable: true,
    title: "Teacher Takeover",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fredoka.variable} dark h-full antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
