import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started with CivicFlow",
  description:
    "Tell CivicFlow about your law firm, current software, and preferred plan to begin onboarding.",
  alternates: {
    canonical: "/get-started",
  },
};

export default function GetStartedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
