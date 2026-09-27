import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import DealTracker from "@/components/DealTracker";
import "./globals.css";

// Body / UI font — Inter is the professional standard for product UIs
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display font for headings — Sora gives a confident, modern editorial feel
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://travelbaby.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Travelbaby — Curated flight deals for Indian travellers",
    template: "%s | Travelbaby",
  },
  description:
    "Get alerted when international flights from Delhi, Mumbai, Bengaluru & more drop — up to 90% off. Free curated flight deal alerts for Indian travellers.",
  applicationName: "Travelbaby",
  keywords: [
    "flight deals",
    "cheap flights from India",
    "international flight deals India",
    "Delhi flight deals",
    "Mumbai flight deals",
    "error fares India",
    "flight deal alerts",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Travelbaby — Curated flight deals for Indian travellers",
    description:
      "Handpicked international flight deals from Indian metros — up to 90% off. Free alerts, no booking markups.",
    url: "/",
    siteName: "Travelbaby",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travelbaby — Curated flight deals for Indian travellers",
    description:
      "Handpicked international flight deals from Indian metros — up to 90% off.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <GoogleAnalytics />
        <DealTracker />
      </body>
    </html>
  );
}
