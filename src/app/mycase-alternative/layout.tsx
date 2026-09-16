import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MyCase Alternative for Small Law Firms",
  description:
    "Compare CivicFlow with MyCase for small law firms. CivicFlow plans are priced at $30 Basic, $80 Pro, and $100 Advanced per user per month.",
  alternates: {
    canonical: "/mycase-alternative",
  },
};

export default function MyCaseAlternativeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
