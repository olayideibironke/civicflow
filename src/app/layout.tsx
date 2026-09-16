import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.civicflowapp.org"),
  title: {
    default: "CivicFlow | Modern Law Practice Management",
    template: "%s | CivicFlow",
  },
  description:
    "CivicFlow is an early-access law practice management concept for small firms, combining matters, billing, intake, documents, automation, client communication, reporting, mobile workflows, and AI in one platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://www.civicflowapp.org",
    siteName: "CivicFlow",
    title: "CivicFlow | Modern Law Practice Management",
    description:
      "An early-access law practice management concept for small firms, planned from $69 per attorney per month.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
