import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.civicflowapp.org"),
  title: {
    default: "CivicFlow | Modern Law Practice Management",
    template: "%s | CivicFlow",
  },
  description:
    "CivicFlow is modern law practice management software for small firms, bringing matter management, documents, workflows, reporting, client intake, communication, and firm operations into one platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://www.civicflowapp.org",
    siteName: "CivicFlow",
    title: "CivicFlow | Modern Law Practice Management",
    description:
      "Modern law practice management for small firms with straightforward pricing from $30 per user per month.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recoveryBootstrap = `
    (function () {
      try {
        var marker = "civicflow_password_recovery";
        var hash = window.location.hash || "";
        var search = window.location.search || "";
        var params = new URLSearchParams(search);
        var isRecovery =
          hash.indexOf("type=recovery") !== -1 ||
          params.get("type") === "recovery";
        var isRecoveryError =
          hash.indexOf("error=access_denied") !== -1 ||
          hash.indexOf("error_code=otp_expired") !== -1 ||
          params.get("error") === "access_denied" ||
          params.get("error_code") === "otp_expired";

        if (isRecovery) {
          window.sessionStorage.setItem(marker, "pending");
        } else if (isRecoveryError) {
          window.sessionStorage.removeItem(marker);
        }

        if (
          (isRecovery || isRecoveryError) &&
          window.location.pathname !== "/reset-password"
        ) {
          window.location.replace("/reset-password" + search + hash);
        }
      } catch (_) {}
    })();
  `;

  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <head>
        <script
          id="civicflow-password-recovery-bootstrap"
          dangerouslySetInnerHTML={{ __html: recoveryBootstrap }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
