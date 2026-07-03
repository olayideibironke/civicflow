import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CivicFlow | Workflow SaaS by Westforge",
    template: "%s | CivicFlow",
  },
  description:
    "CivicFlow by Westforge helps teams manage intake, cases, documents, notes, follow-ups, and reporting in one clean workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}