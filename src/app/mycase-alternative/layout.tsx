import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MyCase Alternative for Small Law Firms",
  description:
    "Compare CivicFlow's planned $69-per-attorney legal practice management approach with MyCase. Explore matters, billing, intake, documents, automation, mobile workflows, AI, and migration verification in one product concept.",
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
