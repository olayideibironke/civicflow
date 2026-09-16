import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "CivicFlow | Modern Law Practice Management",
    template: "%s | CivicFlow",
  },
  description:
    "CivicFlow is an early-access law practice management concept for small firms, combining matters, billing, intake, documents, automation, client communication, reporting, mobile workflows, and AI in one platform.",
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
