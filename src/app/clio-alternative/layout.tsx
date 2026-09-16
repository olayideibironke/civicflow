import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clio Alternative for Small Law Firms",
  description:
    "Explore CivicFlow as a straightforward Clio alternative for small law firms, with plans at $30 Basic, $80 Pro, and $100 Advanced per user per month.",
  alternates: {
    canonical: "/clio-alternative",
  },
};

export default function ClioAlternativeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
