import Link from "next/link";
import { ButtonLink, Container, Eyebrow } from "@/components/marketing/ui";
import {
  AppWindow,
  CaseDetailScreen,
  ClientAccessCard,
  ClientPortalScreen,
  DocumentChecklist,
  ExportCard,
  FloatCard,
  IntakeArrivalCard,
  IntakeFormCard,
  ReportsScreen,
} from "@/components/marketing/product";

export default function HomeHero() {
  return (
    <section className="mk-hero relative overflow-hidden">
      <div
        className="mk-hairline-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
        aria-hidden="true"
      />

      <Container className="relative py-14 sm:py-18 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
          <div className="mk-rise relative z-10 max-w-[610px]">
            <Eyebrow>Law practice management</Eyebrow>
            <h1 className="mk-h1 mt-6 text-ink">
              Run every matter from first intake to final decision.
            </h1>
            <p className="mk-lead mt-6 max-w-[590px]">
              CivicFlow gives attorneys and staff one disciplined workspace for intake, matters, documents and follow-ups, a secure portal for clients, and reporting that shows exactly where work stands.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/get-started" size="lg" arrow>
                Get started
              </ButtonLink>
              <ButtonLink href="/platform" variant="outline" size="lg">
                Explore the platform
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Plans from $30 per user per month.{" "}
              <Link
                href="/pricing"
                className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                See pricing
              </Link>
            </p>
          </div>

          <div className="mk-rise mk-rise-1">
            <div className="mk-hero-stage" aria-label="CivicFlow product highlights">
              <div className="mk-hero-stage-glow" aria-hidden="true" />

              <div className="mk-hero-scene">
                <div className="mk-hero-scene-tag">Matter workspace</div>
                <AppWindow
                  url="civicflowapp.org/app/cases/cf-1052"
                  label="CivicFlow matter workspace"
                  className="mk-hero-window"
                >
                  <CaseDetailScreen />
                </AppWindow>
                <FloatCard
                  label="Matter document checklist"
                  className="mk-hero-support absolute -right-1 bottom-8 hidden w-[235px] sm:block xl:-right-5"
                >
                  <DocumentChecklist compact />
                </FloatCard>
              </div>

              <div className="mk-hero-scene">
                <div className="mk-hero-scene-tag">Client intake</div>
                <AppWindow
                  url="civicflowapp.org/intake/firm"
                  label="CivicFlow client intake"
                  className="mk-hero-window"
                >
                  <IntakeFormCard />
                </AppWindow>
                <FloatCard
                  label="New matter created from intake"
                  className="mk-hero-support absolute -left-1 bottom-10 hidden w-[238px] sm:block xl:-left-5"
                >
                  <IntakeArrivalCard />
                </FloatCard>
              </div>

              <div className="mk-hero-scene">
                <div className="mk-hero-scene-tag">Client collaboration</div>
                <AppWindow
                  url="civicflowapp.org/client/cases"
                  label="CivicFlow client portal"
                  className="mk-hero-window"
                >
                  <ClientPortalScreen />
                </AppWindow>
                <FloatCard
                  label="Client sharing controls"
                  className="mk-hero-support absolute -right-1 bottom-8 hidden w-[250px] sm:block xl:-right-5"
                >
                  <ClientAccessCard />
                </FloatCard>
              </div>

              <div className="mk-hero-scene">
                <div className="mk-hero-scene-tag">Practice reporting</div>
                <AppWindow
                  url="civicflowapp.org/app/reports"
                  label="CivicFlow practice reporting"
                  className="mk-hero-window"
                >
                  <ReportsScreen />
                </AppWindow>
                <FloatCard
                  label="Excel report export"
                  className="mk-hero-support absolute -right-1 bottom-10 hidden w-[248px] sm:block xl:-right-5"
                >
                  <ExportCard />
                </FloatCard>
              </div>

              <div className="mk-hero-cycle" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
