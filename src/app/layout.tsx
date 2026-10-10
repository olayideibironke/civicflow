import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.civicflowapp.org"),
  title: {
    default: "CivicFlow | Modern Law Practice Management",
    template: "%s | CivicFlow",
  },
  description:
    "CivicFlow is modern law practice management software for small firms, bringing matter management, documents, workflows, reporting, client intake, communication, and firm operations into one platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://www.civicflowapp.org",
    siteName: "CivicFlow",
    title: "CivicFlow | Modern Law Practice Management",
    description:
      "Modern law practice management for small firms with straightforward pricing from $30 per user per month.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
