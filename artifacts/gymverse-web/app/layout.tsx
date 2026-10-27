import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Anton, Barlow, Barlow_Condensed } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-barlow-condensed", display: "swap" });
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-barlow", display: "swap" });

const title = "GYMX | Fitness without judgment or distraction";
const description =
  "GYMX is a judgment-free, distraction-free fitness community for beginners, students, lifters, and coaches. Join the early access waitlist or apply to become a founding coach.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "GYMX",
  openGraph: { type: "website", siteName: "GYMX", title, description, url: "/" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#090909",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
