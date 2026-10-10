import { ButtonLink, Container } from "@/components/marketing/ui";

export default function ClosingCta({
  title = "Bring your firm into one clear operating system.",
  lead = "Tell us about your team, your current setup and the workflow you want to fix first. We will map the right CivicFlow plan and onboarding path.",
  secondary = { label: "Compare plans", href: "/pricing" },
}: {
  title?: string;
  lead?: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="bg-ivory pb-20 sm:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-[20px] border border-line bg-porcelain px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
          <div className="mk-hairline-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_90%_at_100%_0%,black,transparent_70%)]" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_auto] lg:items-end">
            <div>
              <h2 className="mk-h2 max-w-2xl text-ink">{title}</h2>
              <p className="mk-lead mt-5 max-w-2xl">{lead}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/get-started" size="lg" arrow>
                Get started
              </ButtonLink>
              <ButtonLink href={secondary.href} variant="outline" size="lg">
                {secondary.label}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
