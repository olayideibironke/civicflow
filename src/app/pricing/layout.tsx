import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Law Practice Management Pricing | Planned $69",
  description:
    "CivicFlow is validating straightforward law practice management pricing planned from $69 per attorney per month, with everyday firm capabilities in one core product instead of a ladder of paid feature gates.",
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
