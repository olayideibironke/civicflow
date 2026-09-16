import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clio Alternative for Small Law Firms",
  description:
    "Explore CivicFlow's early-access law practice management concept for small firms seeking a simpler, more consolidated alternative to Clio with planned pricing from $69 per attorney per month.",
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
