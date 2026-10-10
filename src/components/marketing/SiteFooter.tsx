import Link from "next/link";
import CivicFlowLogo from "@/components/CivicFlowLogo";
import { ButtonLink, Container } from "@/components/marketing/ui";

const columns = [
  {
    title: "Product",
    links: [
      ["Platform overview", "/platform"],
      ["Client intake", "/platform#intake"],
      ["Matter management", "/platform#matters"],
      ["Documents and activity", "/platform#documents"],
      ["Client portal", "/platform#client-portal"],
      ["Reporting and exports", "/platform#reporting"],
    ],
  },
  {
    title: "Solutions",
    links: [
      ["By practice area", "/use-cases#practice-areas"],
      ["By firm size", "/use-cases#firm-size"],
      ["Legal practice management", "/legal-practice-management"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Pricing", "/pricing"],
      ["Security", "/security"],
      ["Get started", "/get-started"],
    ],
  },
  {
    title: "Sign in",
    links: [
      ["Attorney and firm login", "/attorney-login"],
      ["Client login", "/client-login"],
      ["Account recovery", "/forgot-email"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mk-dark relative overflow-hidden">
      <div className="mk-dark-grid mk-fade-mask pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container className="relative">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.1fr_2fr] lg:py-20">
          <div className="max-w-sm">
            <CivicFlowLogo size="sm" inverted />
            <p className="mt-6 text-[0.95rem] leading-7 text-slate-300">
              Practice management for law firms that want intake, matters, documents, client access and reporting in one disciplined system.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/get-started" variant="light" size="sm">
                Get started
              </ButtonLink>
              <ButtonLink href="/pricing" variant="ghost-dark" size="sm">
                View pricing
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {column.title}
                </p>
                <ul className="mt-4 grid gap-2.5">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-[0.9rem] text-slate-300 transition hover:text-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 py-7 text-[0.8rem] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Westforge. CivicFlow is a Westforge product.</p>
          <p>Plans from $30 per user per month. Billed in USD.</p>
        </div>
      </Container>
    </footer>
  );
}
