import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Law Practice Management Pricing | $30, $80, $100",
  description:
    "CivicFlow law practice management pricing starts at $30 per user per month, with Pro at $80 and Advanced at $100 for growing small law firms.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
