import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Travelbaby — Curated flight deals for Indian travellers",
  description: "Get alerted when international flights from Delhi, Mumbai, Bangalore & more drop 40%+. Free curated flight deal alerts.",
  openGraph: {
    title: "Travelbaby",
    description: "Curated flight deals for Indian outbound travellers.",
    type: "website",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
